import type {
  AgentInfo,
  GameEvent,
  LogEntry,
  QuestionEvent,
  QuestResult,
} from "./events.js";

// --- Game Phase ---

export type GamePhase =
  | "idle"
  | "quest-input"
  | "running"
  | "question"
  | "complete"
  | "game-over";

// --- Game State ---

export interface GameState {
  // Status
  phase: GamePhase;
  mode: "expert" | "adventure";

  // Resources
  contextUsed: number;
  contextMax: number;
  mp: number;
  mpMax: number;
  exp: number;
  level: number;

  // Party
  agents: AgentInfo[];

  // Quest
  currentQuest: {
    id: string;
    description: string;
    startTime: number;
    cwd?: string;
  } | null;
  questLog: LogEntry[];

  // Scoring
  score: number;
  startTime: number;
  playerDecisions: number;
  testsPassed: number;
  testsFailed: number;

  // Current question
  pendingQuestion: QuestionEvent | null;

  // Last completed quest result
  lastResult: QuestResult | null;
}

// --- Initial State ---

export function createInitialState(): GameState {
  return {
    phase: "idle",
    mode: "adventure",

    contextUsed: 0,
    contextMax: 1_000_000,
    mp: 100,
    mpMax: 100,
    exp: 0,
    level: 1,

    agents: [],
    currentQuest: null,
    questLog: [],

    score: 0,
    startTime: 0,
    playerDecisions: 0,
    testsPassed: 0,
    testsFailed: 0,

    pendingQuestion: null,
    lastResult: null,
  };
}

// --- Pure Reducer ---

export function reduceGameEvent(
  state: GameState,
  event: GameEvent
): GameState {
  const now = Date.now();

  switch (event.type) {
    case "QUEST_START":
      return {
        ...state,
        phase: "running",
        currentQuest: event.quest,
        startTime: event.quest.startTime,
        agents: [
          {
            id: "main",
            type: "main",
            name: "Main Agent",
            hp: 100,
            level: state.level,
            status: "thinking",
            spawnedAt: now,
          },
        ],
        questLog: [],
        score: 0,
        playerDecisions: 0,
        testsPassed: 0,
        testsFailed: 0,
        contextUsed: 0,
        mp: state.mpMax,
        pendingQuestion: null,
        lastResult: null,
      };

    case "FILE_READ":
      return {
        ...state,
        contextUsed: state.contextUsed + 5000 + Math.floor(Math.random() * 10000),
        agents: updateAgentStatus(state.agents, event.agentId, "searching"),
        questLog: addLog(state.questLog, `Reading ${event.path}`, "action", now),
      };

    case "FILE_WRITE":
      return {
        ...state,
        contextUsed: state.contextUsed + 3000 + Math.floor(Math.random() * 5000),
        agents: updateAgentStatus(state.agents, event.agentId, "coding"),
        questLog: addLog(state.questLog, `Writing ${event.path}`, "action", now),
      };

    case "CODE_GENERATE":
      return {
        ...state,
        contextUsed: state.contextUsed + 8000 + Math.floor(Math.random() * 15000),
        agents: updateAgentStatus(state.agents, event.agentId, "coding"),
        questLog: addLog(state.questLog, `Generating code for ${event.target}`, "action", now),
      };

    case "TEST_RUN":
      return {
        ...state,
        contextUsed: state.contextUsed + 5000,
        mp: Math.max(0, state.mp - 5),
        agents: updateAgentStatus(state.agents, event.agentId, "testing"),
        questLog: addLog(state.questLog, `Running tests: ${event.testTarget}`, "action", now),
      };

    case "TEST_PASS":
      return {
        ...state,
        testsPassed: state.testsPassed + event.count,
        score: state.score + event.count * 100,
        questLog: addLog(state.questLog, `${event.count} test(s) passed!`, "success", now),
      };

    case "TEST_FAIL":
      return {
        ...state,
        testsFailed: state.testsFailed + event.count,
        contextUsed: state.contextUsed + 10000,
        questLog: addLog(
          state.questLog,
          `${event.count} test(s) failed: ${event.errors[0] ?? "unknown error"}`,
          "error",
          now
        ),
      };

    case "SUBAGENT_SPAWN":
      return {
        ...state,
        agents: [...state.agents, event.agent],
        mp: Math.max(0, state.mp - 10),
        questLog: addLog(state.questLog, `Summoned ${event.agent.name}!`, "spawn", now),
      };

    case "SUBAGENT_COMPLETE":
      return {
        ...state,
        agents: state.agents.filter((a) => a.id !== event.agentId),
        exp: state.exp + 20,
        questLog: addLog(state.questLog, `Sub-agent completed: ${event.result}`, "success", now),
      };

    case "QUESTION":
      return {
        ...state,
        phase: "question",
        pendingQuestion: event.question,
        agents: updateAgentStatus(state.agents, "main", "waiting"),
        questLog: addLog(state.questLog, `Agent asks: "${event.question.text}"`, "question", now),
      };

    case "PLAYER_CHOICE":
      return {
        ...state,
        phase: "running",
        pendingQuestion: null,
        playerDecisions: state.playerDecisions + 1,
        agents: updateAgentStatus(state.agents, "main", "thinking"),
        questLog: addLog(state.questLog, `Player chose: "${event.response}"`, "info", now),
      };

    case "CONTEXT_UPDATE":
      return {
        ...state,
        contextUsed: event.used,
        contextMax: event.max,
      };

    case "ERROR": {
      const newState = {
        ...state,
        contextUsed: state.contextUsed + 5000,
        questLog: addLog(state.questLog, `Error: ${event.message}`, "error", now),
      };
      if (event.severity === "fatal") {
        return { ...newState, phase: "game-over" as const };
      }
      return newState;
    }

    case "THINKING":
      return {
        ...state,
        contextUsed: state.contextUsed + 2000,
        agents: updateAgentStatus(state.agents, "main", "thinking"),
      };

    case "TOOL_USE":
      return {
        ...state,
        contextUsed: state.contextUsed + 3000,
        mp: Math.max(0, state.mp - 1),
        questLog: addLog(state.questLog, `Using tool: ${event.tool}`, "action", now),
      };

    case "QUEST_COMPLETE":
      return {
        ...state,
        phase: "complete",
        exp: state.exp + 150,
        level: Math.floor((state.exp + 150) / 100) + 1,
        lastResult: event.result,
        agents: updateAgentStatus(state.agents, "main", "idle"),
        questLog: addLog(state.questLog, "Quest complete!", "success", now),
      };

    case "GAME_OVER":
      return {
        ...state,
        phase: "game-over",
        questLog: addLog(state.questLog, `Game Over: ${event.reason}`, "error", now),
      };

    case "TACTIC_USED":
      return {
        ...state,
        mp: Math.max(0, state.mp - 15),
        questLog: addLog(state.questLog, `Tactic: ${event.tactic} - ${event.effect}`, "action", now),
      };

    case "LOG":
      return {
        ...state,
        questLog: addLog(state.questLog, event.message, event.logType, now),
      };

    default:
      return state;
  }
}

// --- Helpers ---

function updateAgentStatus(
  agents: AgentInfo[],
  agentId: string,
  status: AgentInfo["status"]
): AgentInfo[] {
  return agents.map((a) =>
    a.id === agentId ? { ...a, status } : a
  );
}

function addLog(
  log: LogEntry[],
  text: string,
  type: LogEntry["type"],
  timestamp: number
): LogEntry[] {
  // Mark all existing entries as not new
  const existing = log.map((entry) => ({ ...entry, isNew: false }));
  return [...existing, { text, type, timestamp, isNew: true }];
}
