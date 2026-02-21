import { create } from "zustand";
import { useGameStore } from "./gameStore";
import { getEnemyForTool } from "../theme";

// Each encounter = one subtask/tool call = one enemy to defeat
export interface Encounter {
  id: string;
  name: string;
  emoji: string;
  color: string;
  toolName?: string;
  description: string; // what the tool is doing (e.g. "Writing index.ts")
  status: "active" | "defeated" | "upcoming";
}

export interface DamageNumber {
  id: string;
  value: string;
  isCrit: boolean;
  color: string;
  createdAt: number;
}

export interface BattleLogEntry {
  id: string;
  text: string;
  createdAt: number;
}

interface BattleState {
  encounters: Encounter[];
  currentIdx: number; // index of the active encounter
  damageNumbers: DamageNumber[];
  battleLog: BattleLogEntry[];
  screenShake: boolean;
  agentAttacking: boolean;
  agentHit: boolean;
}

interface BattleActions {
  spawnEncounter: (toolName: string | undefined, description: string) => void;
  defeatCurrent: () => void;
  triggerAgentAttack: () => void;
  triggerAgentHit: () => void;
  addBattleLog: (text: string) => void;
  addDamageNumber: (value: string, isCrit: boolean, color: string) => void;
  reset: () => void;
}

type BattleStore = BattleState & BattleActions;

let dmgCounter = 0;
let logCounter = 0;
let encounterCounter = 0;

export const useBattleStore = create<BattleStore>((set, get) => ({
  encounters: [],
  currentIdx: -1,
  damageNumbers: [],
  battleLog: [],
  screenShake: false,
  agentAttacking: false,
  agentHit: false,

  spawnEncounter: (toolName: string | undefined, description: string) => {
    const def = getEnemyForTool(toolName);
    const enc: Encounter = {
      id: `enc-${++encounterCounter}`,
      name: def.name,
      emoji: def.emoji,
      color: def.color,
      toolName,
      description,
      status: "active",
    };

    set((s) => {
      // Mark previous active as defeated
      const updated = s.encounters.map((e) =>
        e.status === "active" ? { ...e, status: "defeated" as const } : e
      );
      return {
        encounters: [...updated, enc],
        currentIdx: updated.length, // new encounter is at the end
      };
    });

    get().addBattleLog(`${def.emoji} ${def.name} appears!`);
  },

  defeatCurrent: () => {
    set((s) => {
      const updated = s.encounters.map((e, i) =>
        i === s.currentIdx ? { ...e, status: "defeated" as const } : e
      );
      return { encounters: updated };
    });
  },

  triggerAgentAttack: () => {
    set({ agentAttacking: true });
    setTimeout(() => set({ agentAttacking: false }), 500);
  },

  triggerAgentHit: () => {
    set({ agentHit: true, screenShake: true });
    setTimeout(() => set({ agentHit: false, screenShake: false }), 600);
  },

  addBattleLog: (text: string) => {
    const entry: BattleLogEntry = {
      id: `log-${++logCounter}`,
      text,
      createdAt: Date.now(),
    };
    set((s) => ({
      battleLog: [...s.battleLog.slice(-30), entry],
    }));
  },

  addDamageNumber: (value: string, isCrit: boolean, color: string) => {
    const num: DamageNumber = {
      id: `dmg-${++dmgCounter}`,
      value,
      isCrit,
      color,
      createdAt: Date.now(),
    };
    set((s) => ({ damageNumbers: [...s.damageNumbers, num] }));
    setTimeout(() => {
      set((s) => ({ damageNumbers: s.damageNumbers.filter((d) => d.id !== num.id) }));
    }, 1000);
  },

  reset: () => {
    set({
      encounters: [],
      currentIdx: -1,
      damageNumbers: [],
      battleLog: [],
      screenShake: false,
      agentAttacking: false,
      agentHit: false,
    });
  },
}));

// === Subscribe to game events and drive battle animations ===

let prevQuestLog: unknown[] = [];
let prevPhase = "idle";
let lastActivityAt = 0; // timestamp of last real event
let ambientTimer: ReturnType<typeof setInterval> | null = null;

const AMBIENT_MESSAGES = [
  "Agent analyzes the enemy...",
  "Charging energy...",
  "Preparing strategy...",
  "Sensing weaknesses...",
  "Agent focuses...",
  "Building momentum...",
  "Reading the battlefield...",
  "Gathering mana...",
  "Agent sharpens blade...",
  "Eyes locked on target...",
];

const AMBIENT_EFFECTS = ["⚡", "✦", "◆", "▸", "☄", "✧"] as const;

function startAmbientTimer() {
  if (ambientTimer) return;
  ambientTimer = setInterval(() => {
    const gamePhase = useGameStore.getState().state.phase;
    if (gamePhase !== "running") return;

    const now = Date.now();
    const sinceLast = now - lastActivityAt;
    // Only fire if no real activity for at least 2.5s
    if (sinceLast < 2500) return;

    const battle = useBattleStore.getState();
    const roll = Math.random();

    if (roll < 0.4) {
      // Charge-up attack with small damage
      const dmg = 1 + Math.floor(Math.random() * 4);
      battle.triggerAgentAttack();
      battle.addDamageNumber(String(dmg), false, "#aaaaff");
      battle.addBattleLog("Agent strikes while planning!");
    } else if (roll < 0.7) {
      // Ambient effect — floating symbol
      const sym = AMBIENT_EFFECTS[Math.floor(Math.random() * AMBIENT_EFFECTS.length)];
      battle.addDamageNumber(sym, false, "#8888cc");
      const msg = AMBIENT_MESSAGES[Math.floor(Math.random() * AMBIENT_MESSAGES.length)];
      battle.addBattleLog(msg);
    } else {
      // Just a battle log message
      const msg = AMBIENT_MESSAGES[Math.floor(Math.random() * AMBIENT_MESSAGES.length)];
      battle.addBattleLog(msg);
    }
  }, 2800);
}

