import type { GeminiEvent } from "../gemini-adapter/types.js";
import type { GameEvent, AgentInfo, AgentType, QuestionChoice } from "../game-engine/events.js";
import {
  QUESTION_PATTERNS,
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
  private lastToolUseAction: string | null = null;
  private lastToolUseCommand: string | null = null;
  private subagentCounter = 0;

  // Auto-spawn tracking
  private readCount = 0;
  private writeCount = 0;
  private testCount = 0;
  private spawnedTypes = new Set<string>();

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
      // Check for question patterns
      if (matchesAny(event.content, QUESTION_PATTERNS)) {
        events.push({
          type: "QUESTION",
          question: generateQuestionFromText(event.content),
        });
        return events;
      }

      // Check for subagent spawn patterns
      if (matchesAny(event.content, SUBAGENT_PATTERNS)) {
        this.subagentCounter++;
        const agent = createSubagent(this.subagentCounter, event.content);
        events.push({ type: "SUBAGENT_SPAWN", agent });
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
        const readEvents: GameEvent[] = [
          {
            type: "FILE_READ",
            path: extractFilePath(event.args),
            agentId: "main",
          },
        ];
        // First read → spawn Scout
        if (this.readCount === 1 && !this.spawnedTypes.has("search")) {
          this.spawnedTypes.add("search");
          this.subagentCounter++;
          readEvents.push({
            type: "SUBAGENT_SPAWN",
            agent: createSubagent(this.subagentCounter, "search scout reconnaissance"),
          });
        }
        return readEvents;
      }

      case "writing": {
        this.writeCount++;
        const writeEvents: GameEvent[] = [
          {
            type: "FILE_WRITE",
            path: extractFilePath(event.args),
            agentId: "main",
          },
        ];
        // After 3 writes → spawn Coder companion
        if (this.writeCount === 3 && !this.spawnedTypes.has("fix")) {
          this.spawnedTypes.add("fix");
          this.subagentCounter++;
          writeEvents.push({
            type: "SUBAGENT_SPAWN",
            agent: createSubagent(this.subagentCounter, "fix patch code forge"),
          });
        }
        return writeEvents;
      }

      case "testing": {
        this.testCount++;
        const command = extractCommand(event.args);
        this.lastToolUseCommand = command;
        const testEvents: GameEvent[] = [
          {
            type: "TEST_RUN",
            testTarget: command,
            agentId: "main",
          },
        ];
        // First test → spawn Tester
        if (this.testCount === 1 && !this.spawnedTypes.has("test")) {
          this.spawnedTypes.add("test");
          this.subagentCounter++;
          testEvents.push({
            type: "SUBAGENT_SPAWN",
            agent: createSubagent(this.subagentCounter, "test verify guard"),
          });
        }
        return testEvents;
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
        this.lastToolUseCommand = extractCommand(event.args);
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
    this.lastToolUseCommand = null;

    return events;
  }

  private mapError(
    event: GeminiEvent & { type: "error" }
  ): GameEvent[] {
    return [
      {
        type: "ERROR",
        message: event.message ?? "Unknown error",
        severity: "error",
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
        max: 1_000_000,
      });
    }

    return events;
  }
}

// --- Helper Functions ---

/**
 * Generate a QuestionEvent from model text that contains a question.
 */
function generateQuestionFromText(text: string): {
  text: string;
  choices: QuestionChoice[];
} {
  // Try to extract "A or B" style options from the question
  const orMatch = text.match(/should I (?:use |go with |pick |choose )?(.+?)\s+or\s+(.+?)[\?\.]?$/im);
  if (orMatch) {
    const optA = orMatch[1].replace(/^(use |go with |pick )/i, "").trim();
    const optB = orMatch[2].replace(/[\?\.\s]+$/, "").trim();
    return {
      text: text.trim(),
      choices: [
        { label: optA.slice(0, 40), contextCost: 30, quality: "★★", risk: "LOW" },
        { label: optB.slice(0, 40), contextCost: 30, quality: "★★", risk: "LOW" },
        { label: "Your call", contextCost: 5, quality: "???", risk: "MED" },
      ],
    };
  }

  // Default: simple yes/no/skip
  return {
    text: text.trim(),
    choices: [
      { label: "Yes, go ahead", contextCost: 20, quality: "★★", risk: "LOW" },
      { label: "No, try another way", contextCost: 40, quality: "★★★", risk: "LOW" },
      { label: "You decide", contextCost: 5, quality: "???", risk: "MED" },
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
