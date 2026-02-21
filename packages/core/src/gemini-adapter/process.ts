import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";
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
  /**
   * Optional Node runtime used to execute the Gemini CLI script directly.
   * Useful when current process runs on older Node but Gemini CLI requires newer features.
   */
  nodePath?: string;
}

export class GeminiProcess {
  private child: ChildProcess | null = null;
  private options: GeminiProcessOptions;
  private _isRunning = false;
  private _exitCode: number | null = null;
  private _exitSignal: NodeJS.Signals | null = null;
  private _spawnError: string | null = null;
  private _stderrTail: string[] = [];

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

    const spawnCommand = this.options.nodePath ?? binary;
    const spawnArgs = this.options.nodePath ? [binary, ...args] : args;

    const keyFromOptions = this.options.env?.GEMINI_API_KEY;
    const keyFromGoogleOption = this.options.env?.GOOGLE_API_KEY;
    const inheritedKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    const geminiApiKey = keyFromOptions || keyFromGoogleOption || inheritedKey;

    const defaultGeminiCliHome =
      this.options.cwd != null
        ? resolve(this.options.cwd, ".gemini-cli-home")
        : resolve(process.cwd(), ".gemini-cli-home");

    const childEnv: NodeJS.ProcessEnv = {
      ...process.env,
      ...this.options.env,
      // Force API-key mode for headless automation.
      GEMINI_DEFAULT_AUTH_TYPE:
        this.options.env?.GEMINI_DEFAULT_AUTH_TYPE ??
        process.env.GEMINI_DEFAULT_AUTH_TYPE ??
        "gemini-api-key",
      // Isolate CLI auth/settings so a stale OAuth preference does not break API-key runs.
      GEMINI_CLI_HOME:
        this.options.env?.GEMINI_CLI_HOME ??
        process.env.GEMINI_CLI_HOME ??
        defaultGeminiCliHome,
    };

    if (geminiApiKey) {
      childEnv.GEMINI_API_KEY = geminiApiKey;
      childEnv.GOOGLE_API_KEY = geminiApiKey;
    }

    this.child = spawn(spawnCommand, spawnArgs, {
      cwd: this.options.cwd,
      stdio: ["pipe", "pipe", "pipe"],
      env: childEnv,
    });

    this._isRunning = true;
    this._exitCode = null;
    this._exitSignal = null;
    this._spawnError = null;
    this._stderrTail = [];

    this.child.on("exit", (code, signal) => {
      this._isRunning = false;
      this._exitCode = code ?? null;
      this._exitSignal = signal;
      console.log(
        `[gemini] Process exited with code ${code}, signal ${signal}`
      );
    });

    this.child.on("error", (err) => {
      this._isRunning = false;
      this._spawnError = err.message;
      console.error("[gemini] Process error:", err.message);
    });

    // Log stderr for debugging
    this.child.stderr?.on("data", (data: Buffer) => {
      const text = data.toString().trim();
      if (text) {
        this._stderrTail.push(text);
        if (this._stderrTail.length > 8) {
          this._stderrTail.shift();
        }
      }
      console.warn("[gemini:stderr]", text);
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

  /**
   * Best-effort diagnostic for abnormal Gemini CLI exits.
   */
  getLastError(): string | null {
    if (this._spawnError) {
      return this._spawnError;
    }

    if (this._stderrTail.length > 0) {
      return this._stderrTail[this._stderrTail.length - 1];
    }

    if (this._exitCode !== null && this._exitCode !== 0) {
      return `Gemini CLI exited with code ${this._exitCode}`;
    }

    if (this._exitSignal) {
      return `Gemini CLI terminated by signal ${this._exitSignal}`;
    }

    return null;
  }
}
