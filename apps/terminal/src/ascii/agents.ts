import type { AgentType } from "@agent-quest/core";

/**
 * ASCII art frames for each agent type.
 * Each agent has 3 idle animation frames.
 */
export const AGENT_FRAMES: Record<AgentType, string[]> = {
  main: [
    " [>o<] ",
    " [>O<] ",
    " [>o<] ",
  ],
  search: [
    " {o.o} ",
    " {o..} ",
    " {..o} ",
  ],
  test: [
    " <o_o> ",
    " <O_O> ",
    " <o_o> ",
  ],
  docs: [
    " (o_o) ",
    " (o.o) ",
    " (o_o) ",
  ],
  fix: [
    " [o~o] ",
    " [O~O] ",
    " [o~o] ",
  ],
};

/**
 * Agent type display names for the terminal UI.
 */
export const AGENT_NAMES: Record<AgentType, string> = {
  main: "Main",
  search: "Scout",
  test: "Tester",
  docs: "Scribe",
  fix: "Fixer",
};
