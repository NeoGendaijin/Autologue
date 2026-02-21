// --- Agent Types ---

export type AgentType = "main" | "search" | "test" | "docs" | "fix";
export type AgentStatus =
  | "idle"
  | "thinking"
  | "coding"
  | "searching"
  | "testing"
  | "waiting";
export type AgentAction =
  | "reading"
  | "writing"
  | "coding"
  | "testing"
  | "thinking"
  | "searching";

export interface AgentInfo {
  id: string;
  type: AgentType;
  name: string;
  hp: number; // 0-100
  level: number;
  status: AgentStatus;
  spawnedAt: number;
}

// --- Log Types ---

export type LogType =
  | "info"
  | "action"
  | "success"
  | "error"
  | "question"
  | "spawn";

export interface LogEntry {
  text: string;
  type: LogType;
  timestamp: number;
  isNew: boolean;
}

// --- Question Types ---

export interface QuestionChoice {
  label: string;
  contextCost: number; // tokens consumed
  quality: string; // "★★★", "★★", "???"
  risk: "LOW" | "MED" | "HIGH";
}

export interface QuestionEvent {
  text: string;
  choices: QuestionChoice[];
}

// --- Tactic Types ---

export type TacticType =
  | "summarize"
  | "split-task"
  | "forget"
  | "delegate"
  | "checkpoint";

// --- Achievement Types ---

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// --- Game Event Union ---

export type GameEvent =
  | { type: "QUEST_START"; quest: { id: string; description: string; startTime: number; cwd?: string } }
  | { type: "FILE_READ"; path: string; agentId: string }
  | { type: "FILE_WRITE"; path: string; agentId: string }
  | { type: "CODE_GENERATE"; target: string; agentId: string }
  | { type: "TEST_RUN"; testTarget: string; agentId: string }
  | { type: "TEST_PASS"; count: number }
  | { type: "TEST_FAIL"; count: number; errors: string[] }
  | { type: "SUBAGENT_SPAWN"; agent: AgentInfo }
  | { type: "SUBAGENT_COMPLETE"; agentId: string; result: string }
  | { type: "QUESTION"; question: QuestionEvent }
  | { type: "PLAYER_CHOICE"; choiceIndex: number; response: string }
  | { type: "CONTEXT_UPDATE"; used: number; max: number }
  | { type: "ERROR"; message: string; severity: "warning" | "error" | "fatal" }
  | { type: "THINKING"; content: string }
  | { type: "TOOL_USE"; tool: string; args: Record<string, unknown> }
  | { type: "QUEST_COMPLETE"; result: QuestResult }
  | { type: "GAME_OVER"; reason: string }
  | { type: "TACTIC_USED"; tactic: TacticType; effect: string }
  | { type: "LOG"; message: string; logType: LogType };

// --- Quest Result ---

export type Rank = "S" | "A" | "B" | "C" | "D" | "F";

export interface QuestResult {
  questId: string;
  duration: number;
  contextUsed: number;
  contextRemaining: number;
  subagentsUsed: number;
  playerDecisions: number;
  testsPassed: number;
  testsFailed: number;
  score: number;
  rank: Rank;
  achievements: Achievement[];
  outputDir?: string;
  filesCreated?: string[];
  fileContents?: Record<string, string>;
}
