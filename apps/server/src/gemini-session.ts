import { EventEmitter } from "eventemitter3";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import {
  EventMapper,
  createInitialState,
  reduceGameEvent,
  createQuest,
  buildQuestResult,
  executeTactic,
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

export class GeminiSession extends EventEmitter<SessionEvents> {
  private process: OpenRouterProcess | null = null;
  private mapper: EventMapper;
  private state: GameState;
  private eventLog: GameEvent[] = [];
  private options: GeminiSessionOptions;
  private outputDir: string = "";

  constructor(options: GeminiSessionOptions) {
    super();
    this.options = options;
    this.mapper = new EventMapper();
    this.state = createInitialState();
    this.state = { ...this.state, mode: options.mode };
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

    // Create and start the OpenRouter process
    this.process = new OpenRouterProcess({
      prompt: this.options.prompt,
      cwd: this.options.cwd,
      outputDir: this.outputDir,
    });
    this.process.start();

    // Iterate the event stream
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

    // Quest finished — emit completion if still running
    if (this.state.phase === "running" || this.state.phase === "question") {
      const result = buildQuestResult(this.state);
      result.outputDir = this.outputDir;
      result.filesCreated = this.process?.filesCreated ?? [];
      result.fileContents = this.readOutputFiles(result.filesCreated);
      this.applyEvent({ type: "QUEST_COMPLETE", result });
    }
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
      const absPath = join(this.outputDir, relPath.replace(/\.\.\//g, "").replace(/^\//g, ""));
      if (existsSync(absPath)) {
        try {
          const raw = readFileSync(absPath, "utf-8");
          // Truncate to 10KB per file to keep payload reasonable
          contents[relPath] = raw.slice(0, 10_000);
        } catch {
          contents[relPath] = "(Could not read file)";
        }
      }
    }
    return contents;
  }

  private applyEvent(event: GameEvent): void {
    this.eventLog.push(event);
    this.state = reduceGameEvent(this.state, event);
    this.emit("game-event", event);
    this.emit("state-update", this.state);
  }
}
