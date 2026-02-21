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
  fontSize: "11px",
  lineHeight: "18px",
} as const;

export const PIXEL_FONT_MD = {
  ...PIXEL_FONT,
  fontSize: "13px",
  lineHeight: "20px",
} as const;

export const PIXEL_FONT_LG = {
  ...PIXEL_FONT,
  fontSize: "18px",
  lineHeight: "26px",
} as const;

// Agent type → emoji + name mapping
export const AGENT_SPRITES: Record<string, { emoji: string; name: string }> = {
  main: { emoji: "\u2694\uFE0F", name: "Agent" },
  search: { emoji: "\uD83D\uDD2E", name: "Scout" },
  test: { emoji: "\uD83D\uDEE1\uFE0F", name: "Guard" },
  docs: { emoji: "\uD83D\uDCDC", name: "Scribe" },
  fix: { emoji: "\uD83D\uDD27", name: "Smith" },
};

// --- Pixel Art Main Agent (CSS box-shadow sprite) ---
// 10x14 pixel knight, each cell = [row, col, color]
// _ = transparent, S = skin, H = helmet, A = armor, W = weapon, L = legs, C = cape
const _ = null;
const H = "#7788aa"; // helmet
const S = "#ffcc88"; // skin
const A = "#4466bb"; // armor
const W = "#ccccdd"; // weapon/sword
const L = "#333355"; // legs
const C = "#cc3333"; // cape accent

export const AGENT_PIXELS: (string | null)[][] = [
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

// --- Sub-agent Pixel Sprites ---
// Scout (search) — 8x10, hooded figure with a crystal ball
const Sc = "#44aaff"; // scout cloak
const Sg = "#88ddff"; // scout glow
const Se = "#aaeeff"; // scout eye

export const SCOUT_PIXELS: (string | null)[][] = [
  [_, _, Sc, Sc, Sc, _, _, _],
  [_, Sc, Sc, Sc, Sc, Sc, _, _],
  [_, Sc, Se, S, Se, Sc, _, _],
  [_, _, S, S, S, _, _, _],
  [_, Sc, Sc, Sc, Sc, Sc, _, _],
  [Sc, Sc, Sc, Sc, Sc, Sc, Sc, _],
  [_, _, Sc, Sc, Sc, _, _, _],
  [_, _, Sg, _, Sg, _, _, _],
  [_, _, L, _, L, _, _, _],
  [_, L, L, _, L, L, _, _],
];

// Guard (test) — 8x10, shield-bearing warrior
const Gs = "#4488cc"; // guard shield
const Gd = "#336699"; // guard dark
const Ga = "#5599dd"; // guard armor

export const GUARD_PIXELS: (string | null)[][] = [
  [_, _, H, H, H, _, _, _],
  [_, H, H, H, H, H, _, _],
  [_, H, S, S, S, H, _, _],
  [_, _, S, S, S, _, _, _],
  [Gs, Ga, Ga, Ga, Ga, Ga, _, _],
  [Gs, Gs, Ga, Ga, Ga, Ga, _, _],
  [Gs, Gs, Ga, Ga, Ga, _, _, _],
  [Gs, _, Ga, Ga, Ga, _, _, _],
  [_, _, L, _, L, _, _, _],
  [_, L, L, _, L, L, _, _],
];

// Smith (fix) — 8x10, dwarf with hammer
const Sm = "#cc8844"; // smith hammer
const Sd = "#aa6633"; // smith dark
const Sa = "#886644"; // smith apron

export const SMITH_PIXELS: (string | null)[][] = [
  [_, _, S, S, S, _, _, _],
  [_, S, S, S, S, S, _, _],
  [_, Sd, S, S, S, Sd, _, _],
  [_, _, S, S, S, _, _, _],
  [_, Sa, Sa, Sa, Sa, Sa, Sm, _],
  [_, Sa, Sa, Sa, Sa, Sa, Sm, _],
  [_, _, Sa, Sa, Sa, _, Sm, _],
  [_, _, Sa, Sa, Sa, _, _, _],
  [_, _, L, _, L, _, _, _],
  [_, L, L, _, L, L, _, _],
];

// Map agent type → pixel array
export const AGENT_PIXEL_SPRITES: Record<string, (string | null)[][]> = {
  search: SCOUT_PIXELS,
  test: GUARD_PIXELS,
  fix: SMITH_PIXELS,
  docs: SCOUT_PIXELS, // reuse scout for scribe
};

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
