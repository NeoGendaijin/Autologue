import type { AgentAction } from "../game-engine/events.js";
import {
  FILE_READ_TOOLS,
  FILE_WRITE_TOOLS,
  SHELL_TOOLS,
  SEARCH_TOOLS,
  TEST_COMMAND_PATTERNS,
  matchesAny,
} from "./patterns.js";

/**
 * Classify a Gemini tool_use event into a game action category.
 */
export function classifyAction(
  toolName: string,
  args?: Record<string, unknown>
): AgentAction {
  if (FILE_READ_TOOLS.has(toolName)) {
    return "reading";
  }

  if (FILE_WRITE_TOOLS.has(toolName)) {
    return "writing";
  }

  if (SEARCH_TOOLS.has(toolName)) {
    return "searching";
  }

  if (SHELL_TOOLS.has(toolName)) {
    // Check if the shell command is a test command
    const command = String(args?.command ?? args?.Command ?? "");
    if (matchesAny(command, TEST_COMMAND_PATTERNS)) {
      return "testing";
    }
    return "coding";
  }

  return "coding";
}

/**
 * Extract file path from tool arguments.
 */
export function extractFilePath(args?: Record<string, unknown>): string {
  return String(
    args?.path ??
      args?.file_path ??
      args?.filePath ??
      args?.filename ??
      "unknown"
  );
}

/**
 * Extract shell command from tool arguments.
 */
export function extractCommand(args?: Record<string, unknown>): string {
  return String(args?.command ?? args?.Command ?? args?.cmd ?? "");
}
