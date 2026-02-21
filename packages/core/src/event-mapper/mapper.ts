import type { GeminiEvent } from "../gemini-adapter/types.js";
import type {
  AgentAction,
  GameEvent,
  AgentInfo,
  AgentType,
  QuestionChoice,
} from "../game-engine/events.js";
import {
  QUESTION_PATTERNS,
  QUESTION_PATTERNS_EXPERT,
  SUBAGENT_PATTERNS,
  TEST_COMMAND_PATTERNS,
  TEST_PASS_PATTERNS,
  TEST_FAIL_PATTERNS,
  matchesAny,
  extractTestCount,
} from "./patterns.js";
import {
  classifyAction,
  extractFilePath,
  extractCommand,
} from "./action-classifier.js";

/**
 * Maps raw Gemini CLI events to game events.
 * A single Gemini event may produce zero or more game events.
 */
export class EventMapper {
  private lastToolUseAction: AgentAction | null = null;
  private subagentCounter = 0;
  private mode: "expert" | "adventure";

  // Auto-spawn tracking
  private readCount = 0;
  private writeCount = 0;
  private testCount = 0;
  private spawnedTypes = new Set<string>();

  constructor(mode: "expert" | "adventure" = "adventure") {
    this.mode = mode;
  }

  /**
   * Transform a Gemini event into game events.
   */
  map(event: GeminiEvent): GameEvent[] {
    switch (event.type) {
      case "init":
        return this.mapInit(event);
      case "message":
        return this.mapMessage(event);
      case "tool_use":
        return this.mapToolUse(event);
      case "tool_result":
        return this.mapToolResult(event);
      case "error":
        return this.mapError(event);
      case "result":
        return this.mapResult(event);
      default:
        return [];
    }
  }

  private mapInit(_event: GeminiEvent & { type: "init" }): GameEvent[] {
    return [
      {
        type: "LOG",
        message: "Session initialized -- agent deployed",
        logType: "info",
      },
    ];
  }

  private mapMessage(
    event: GeminiEvent & { type: "message" }
  ): GameEvent[] {
    const events: GameEvent[] = [];

    if (event.role === "model") {
      // Check for question patterns (expert mode uses broader patterns)
      const questionPatterns = this.mode === "expert" ? QUESTION_PATTERNS_EXPERT : QUESTION_PATTERNS;
      if (matchesAny(event.content, questionPatterns)) {
        events.push({
          type: "QUESTION",
          question: generateQuestionFromText(event.content),
        });
        return events;
      }

      // Check for subagent spawn patterns
      if (matchesAny(event.content, SUBAGENT_PATTERNS)) {
        events.push(this.createSubagentSpawn(event.content));
        return events;
      }

      // General thinking/reasoning output
      events.push({
        type: "THINKING",
        content: event.content.slice(0, 200),
      });
    }

    return events;
  }

  private mapToolUse(
    event: GeminiEvent & { type: "tool_use" }
  ): GameEvent[] {
    const action = classifyAction(event.toolName, event.args);
    this.lastToolUseAction = action;

    switch (action) {
      case "reading": {
        this.readCount++;
        return this.withOptionalSpawn(
          {
            type: "FILE_READ",
            path: extractFilePath(event.args),
            agentId: "main",
          },
          this.maybeSpawnAtThreshold({
            count: this.readCount,
            threshold: 1,
            spawnType: "search",
            context: "search scout reconnaissance",
          })
        );
      }

      case "writing": {
        this.writeCount++;
        return this.withOptionalSpawn(
          {
            type: "FILE_WRITE",
            path: extractFilePath(event.args),
            agentId: "main",
          },
          this.maybeSpawnAtThreshold({
            count: this.writeCount,
            threshold: 3,
            spawnType: "fix",
            context: "fix patch code forge",
          })
        );
      }

      case "testing": {
        this.testCount++;
        const command = extractCommand(event.args);
        return this.withOptionalSpawn(
          {
            type: "TEST_RUN",
            testTarget: command,
            agentId: "main",
          },
          this.maybeSpawnAtThreshold({
            count: this.testCount,
            threshold: 1,
            spawnType: "test",
            context: "test verify guard",
          })
        );
      }

      case "searching":
        return [
          {
            type: "TOOL_USE",
            tool: event.toolName,
            args: event.args ?? {},
          },
          {
            type: "LOG",
            message: `Searching: ${event.toolName}`,
            logType: "action",
          },
        ];

      case "coding":
      default:
        return [
          {
            type: "TOOL_USE",
            tool: event.toolName,
            args: event.args ?? {},
          },
        ];
    }
  }

