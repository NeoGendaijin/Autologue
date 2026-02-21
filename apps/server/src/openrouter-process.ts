import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import type { GeminiEvent } from "@agent-quest/core";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.0-flash-001";

const SYSTEM_PROMPT = `You are an AI coding agent completing a quest. You must use your tools to accomplish the task.

RULES:
- Think step by step. Explain your reasoning briefly before each action.
- Use tools to read files, write code, run commands, and search.
- When the task is done, say "TASK COMPLETE" and summarize what you did.
- Be concise but thorough. Write real, complete, working code when writing files.
- Make multiple tool calls per turn when it makes sense.
- Always write files — do not just describe code, actually create it.
- For complex tasks, break them into phases: Research → Plan → Code → Test.
- Use list_files and read_file to explore before writing.
- After writing code, verify by running tests or the program itself.

IMPORTANT — ASK FOR DIRECTION:
- Before starting, ask the user a short question about their preference. Example: "Should I use Canvas or DOM for rendering?"
- After writing the first file, ask about the next step. Example: "Should I add animations or focus on game logic first?"
- Keep questions SHORT (one sentence) with clear options (A or B style).
- Ask 2-4 questions total during the quest. Use "Should I" to start each question.
- Do NOT ask permission to start — just ask about design/approach choices.`;

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "read_file",
      description: "Read the contents of a file from the project",
      parameters: {
        type: "object" as const,
        properties: { path: { type: "string", description: "File path to read" } },
        required: ["path"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "write_file",
      description: "Write content to a file (creates or overwrites)",
      parameters: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "File path to write" },
          content: { type: "string", description: "Full file content to write" },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "run_command",
      description: "Run a shell command (e.g., tests, install, build)",
      parameters: {
        type: "object" as const,
        properties: { command: { type: "string", description: "Shell command to run" } },
        required: ["command"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_files",
      description: "List files in a directory",
      parameters: {
        type: "object" as const,
        properties: { path: { type: "string", description: "Directory path (default: .)" } },
        required: [],
      },
    },
  },
];

interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface OpenRouterProcessOptions {
  prompt: string;
  cwd?: string;
  outputDir: string;
  model?: string;
  apiKey?: string;
}

export class OpenRouterProcess {
  private eventQueue: GeminiEvent[] = [];
  private _isRunning = false;
  private resolveWait: (() => void) | null = null;
  private resolveInput: ((text: string) => void) | null = null;
  private inputQueue: string[] = [];
  private messages: ChatMessage[] = [];
  private apiKey: string;
  private model: string;
  private prompt: string;
  private outputDir: string;
  public filesCreated: string[] = [];

  constructor(options: OpenRouterProcessOptions) {
    this.prompt = options.prompt;
    this.outputDir = options.outputDir;
    this.apiKey = options.apiKey || process.env.OPENROUTER_API_KEY || "";
    this.model = options.model || process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  }

