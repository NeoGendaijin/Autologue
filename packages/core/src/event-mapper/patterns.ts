/**
 * Regex patterns for classifying Gemini CLI events into game actions.
 */

/** Patterns that indicate a question requiring player input.
 *  Keep this tight — only trigger on clear "A or B?" forks. */
export const QUESTION_PATTERNS: RegExp[] = [
  /should I\b.+\bor\b/i,      // "Should I use X or Y?"
  /do you prefer\b.+\bor\b/i,  // "Do you prefer X or Y?"
];

/** Broader patterns for expert mode — catch more decision points. */
export const QUESTION_PATTERNS_EXPERT: RegExp[] = [
  ...QUESTION_PATTERNS,
  /should I\b.+\?/i,            // "Should I add tests?"
  /shall I\b.+\?/i,             // "Shall I refactor this?"
  /would you (?:like|prefer|want)\b.+\?/i, // "Would you like me to...?"
  /which (?:approach|method|option|way|style|pattern|library|framework)\b/i,
  /do you want\b.+\?/i,         // "Do you want me to...?"
  /how should I\b.+\?/i,        // "How should I handle...?"
  /what (?:should|would)\b.+\?/i, // "What should I use for...?"
];

/** Patterns that indicate subagent spawning */
export const SUBAGENT_PATTERNS: RegExp[] = [
  /spawning\s+(sub-?)?agent/i,
  /creating\s+(sub-?)?agent/i,
  /delegating\s+to/i,
  /activate_skill/i,
  /launching\s+(sub-?)?agent/i,
];

/** Patterns that indicate test execution */
export const TEST_COMMAND_PATTERNS: RegExp[] = [
  /\b(pytest|jest|mocha|vitest|cargo\s+test|go\s+test)\b/i,
  /\bnpm\s+test\b/i,
  /\byarn\s+test\b/i,
  /\bpnpm\s+test\b/i,
  /\bmake\s+test\b/i,
  /\brunning\s+tests?\b/i,
];

/** Patterns that indicate test success */
export const TEST_PASS_PATTERNS: RegExp[] = [
  /\bpass(ed)?\b/i,
  /✓/,
  /\bPASS\b/,
  /\bOK\b.*tests?\b/i,
  /\ball\s+tests?\s+passed\b/i,
  /\b(\d+)\s+passed\b/i,
];

/** Patterns that indicate test failure */
export const TEST_FAIL_PATTERNS: RegExp[] = [
  /\bfail(ed|ure)?\b/i,
  /✗/,
  /\bFAIL\b/,
  /\berror\b/i,
  /\b(\d+)\s+failed\b/i,
  /\bAssertionError\b/,
];

/** Tool names that map to file reading */
export const FILE_READ_TOOLS = new Set([
  "read_file",
  "ReadFile",
  "view_file",
  "cat",
  "read",
]);

/** Tool names that map to file writing */
export const FILE_WRITE_TOOLS = new Set([
  "write_file",
  "WriteFile",
  "edit_file",
  "EditFile",
  "create_file",
  "write",
  "edit",
]);

/** Tool names that map to shell execution */
export const SHELL_TOOLS = new Set([
  "run_command",
  "run_shell_command",
  "run_shell",
  "RunShellCommand",
  "shell",
  "execute",
  "bash",
]);

/** Tool names that map to search */
export const SEARCH_TOOLS = new Set([
  "search",
  "grep",
  "find",
  "glob",
  "search_files",
  "SearchFiles",
]);

/**
 * Check if text matches any pattern in a list.
 */
export function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

/**
 * Extract test count from output text.
 */
export function extractTestCount(text: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) return num;
    }
  }
  return 1; // default to 1 if we can't parse
}
