import type { TacticType } from "./events.js";
import { formatTacticCommand } from "../gemini-adapter/stdin-relay.js";

export interface TacticResult {
  /** Text to pipe to Gemini CLI stdin */
  stdinCommand: string;
  /** Partial state changes to apply */
  contextRecovery: number;
  /** Description of the effect for the log */
  effectDescription: string;
}

/**
 * Execute a tactic and return the stdin command + state effects.
 */
export function executeTactic(tactic: TacticType): TacticResult {
  const stdinCommand = formatTacticCommand(tactic);

  switch (tactic) {
    case "summarize":
      return {
        stdinCommand,
        contextRecovery: 100_000, // recover ~100K tokens via compression
        effectDescription: "Context compressed -- recovered 100K tokens",
      };

    case "split-task":
      return {
        stdinCommand,
        contextRecovery: 50_000,
        effectDescription: "Task split into sub-tasks -- context partially recovered",
      };

    case "forget":
      return {
        stdinCommand,
        contextRecovery: 150_000, // aggressive recovery
        effectDescription: "Old context discarded -- recovered 150K tokens (quality risk!)",
      };

    case "delegate":
      return {
        stdinCommand,
        contextRecovery: 0,
        effectDescription: "Sub-task delegated to specialist agent",
      };

    case "checkpoint":
      return {
        stdinCommand,
        contextRecovery: 0,
        effectDescription: "State checkpoint saved",
      };
  }
}