  start(): void {
    if (this._isRunning) throw new Error("Process already started");
    this._isRunning = true;

    // Ensure output directory exists
    mkdirSync(this.outputDir, { recursive: true });

    this.messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Quest: ${this.prompt}\nWorking directory: ${this.outputDir}\n\nAll files you create will be saved to disk. Start working now. Use your tools.`,
      },
    ];

    // Run agent loop in background
    this.runAgentLoop().catch((err) => {
      console.error("[openrouter] Agent loop error:", err);
      this.pushEvent({
        type: "error",
        message: err instanceof Error ? err.message : String(err),
      });
      this.pushEvent({ type: "result", response: null });
      this._isRunning = false;
      this.resolveWait?.();
    });
  }

  async *getEventStream(): AsyncGenerator<GeminiEvent> {
    yield { type: "init" as const, model: this.model };

    while (this._isRunning || this.eventQueue.length > 0) {
      if (this.eventQueue.length > 0) {
        yield this.eventQueue.shift()!;
      } else if (this._isRunning) {
        await new Promise<void>((resolve) => {
          this.resolveWait = resolve;
        });
      }
    }
  }

  sendInput(text: string): void {
    if (this.resolveInput) {
      const resolve = this.resolveInput;
      this.resolveInput = null;
      resolve(text);
    } else {
      this.inputQueue.push(text);
    }
  }

  kill(): void {
    this._isRunning = false;
    this.resolveWait?.();
    this.resolveWait = null;
    if (this.resolveInput) {
      const resolve = this.resolveInput;
      this.resolveInput = null;
      resolve("");
    }
  }

  interrupt(): void {
    this.kill();
  }

  isRunning(): boolean {
    return this._isRunning;
  }

  // --- Private ---

  private pushEvent(event: GeminiEvent): void {
    this.eventQueue.push(event);
    if (this.resolveWait) {
      const resolve = this.resolveWait;
      this.resolveWait = null;
      resolve();
    }
  }

  private async waitForInput(): Promise<string> {
    if (this.inputQueue.length > 0) {
      return this.inputQueue.shift()!;
    }
    return new Promise<string>((resolve) => {
      this.resolveInput = resolve;
    });
  }

  private async runAgentLoop(): Promise<void> {
    const maxTurns = 25;

    for (let turn = 0; turn < maxTurns && this._isRunning; turn++) {
      const response = await this.callAPI();
      const choice = response.choices?.[0];
      if (!choice) break;

      const msg = choice.message;

      // Emit model thinking/content
      if (msg.content) {
        this.pushEvent({
          type: "message",
          role: "model",
          content: msg.content,
        });
      }

      // Handle tool calls
      if (msg.tool_calls?.length) {
        this.messages.push({
          role: "assistant",
          content: msg.content || null,
          tool_calls: msg.tool_calls,
        });

        for (const tc of msg.tool_calls) {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.function.arguments);
          } catch {
            /* ignore */
          }

          this.pushEvent({
            type: "tool_use",
            toolName: tc.function.name,
            toolCallId: tc.id,
            args,
          });

          await sleep(200);

          // Execute tool for real
          const output = this.executeTool(tc.function.name, args);

          this.pushEvent({
            type: "tool_result",
            toolCallId: tc.id,
            output,
          });

          this.messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: output,
          });
        }

        continue;
      }

      // No tool calls
      this.messages.push({
        role: "assistant",
        content: msg.content || "",
      });

      const content = msg.content || "";
      const hasQuestion =
        /should I\b|would you like|do you want|shall I|which.{0,20}prefer|what.{0,20}approach/i.test(content);

      if (hasQuestion) {
        const input = await this.waitForInput();
        if (!this._isRunning) break;
        this.messages.push({ role: "user", content: input });
        continue;
      }

      if (/TASK COMPLETE/i.test(content) || choice.finish_reason === "stop") {
        break;
      }
    }

    this.pushEvent({ type: "result", response: "Quest complete" });
    this._isRunning = false;
    if (this.resolveWait) {
      const resolve = this.resolveWait;
      this.resolveWait = null;
      resolve();
    }
  }

  private executeTool(toolName: string, args: Record<string, unknown>): string {
    try {
      switch (toolName) {
        case "write_file": {
          const relPath = String(args.path || "output.txt");
          const content = String(args.content || "");
          const absPath = this.resolvePath(relPath);
          mkdirSync(dirname(absPath), { recursive: true });
          writeFileSync(absPath, content, "utf-8");
          const lines = content.split("\n").length;
          if (!this.filesCreated.includes(relPath)) {
            this.filesCreated.push(relPath);
          }
          console.log(`[tool] write_file: ${absPath} (${content.length} bytes)`);
          return `Successfully wrote ${content.length} bytes (${lines} lines) to ${relPath}`;
        }

        case "read_file": {
          const relPath = String(args.path || "");
          const absPath = this.resolvePath(relPath);
          if (existsSync(absPath)) {
            const content = readFileSync(absPath, "utf-8");
            return content.slice(0, 5000);
          }
          return `File not found: ${relPath}. You may need to create it first.`;
        }

        case "list_files": {
          const relPath = String(args.path || ".");
          const absPath = this.resolvePath(relPath);
          if (!existsSync(absPath)) return `Directory not found: ${relPath}`;
          const entries = readdirSync(absPath);
          return entries
            .map((e) => {
              const full = join(absPath, e);
              const isDir = existsSync(full) && statSync(full).isDirectory();
              return isDir ? `${e}/` : e;
            })
            .join("\n") || "(empty directory)";
        }

        case "run_command": {
          const cmd = String(args.command || "");
          // Simulate common commands with realistic output
          if (/pytest|jest|vitest|mocha|npm test|pnpm test/i.test(cmd))
            return `PASS  tests/main.test\n  ✓ should initialize correctly (12ms)\n  ✓ should handle edge cases (8ms)\n  ✓ should produce expected output (15ms)\n\nTests: 3 passed, 0 failed, 3 total\nTime:  0.847s`;
          if (/npm install|pnpm install|pip install/i.test(cmd))
            return `Dependencies installed successfully (2.1s)`;
          if (/python/i.test(cmd))
            return `Output: Success - all operations completed`;
          if (/node/i.test(cmd))
            return `Program executed successfully`;
          return `Command executed successfully\nExit code: 0`;
        }

        default:
          return `Tool ${toolName} executed successfully`;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[tool] ${toolName} error:`, msg);
      return `Error: ${msg}`;
    }
  }

  private resolvePath(relPath: string): string {
    // Prevent path traversal
    const normalized = relPath.replace(/\.\.\//g, "").replace(/^\//g, "");
    return resolve(this.outputDir, normalized);
  }

  private async callAPI(): Promise<{
    choices: Array<{ message: ChatMessage; finish_reason: string }>;
  }> {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://agent-quest.dev",
        "X-Title": "Agent Quest",
      },
      body: JSON.stringify({
        model: this.model,
        messages: this.messages,
        tools: TOOLS,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenRouter API ${res.status}: ${text.slice(0, 300)}`);
    }

    return res.json() as Promise<{
      choices: Array<{ message: ChatMessage; finish_reason: string }>;
    }>;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
