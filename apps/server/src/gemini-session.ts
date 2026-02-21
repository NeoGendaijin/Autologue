import { EventEmitter } from "eventemitter3";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";
import {
  EventMapper,
  GeminiProcess,
  createInitialState,
  reduceGameEvent,
  createQuest,
  buildQuestResult,
  executeTactic,
  type GeminiEvent,
  type GameEvent,
  type GameState,
  type TacticType,
} from "@agent-quest/core";
import { OpenRouterProcess } from "./openrouter-process.js";

export interface GeminiSessionOptions {
  prompt: string;
  cwd?: string;
  mode: "expert" | "adventure";
}

interface SessionEvents {
  "game-event": (event: GameEvent) => void;
  "state-update": (state: GameState) => void;
}

type AgentBackend = "openrouter" | "gemini-cli";

interface AgentRuntime {
  start: () => void;
  getEventStream: () => AsyncGenerator<GeminiEvent>;
  sendInput: (text: string) => void;
  kill: () => void;
  isRunning: () => boolean;
  filesCreated?: string[];
}

function resolveAgentBackend(): AgentBackend {
  const raw = (process.env.AGENT_BACKEND ?? "openrouter").toLowerCase();
  if (raw === "gemini" || raw === "gemini-cli" || raw === "gemini_cli") {
    return "gemini-cli";
  }
  return "openrouter";
}

export class GeminiSession extends EventEmitter<SessionEvents> {
  private process: AgentRuntime | null = null;
  private mapper: EventMapper;
  private state: GameState;
  private eventLog: GameEvent[] = [];
  private options: GeminiSessionOptions;
  private outputDir: string = "";
  private backend: AgentBackend;

  constructor(options: GeminiSessionOptions) {
    super();
    this.options = options;
    this.mapper = new EventMapper();
    this.state = createInitialState();
    this.state = { ...this.state, mode: options.mode };
    this.backend = resolveAgentBackend();
  }

  async start(): Promise<void> {
    const quest = createQuest({
      description: this.options.prompt,
      cwd: this.options.cwd,
    });

    // Create output directory for this quest
    this.outputDir = resolve(process.cwd(), "output", quest.id);
    mkdirSync(this.outputDir, { recursive: true });
    console.log(`[session] Output directory: ${this.outputDir}`);

    // Apply QUEST_START event
    const questStartEvent: GameEvent = { type: "QUEST_START", quest };
    this.applyEvent(questStartEvent);

    // Log the output dir
    this.applyEvent({
      type: "LOG",
      message: `Output: ${this.outputDir}`,
      logType: "info",
    });

    // If the opening prompt already exhausted the party, don't start the model loop.
    if (this.state.phase === "game-over") {
      return;
    }

    // Create and start coding process (OpenRouter or Gemini CLI)
    console.log(`[session] Agent backend: ${this.backend}`);
    this.process = this.createProcess(this.options.prompt);
    this.process.start();
    await this.consumeProcessEvents();

    // Quest finished — emit completion if still running
    this.completeQuestIfActive();
  }

  handlePlayerChoice(choiceIndex: number, responseText: string): void {
    if (!this.process) return;

    this.process.sendInput(responseText);

    const event: GameEvent = {
      type: "PLAYER_CHOICE",
      choiceIndex,
      response: responseText,
    };
    this.applyEvent(event);
  }

  handleTactic(tactic: TacticType): void {
    if (!this.process) return;

    const result = executeTactic(tactic);
    this.process.sendInput(result.stdinCommand);

    const tacticEvent: GameEvent = {
      type: "TACTIC_USED",
      tactic,
      effect: result.effectDescription,
    };
    this.applyEvent(tacticEvent);

    if (result.contextRecovery > 0) {
      const newUsed = Math.max(0, this.state.contextUsed - result.contextRecovery);
      const contextEvent: GameEvent = {
        type: "CONTEXT_UPDATE",
        used: newUsed,
        max: this.state.contextMax,
      };
      this.applyEvent(contextEvent);
    }
  }

  async revive(): Promise<void> {
    if (this.state.phase !== "game-over") return;

    // Apply revive event (+100K context)
    this.applyEvent({ type: "REVIVE", addedContext: 100_000 });

    // Restart coding process to continue the quest
    this.process = this.createProcess(`Continue the previous task: ${this.options.prompt}`);
    this.process.start();
    await this.consumeProcessEvents();
    this.completeQuestIfActive();
  }

  private async consumeProcessEvents(): Promise<void> {
    if (!this.process) return;
    try {
      for await (const geminiEvent of this.process.getEventStream()) {
        const gameEvents = this.mapper.map(geminiEvent);
        for (const gameEvent of gameEvents) {
          this.applyEvent(gameEvent);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown stream error";
      this.applyEvent({
        type: "ERROR",
        message,
        severity: "fatal",
      });
    }
  }

  private completeQuestIfActive(): void {
    if (this.state.phase === "running" || this.state.phase === "question") {
      const result = buildQuestResult(this.state);
      result.outputDir = this.outputDir;
      result.filesCreated = this.process?.filesCreated ?? [];
      result.fileContents = this.readOutputFiles(result.filesCreated);
      this.applyEvent({ type: "QUEST_COMPLETE", result });
    }
  }

  private createProcess(prompt: string): AgentRuntime {
    if (this.backend === "gemini-cli") {
      return new GeminiProcess({
        prompt,
        cwd: this.options.cwd || this.outputDir,
        model: process.env.GEMINI_MODEL,
        binaryPath: process.env.GEMINI_CLI_PATH,
      });
    }

    return new OpenRouterProcess({
      prompt,
      cwd: this.options.cwd,
      outputDir: this.outputDir,
    });
  }

  getOutputDir(): string {
    return this.outputDir;
  }

  getState(): GameState {
    return this.state;
  }

  getEventLog(): GameEvent[] {
    return this.eventLog;
  }

  destroy(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.removeAllListeners();
  }

  private readOutputFiles(files: string[]): Record<string, string> {
    const contents: Record<string, string> = {};
    for (const relPath of files) {
      const absPath = this.resolveOutputPath(relPath);
      if (!absPath || !existsSync(absPath)) {
        continue;
      }

      try {
        const raw = readFileSync(absPath, "utf-8");
        // Truncate to 10KB per file to keep payload reasonable
        contents[relPath] = raw.slice(0, 10_000);
      } catch {
        contents[relPath] = "(Could not read file)";
      }
    }
    return contents;
  }

  private resolveOutputPath(relPath: string): string | null {
    const target = resolve(this.outputDir, relPath);
    const rel = relative(this.outputDir, target);
    if (rel.startsWith("..") || isAbsolute(rel)) {
      return null;
    }
    return target;
  }

  private applyEvent(event: GameEvent): void {
    const prevPhase = this.state.phase;
    this.eventLog.push(event);
    this.state = reduceGameEvent(this.state, event);
    if (prevPhase !== "game-over" && this.state.phase === "game-over" && this.process?.isRunning()) {
      this.process.kill();
    }
    this.emit("game-event", event);
    this.emit("state-update", this.state);
  }
}
