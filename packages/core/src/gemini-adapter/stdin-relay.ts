import type { QuestionChoice, TacticType } from "../game-engine/events.js";

/**
 * Format a player's choice into text suitable for piping to Gemini CLI stdin.
 */
export function formatPlayerResponse(
  choice: QuestionChoice,
  mode: "expert" | "adventure"
): string {
  if (mode === "expert") {
    // In expert mode, send the choice label directly as a concise instruction
    return choice.label;
  }

  // In adventure mode, map the choice to a response style
  if (choice.risk === "HIGH") {
    // "Let agent decide" -- minimal input
    return "Go ahead with whatever you think is best.";
  }

  if (choice.risk === "LOW") {
    // Detailed instruction
    return `Please proceed with: ${choice.label}. Take the careful, thorough approach.`;
  }

  // Medium risk -- concise instruction
  return choice.label;
}

/**
 * Format a tactic command for injection into Gemini CLI stdin.
 */
export function formatTacticCommand(tactic: TacticType): string {
  switch (tactic) {
    case "summarize":
      return "Please summarize everything we've done so far in a concise way, then continue working. Focus on key decisions and current state.";
    case "split-task":
      return "This task is getting complex. Please break it down into smaller sub-tasks and tackle them one at a time.";
    case "forget":
      return "Let's focus on what's most important right now. You can forget the earlier exploration details and focus on the current implementation.";
    case "delegate":
      return "Please delegate the current sub-task to a specialist agent if possible.";
    case "checkpoint":
      return "Please save a summary of the current state so we can resume from here if needed.";
  }
}