  private mapToolResult(
    event: GeminiEvent & { type: "tool_result" }
  ): GameEvent[] {
    const events: GameEvent[] = [];
    const output = event.output ?? "";

    if (event.isError) {
      events.push({
        type: "ERROR",
        message: output.slice(0, 200),
        severity: "warning",
      });
      return events;
    }

    // If the last action was a test run, check results
    if (this.lastToolUseAction === "testing") {
      if (matchesAny(output, TEST_PASS_PATTERNS)) {
        events.push({
          type: "TEST_PASS",
          count: extractTestCount(output, TEST_PASS_PATTERNS),
        });
      }
      if (matchesAny(output, TEST_FAIL_PATTERNS)) {
        events.push({
          type: "TEST_FAIL",
          count: extractTestCount(output, TEST_FAIL_PATTERNS),
          errors: [output.slice(0, 300)],
        });
      }
    }

    // Reset tracking
    this.lastToolUseAction = null;

    return events;
  }

  private mapError(
    event: GeminiEvent & { type: "error" }
  ): GameEvent[] {
    return [
      {
        type: "ERROR",
        message: event.message ?? "Unknown error",
        severity: event.severity === "warning" ? "warning" : "fatal",
      },
    ];
  }

  private mapResult(
    event: GeminiEvent & { type: "result" }
  ): GameEvent[] {
    if (event.error) {
      return [
        {
          type: "GAME_OVER",
          reason: event.error.message ?? "Process ended with error",
        },
      ];
    }

    // Context usage from stats
    const events: GameEvent[] = [];
    if (event.stats?.model) {
      const inputTokens = event.stats.model.inputTokens ?? 0;
      const outputTokens = event.stats.model.outputTokens ?? 0;
      events.push({
        type: "CONTEXT_UPDATE",
        used: inputTokens + outputTokens,
        max: 100_000,
      });
    }

    return events;
  }

  private withOptionalSpawn(
    baseEvent: GameEvent,
    spawnEvent: GameEvent | null
  ): GameEvent[] {
    return spawnEvent ? [baseEvent, spawnEvent] : [baseEvent];
  }

  private maybeSpawnAtThreshold(input: {
    count: number;
    threshold: number;
    spawnType: string;
    context: string;
  }): GameEvent | null {
    if (input.count !== input.threshold || this.spawnedTypes.has(input.spawnType)) {
      return null;
    }

    this.spawnedTypes.add(input.spawnType);
    return this.createSubagentSpawn(input.context);
  }

  private createSubagentSpawn(context: string): GameEvent {
    this.subagentCounter++;
    return {
      type: "SUBAGENT_SPAWN",
      agent: createSubagent(this.subagentCounter, context),
    };
  }
}

// --- Helper Functions ---

/**
 * Generate a QuestionEvent from model text that contains a question.
 */
/** Shorten long model text to just the core question sentence. */
function shortenQuestion(text: string): string {
  // Find the sentence containing the actual question (the one with "?")
  const sentences = text.split(/(?<=[.!?])\s+/);
  const q = sentences.find((s) => s.includes("?"));
  const short = (q || sentences[sentences.length - 1]).trim();
  // Cap at 80 chars
  return short.length > 80 ? short.slice(0, 77) + "..." : short;
}

function generateQuestionFromText(text: string): {
  text: string;
  choices: QuestionChoice[];
} {
  const shortText = shortenQuestion(text);

  // Try to extract "A or B" style options
  const orMatch = text.match(/should I (?:use |go with |pick |choose )?(.+?)\s+or\s+(.+?)[\?\.]?$/im);
  if (orMatch) {
    const optA = orMatch[1].replace(/^(use |go with |pick )/i, "").trim();
    const optB = orMatch[2].replace(/[\?\.\s]+$/, "").trim();
    return {
      text: shortText,
      choices: [
        { label: optA.slice(0, 25), contextCost: 30, quality: "★★", risk: "LOW" },
        { label: optB.slice(0, 25), contextCost: 30, quality: "★★", risk: "LOW" },
        { label: "Any is fine", contextCost: 5, quality: "???", risk: "MED" },
      ],
    };
  }

  // Fallback (shouldn't trigger often with tighter patterns)
  return {
    text: shortText,
    choices: [
      { label: "Go for it", contextCost: 20, quality: "★★", risk: "LOW" },
      { label: "Nah, other way", contextCost: 40, quality: "★★★", risk: "LOW" },
      { label: "Up to you", contextCost: 5, quality: "???", risk: "MED" },
    ],
  };
}

/**
 * Create a sub-agent info from spawn detection.
 */
function createSubagent(counter: number, context: string): AgentInfo {
  // Try to determine agent type from context
  let type: AgentType = "search";
  let name = `Sub-${counter}`;

  if (/test/i.test(context)) {
    type = "test";
    name = `Tester-${counter}`;
  } else if (/doc/i.test(context)) {
    type = "docs";
    name = `Scribe-${counter}`;
  } else if (/fix|patch|repair/i.test(context)) {
    type = "fix";
    name = `Fixer-${counter}`;
  } else if (/search|find|look|scan/i.test(context)) {
    type = "search";
    name = `Scout-${counter}`;
  }

  return {
    id: `sub-${counter}`,
    type,
    name,
    hp: 80,
    level: 1,
    status: "thinking",
    spawnedAt: Date.now(),
  };
}
