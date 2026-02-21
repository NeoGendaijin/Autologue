import { spawn, type ChildProcess } from "node:child_process";
import { createGeminiEventStream } from "./parser.js";
import type { GeminiEvent } from "./types.js";

export interface GeminiProcessOptions {
  /** Initial prompt for the quest */
  prompt: string;
  /** Working directory for the coding task */
  cwd?: string;
  /** Model override */
  model?: string;
  /** Additional environment variables */
  env?: Record<string, string>;
  /** Path to gemini CLI binary (defaults to "gemini") */
  binaryPath?: string;
}

export class GeminiProcess {
  private child: ChildProcess | null = null;
  private options: GeminiProcessOptions;
  private _isRunning = false;

  constructor(options: GeminiProcessOptions) {
    this.options = options;
  }

  /**
   * Start the Gemini CLI process with stream-json output.
   */
  start(): void {
    if (this.child) {
      throw new Error("Process already started");
    }

    const binary = this.options.binaryPath ?? "gemini";
    const args: string[] = [
      "-p",
      this.options.prompt,
      "--output-format",
      "stream-json",
    ];

    if (this.options.model) {
      args.push("-m", this.options.model);
    }

    this.child = spawn(binary, args, {
      cwd: this.options.cwd,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        ...this.options.env,
      },
    });

    this._isRunning = true;

    this.child.on("exit", (code, signal) => {
      this._isRunning = false;
      console.log(
        `[gemini] Process exited with code ${code}, signal ${signal}`
      );
    });

    this.child.on("error", (err) => {
      this._isRunning = false;
      console.error("[gemini] Process error:", err.message);
    });

    // Log stderr for debugging
    this.child.stderr?.on("data", (data: Buffer) => {
      console.warn("[gemini:stderr]", data.toString().trim());
    });
  }

  /**
   * Get an async generator of parsed Gemini events from stdout.
   */
  getEventStream(): AsyncGenerator<GeminiEvent> {
    if (!this.child?.stdout) {
      throw new Error("Process not started or stdout not available");
    }
    return createGeminiEventStream(this.child.stdout);
  }

  /**
   * Write text to the process stdin (for relaying player responses).
   */
  sendInput(text: string): void {
    if (!this.child?.stdin || !this._isRunning) {
      console.warn("[gemini] Cannot send input: process not running");
      return;
    }
    this.child.stdin.write(text + "\n");
  }

  /**
   * Send interrupt signal (SIGINT) to the process.
   */
  interrupt(): void {
    this.child?.kill("SIGINT");
  }

  /**
   * Kill the process.
   */
  kill(): void {
    if (this.child && this._isRunning) {
      this.child.kill("SIGTERM");
      this._isRunning = false;
    }
  }

  /**
   * Check if the process is still running.
   */
  isRunning(): boolean {
    return this._isRunning;
  }
}
