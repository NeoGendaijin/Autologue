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
    contextMax: 100_000,
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

const ESTIMATED_CHARS_PER_TOKEN = 4;
const PROMPT_DAMAGE_FREE_TOKENS = 180;
const PROMPT_TOKENS_PER_HP = 180;
const CONTEXT_TOKENS_PER_HP = 3000;

// --- Pure Reducer ---

export function reduceGameEvent(
  state: GameState,
  event: GameEvent
): GameState {
  const now = Date.now();

  switch (event.type) {
    case "QUEST_START": {
      const promptTokens = estimatePromptTokens(event.quest.description);
      const promptDamage = calculatePromptOverloadDamage(promptTokens);
      const questState: GameState = {
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
      return applyContextPressure(
        questState,
        promptTokens,
        now,
        "prompt token overload",
        promptDamage
      );
    }

    case "FILE_READ": {
      const nextUsed = state.contextUsed + 5000 + Math.floor(Math.random() * 10000);
      const nextState: GameState = {
        ...state,
        agents: updateAgentStatus(state.agents, event.agentId, "searching"),
        questLog: addLog(state.questLog, `Reading ${event.path}`, "action", now),
      };
      return applyContextPressure(nextState, nextUsed, now, "file read load");
    }

    case "FILE_WRITE": {
      const nextUsed = state.contextUsed + 3000 + Math.floor(Math.random() * 5000);
      const nextState: GameState = {
        ...state,
        agents: updateAgentStatus(state.agents, event.agentId, "coding"),
        questLog: addLog(state.questLog, `Writing ${event.path}`, "action", now),
      };
      return applyContextPressure(nextState, nextUsed, now, "file write load");
    }

    case "CODE_GENERATE": {
      const nextUsed = state.contextUsed + 8000 + Math.floor(Math.random() * 15000);
      const nextState: GameState = {
        ...state,
        agents: updateAgentStatus(state.agents, event.agentId, "coding"),
        questLog: addLog(state.questLog, `Generating code for ${event.target}`, "action", now),
      };
      return applyContextPressure(nextState, nextUsed, now, "code generation load");
    }

    case "TEST_RUN": {
      const nextUsed = state.contextUsed + 5000;
      const nextState: GameState = {
        ...state,
        mp: Math.max(0, state.mp - 5),
        agents: updateAgentStatus(state.agents, event.agentId, "testing"),
        questLog: addLog(state.questLog, `Running tests: ${event.testTarget}`, "action", now),
      };
      return applyContextPressure(nextState, nextUsed, now, "test execution load");
    }

    case "TEST_PASS":
      return {
        ...state,
        testsPassed: state.testsPassed + event.count,
        score: state.score + event.count * 100,
        questLog: addLog(state.questLog, `${event.count} test(s) passed!`, "success", now),
      };

    case "TEST_FAIL": {
      const nextUsed = state.contextUsed + 10000;
      const nextState: GameState = {
        ...state,
        testsFailed: state.testsFailed + event.count,
        questLog: addLog(
          state.questLog,
          `${event.count} test(s) failed: ${event.errors[0] ?? "unknown error"}`,
          "error",
          now
        ),
      };
      return applyContextPressure(nextState, nextUsed, now, "test failure load");
    }

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
      return applyContextPressure(
        {
          ...state,
          contextMax: event.max,
        },
        event.used,
        now,
        "context sync"
      );

    case "ERROR": {
      const nextState: GameState = {
        ...state,
        questLog: addLog(state.questLog, `Error: ${event.message}`, "error", now),
      };
      const pressured = applyContextPressure(
        nextState,
        state.contextUsed + 5000,
        now,
        "error backlash"
      );
      if (event.severity === "fatal") {
        return {
          ...pressured,
          phase: "game-over" as const,
          pendingQuestion: null,
          agents: updateAgentStatus(pressured.agents, "main", "idle"),
        };
      }
      return pressured;
    }

    case "THINKING": {
      const nextUsed = state.contextUsed + 2000;
      const snippet = event.content.slice(0, 60);
      const nextState: GameState = {
        ...state,
        agents: updateAgentStatus(state.agents, "main", "thinking"),
        questLog: addLog(state.questLog, `Thinking: ${snippet}`, "action", now),
      };
      return applyContextPressure(nextState, nextUsed, now, "reasoning load");
    }

    case "TOOL_USE": {
      const nextUsed = state.contextUsed + 3000;
      const nextState: GameState = {
        ...state,
        mp: Math.max(0, state.mp - 1),
        questLog: addLog(state.questLog, `Using tool: ${event.tool}`, "action", now),
      };
      return applyContextPressure(nextState, nextUsed, now, "tool load");
    }

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

    case "REVIVE": {
      const newMax = state.contextMax + event.addedContext;
      const healedAgents = state.agents.map((a) =>
        a.id === "main" ? { ...a, hp: Math.min(100, a.hp + 50), status: "thinking" as const } : a
      );
      return {
        ...state,
        phase: "running" as const,
        contextMax: newMax,
        agents: healedAgents,
        questLog: addLog(state.questLog, `Revived! +${(event.addedContext / 1000).toFixed(0)}K context added!`, "success", now),
      };
    }

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

function estimatePromptTokens(prompt: string): number {
  const normalized = prompt.trim();
  if (!normalized) return 0;
  return Math.max(1, Math.ceil(normalized.length / ESTIMATED_CHARS_PER_TOKEN));
}

function calculatePromptOverloadDamage(promptTokens: number): number {
  if (promptTokens <= PROMPT_DAMAGE_FREE_TOKENS) return 0;
  return Math.ceil((promptTokens - PROMPT_DAMAGE_FREE_TOKENS) / PROMPT_TOKENS_PER_HP);
}

function applyContextPressure(
  state: GameState,
  nextContextUsed: number,
  timestamp: number,
  source: string,
  extraDamage = 0
): GameState {
  const normalizedUsed = Math.max(0, nextContextUsed);
  const delta = Math.max(0, normalizedUsed - state.contextUsed);
  const contextDamage = Math.floor(delta / CONTEXT_TOKENS_PER_HP);
  const totalDamage = contextDamage + Math.max(0, extraDamage);
  const damagedAgents =
    totalDamage > 0 ? applyAgentDamage(state.agents, "main", totalDamage) : state.agents;

  const baseState: GameState = {
    ...state,
    contextUsed: normalizedUsed,
    agents: damagedAgents,
  };

  const hitContextLimit =
    (state.phase === "running" || state.phase === "question") &&
    state.contextMax > 0 &&
    normalizedUsed >= state.contextMax;

  if (hitContextLimit) {
    return {
      ...baseState,
      phase: "game-over",
      pendingQuestion: null,
      agents: updateAgentStatus(damagedAgents, "main", "idle"),
      questLog: addLog(
        baseState.questLog,
        `Context limit reached (${normalizedUsed}/${state.contextMax}).`,
        "error",
        timestamp
      ),
    };
  }

  const prevMain = state.agents.find((a) => a.id === "main");
  const nextMain = damagedAgents.find((a) => a.id === "main");
  const mainFell =
    (state.phase === "running" || state.phase === "question") &&
    !!prevMain &&
    !!nextMain &&
    prevMain.hp > 0 &&
    nextMain.hp <= 0;

  if (!mainFell) {
    return baseState;
  }

  return {
    ...baseState,
    phase: "game-over",
    pendingQuestion: null,
    agents: updateAgentStatus(damagedAgents, "main", "idle"),
    questLog: addLog(
      baseState.questLog,
      `Main Agent has fallen (${source}).`,
      "error",
      timestamp
    ),
  };
}

function applyAgentDamage(
  agents: AgentInfo[],
  agentId: string,
  damage: number
): AgentInfo[] {
  return agents.map((agent) =>
    agent.id !== agentId
      ? agent
      : {
          ...agent,
          hp: Math.max(0, agent.hp - damage),
        }
  );
}
