import type { QuestResult, Rank, Achievement } from "./events.js";
import type { GameState } from "./state.js";
import { calculateScore, calculateRank, checkAchievements } from "./scoring.js";

// --- Quest Info ---

export interface QuestConfig {
  /** The coding task description / prompt */
  description: string;
  /** Working directory for the gemini process */
  cwd?: string;
}

/**
 * Create a quest start event payload from user input.
 */
export function createQuest(config: QuestConfig): {
  id: string;
  description: string;
  startTime: number;
  cwd?: string;
} {
  return {
    id: generateQuestId(),
    description: config.description,
    startTime: Date.now(),
    cwd: config.cwd,
  };
}

/**
 * Build a QuestResult from the final game state.
 */
export function buildQuestResult(state: GameState): QuestResult {
  const duration = Date.now() - state.startTime;
  const contextRemaining = state.contextMax - state.contextUsed;
  const score = calculateScore(state);
  const rank = calculateRank(score, contextRemaining / state.contextMax);
  const achievements = checkAchievements(state);

  return {
    questId: state.currentQuest?.id ?? "unknown",
    duration,
    contextUsed: state.contextUsed,
    contextRemaining,
    subagentsUsed: state.agents.length - 1, // exclude main agent
    playerDecisions: state.playerDecisions,
    testsPassed: state.testsPassed,
    testsFailed: state.testsFailed,
    score,
    rank,
    achievements,
  };
}

// --- Helpers ---

function generateQuestId(): string {
  return `quest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
