// RPG Battle Theme — shared constants

export const COLORS = {
  // Backgrounds
  bg: "#1a1a2e",
  bgDark: "#0f0f1e",
  bgPanel: "#16213e",
  panelBorder: "#2a2a4a",

  // Battle
  hpRed: "#ff4444",
  hpRedDark: "#881111",
  mpBlue: "#44aaff",
  mpBlueDark: "#114488",
  expGold: "#ffcc00",
  expGoldDark: "#886600",

  // Text
  white: "#f0e6d3",
  parchment: "#e0d5c0",
  textDim: "#6a6a8a",
  textMid: "#9a9aba",

  // Accents
  gold: "#ffcc00",
  healGreen: "#44ff44",
  critYellow: "#ffff44",
  poison: "#aa44ff",
  fire: "#ff6622",
  ice: "#66ccff",

  // UI
  selectCursor: "#ffcc00",
  borderLight: "#3a3a5a",
  borderGlow: "#5a5aaa",
} as const;

export const PIXEL_FONT = {
  fontFamily: "'Press Start 2P', monospace",
} as const;

export const PIXEL_FONT_SM = {
  ...PIXEL_FONT,
  fontSize: "8px",
  lineHeight: "14px",
} as const;

export const PIXEL_FONT_MD = {
  ...PIXEL_FONT,
  fontSize: "10px",
  lineHeight: "16px",
} as const;

export const PIXEL_FONT_LG = {
  ...PIXEL_FONT,
  fontSize: "14px",
  lineHeight: "22px",
} as const;

// Agent type → emoji + name mapping
export const AGENT_SPRITES: Record<string, { emoji: string; name: string }> = {
  main: { emoji: "\u2694\uFE0F", name: "Hero" },
  search: { emoji: "\uD83D\uDD2E", name: "Scout" },
  test: { emoji: "\uD83D\uDEE1\uFE0F", name: "Guard" },
  docs: { emoji: "\uD83D\uDCDC", name: "Scribe" },
  fix: { emoji: "\uD83D\uDD27", name: "Smith" },
};

// --- Pixel Art Hero (CSS box-shadow sprite) ---
// 10x14 pixel knight, each cell = [row, col, color]
// _ = transparent, S = skin, H = helmet, A = armor, W = weapon, L = legs, C = cape
const _ = null;
const H = "#7788aa"; // helmet
const S = "#ffcc88"; // skin
const A = "#4466bb"; // armor
const W = "#ccccdd"; // weapon/sword
const L = "#333355"; // legs
const C = "#cc3333"; // cape accent

export const HERO_PIXELS: (string | null)[][] = [
  [_, _, _, H, H, H, _, _, _, _],
  [_, _, H, H, H, H, H, _, _, _],
  [_, _, H, S, S, S, H, _, _, _],
  [_, _, _, S, S, S, _, _, _, _],
  [_, _, _, A, A, A, _, _, _, _],
  [_, C, A, A, A, A, A, _, _, _],
  [_, C, A, A, A, A, A, W, _, _],
  [_, _, A, A, A, A, A, W, _, _],
  [_, _, _, A, A, A, _, W, _, _],
  [_, _, _, A, A, A, _, _, _, _],
  [_, _, _, L, _, L, _, _, _, _],
  [_, _, _, L, _, L, _, _, _, _],
  [_, _, L, L, _, L, L, _, _, _],
];

// --- Enemy types based on tool/action ---
export interface EnemyDef {
  name: string;
  emoji: string;
  color: string;
}

const TOOL_ENEMIES: Record<string, EnemyDef> = {
  write_file: { name: "File Wraith", emoji: "\uD83D\uDCDD", color: "#aa66ff" },
  read_file: { name: "Archive Eye", emoji: "\uD83D\uDC41\uFE0F", color: "#66aaff" },
  run_command: { name: "Shell Golem", emoji: "\uD83E\uDDDF", color: "#88aa44" },
  list_files: { name: "Index Shade", emoji: "\uD83D\uDCC2", color: "#aaaa44" },
};

const GENERIC_ENEMIES: EnemyDef[] = [
  { name: "Void Bug", emoji: "\uD83D\uDC1B", color: "#ff6644" },
  { name: "Null Bat", emoji: "\uD83E\uDD87", color: "#aa44aa" },
  { name: "Stack Imp", emoji: "\uD83D\uDC7E", color: "#44aaaa" },
  { name: "Heap Slime", emoji: "\uD83E\uDDA0", color: "#66cc66" },
];

let genericIdx = 0;

export function getEnemyForTool(toolName?: string): EnemyDef {
  if (toolName && TOOL_ENEMIES[toolName]) {
    return TOOL_ENEMIES[toolName];
  }
  const enemy = GENERIC_ENEMIES[genericIdx % GENERIC_ENEMIES.length];
  genericIdx++;
  return enemy;
}

// Boss enemy for the quest itself
export function generateBossName(_quest: string): { name: string; emoji: string } {
  const PREFIXES = ["Dark", "Shadow", "Void", "Chaos", "Null", "Async", "Dead"];
  const SUFFIXES = ["Dragon", "Golem", "Wraith", "Demon", "Knight"];
  const EMOJIS = ["\uD83D\uDC09", "\uD83D\uDC7E", "\uD83D\uDC80", "\uD83D\uDC79", "\u2620\uFE0F"];
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  return { name: `${prefix} ${suffix}`, emoji };
}
