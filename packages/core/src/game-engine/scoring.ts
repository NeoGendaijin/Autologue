import type { Rank, Achievement } from "./events.js";
import type { GameState } from "./state.js";

/**
 * Calculate the final score from game state.
 */
export function calculateScore(state: GameState): number {
  let score = state.score; // base score accumulated during gameplay

  // Efficiency bonus: context remaining percentage
  const contextEfficiency = 1 - state.contextUsed / state.contextMax;
  score += Math.floor(contextEfficiency * 500);

  // Speed bonus: under 5 minutes = bonus
  const durationSec = (Date.now() - state.startTime) / 1000;
  if (durationSec < 60) {
    score += 300; // under 1 minute
  } else if (durationSec < 180) {
    score += 200; // under 3 minutes
  } else if (durationSec < 300) {
    score += 100; // under 5 minutes
  }

  // Test bonus
  const totalTests = state.testsPassed + state.testsFailed;
  if (totalTests > 0) {
    const passRate = state.testsPassed / totalTests;
    score += Math.floor(passRate * 200);
  }

  // Penalty for too many player interventions (encourages efficiency)
  if (state.playerDecisions > 5) {
    score -= (state.playerDecisions - 5) * 20;
  }

  return Math.max(0, score);
}

/**
 * Calculate rank from score and context efficiency.
 */
export function calculateRank(score: number, contextEfficiency: number): Rank {
  if (score >= 2000 && contextEfficiency > 0.8) return "S";
  if (score >= 1500 && contextEfficiency > 0.6) return "A";
  if (score >= 1000 && contextEfficiency > 0.4) return "B";
  if (score >= 500) return "C";
  if (score >= 200) return "D";
  return "F";
}

/**
 * Check which achievements were earned during this quest.
 */
export function checkAchievements(state: GameState): Achievement[] {
  const achievements: Achievement[] = [];
  const contextEfficiency = 1 - state.contextUsed / state.contextMax;
  const durationSec = (Date.now() - state.startTime) / 1000;

  // First Blood: completed a quest
  if (state.phase === "complete") {
    achievements.push({
      id: "first-blood",
      name: "First Blood",
      icon: "🏅",
      description: "Completed your first quest",
    });
  }

  // Ice Cold: 90%+ context remaining
  if (contextEfficiency >= 0.9) {
    achievements.push({
      id: "ice-cold",
      name: "Ice Cold",
      icon: "🧊",
      description: "Completed with 90%+ context remaining",
    });
  }

  // Gambler: all choices were "let agent decide" (risk HIGH)
  // This would need tracking of all choices; simplified check here
  if (state.playerDecisions === 0 && state.phase === "complete") {
    achievements.push({
      id: "gambler",
      name: "Gambler",
      icon: "🎰",
      description: "Never intervened -- let the agent handle everything",
    });
  }

  // Squad Leader: 4+ subagents active at once
  if (state.agents.length >= 5) {
    achievements.push({
      id: "squad-leader",
      name: "Squad Leader",
      icon: "👨‍👩‍👧‍👦",
      description: "Had 4+ sub-agents active simultaneously",
    });
  }

  // Speedrunner: under 1 minute
  if (durationSec < 60 && state.phase === "complete") {
    achievements.push({
      id: "speedrunner",
      name: "Speedrunner",
      icon: "⚡",
      description: "Completed quest in under 1 minute",
    });
  }

  // From the Brink: context was under 5% at some point but still completed
  if (
    contextEfficiency < 0.05 &&
    state.phase === "complete"
  ) {
    achievements.push({
      id: "from-the-brink",
      name: "From the Brink",
      icon: "💀",
      description: "Completed with context at critical levels",
    });
  }

  return achievements;
}