function stopAmbientTimer() {
  if (ambientTimer) {
    clearInterval(ambientTimer);
    ambientTimer = null;
  }
}

useGameStore.subscribe((state) => {
  const battle = useBattleStore.getState();
  const phase = state.state.phase;
  const questLog = state.state.questLog;

  // Quest started
  if (phase === "running" && prevPhase !== "running" && prevPhase !== "question") {
    battle.reset();
    battle.addBattleLog("The quest begins...");
    lastActivityAt = Date.now();
    startAmbientTimer();
  }

  // Quest complete — defeat last enemy
  if (phase === "complete" && prevPhase !== "complete") {
    battle.defeatCurrent();
    battle.addBattleLog("All enemies defeated! Victory!");
    stopAmbientTimer();
  }

  // Game over
  if (phase === "game-over" && prevPhase !== "game-over") {
    battle.addBattleLog("Your party has fallen...");
    stopAmbientTimer();
  }

  // Phase reset
  if (phase === "idle" && prevPhase !== "idle") {
    battle.reset();
    stopAmbientTimer();
  }

  prevPhase = phase;

  // Process new log entries
  if (questLog.length > prevQuestLog.length) {
    lastActivityAt = Date.now();
    const newEntries = questLog.slice(prevQuestLog.length);
    for (const entry of newEntries) {
      switch (entry.type) {
        case "action": {
          // Thinking events — agent charges up
          if (/^Thinking:/i.test(entry.text)) {
            const snippet = entry.text.replace(/^Thinking:\s*/i, "").slice(0, 40);
            // Spawn a "thought" encounter if none active
            if (!battle.encounters.some((e) => e.status === "active")) {
              battle.spawnEncounter(undefined, `Planning: ${snippet}`);
            }
            const dmg = 2 + Math.floor(Math.random() * 4);
            battle.triggerAgentAttack();
            battle.addDamageNumber(String(dmg), false, "#aaddff");
            battle.addBattleLog(`Agent thinks... ${dmg} insight!`);
            break;
          }

          if (/^Writing\b/i.test(entry.text)) {
            // File write → new encounter
            battle.spawnEncounter("write_file", entry.text);
            const dmg = 5 + Math.floor(Math.random() * 8);
            battle.triggerAgentAttack();
            battle.addDamageNumber(String(dmg), false, "#ffffff");
            battle.addBattleLog(`Agent strikes! ${dmg} damage!`);
          } else if (/^Generating code/i.test(entry.text)) {
            battle.spawnEncounter("write_file", entry.text);
            const dmg = 8 + Math.floor(Math.random() * 12);
            battle.triggerAgentAttack();
            battle.addDamageNumber(String(dmg), false, "#66ccff");
            battle.addBattleLog(`Agent casts FORGE! ${dmg} damage!`);
          } else if (/^Using tool:\s*(\w+)/i.test(entry.text)) {
            const match = entry.text.match(/^Using tool:\s*(\w+)/i);
            const tool = match?.[1];
            battle.spawnEncounter(tool, entry.text);
            const dmg = 3 + Math.floor(Math.random() * 5);
            battle.triggerAgentAttack();
            battle.addDamageNumber(String(dmg), false, "#ffffff");
            battle.addBattleLog(`Quick strike! ${dmg} damage!`);
          } else if (/^Reading\b/i.test(entry.text)) {
            battle.spawnEncounter("read_file", entry.text);
            battle.addBattleLog("Agent scouts ahead...");
            // Instantly defeat read encounters (they're quick)
            setTimeout(() => battle.defeatCurrent(), 400);
          } else if (/^Running tests/i.test(entry.text)) {
            battle.spawnEncounter("run_command", entry.text);
            battle.addBattleLog("Agent prepares VERIFY...");
          }
          break;
        }
        case "success": {
          if (/test.*passed/i.test(entry.text)) {
            battle.defeatCurrent();
            const dmg = 15 + Math.floor(Math.random() * 10);
            battle.triggerAgentAttack();
            battle.addDamageNumber(String(dmg), true, "#ffff44");
            battle.addBattleLog(`CRITICAL HIT! ${dmg} damage!`);
          } else if (/Sub-agent completed/i.test(entry.text)) {
            battle.addBattleLog("Ally completes their mission!");
          }
          break;
        }
        case "error": {
          battle.triggerAgentHit();
          if (/test.*failed/i.test(entry.text)) {
            battle.addBattleLog("Enemy counterattacks!");
            battle.addDamageNumber("!", false, "#ff4444");
          } else {
            battle.addBattleLog("Enemy strikes back!");
            battle.addDamageNumber("!!", false, "#ff4444");
          }
          break;
        }
        case "spawn": {
          // Extract ally name from text like "Summoned Scout-1!"
          const allyMatch = entry.text.match(/Summoned\s+(.+?)!/);
          const allyName = allyMatch ? allyMatch[1] : "a new ally";
          battle.addBattleLog(`${allyName} joins the fight!`);
          // Dramatic summon effect
          battle.addDamageNumber("\u2728", false, "#aa44ff");
          break;
        }
        case "question": {
          battle.addBattleLog("Enemy challenges you! Choose your path!");
          break;
        }
        default:
          break;
      }
    }
  }

  prevQuestLog = questLog;
});
