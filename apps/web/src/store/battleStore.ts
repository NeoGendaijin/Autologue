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

useGameStore.subscribe((state) => {
  const battle = useBattleStore.getState();
  const phase = state.state.phase;
  const questLog = state.state.questLog;

  // Quest started
  if (phase === "running" && prevPhase !== "running" && prevPhase !== "question") {
    battle.reset();
    battle.addBattleLog("The quest begins...");
  }

  // Quest complete — defeat last enemy
  if (phase === "complete" && prevPhase !== "complete") {
    battle.defeatCurrent();
    battle.addBattleLog("All enemies defeated! Victory!");
  }

  // Game over
  if (phase === "game-over" && prevPhase !== "game-over") {
    battle.addBattleLog("Your party has fallen...");
  }

  // Phase reset
  if (phase === "idle" && prevPhase !== "idle") {
    battle.reset();
  }

  prevPhase = phase;

  // Process new log entries
  if (questLog.length > prevQuestLog.length) {
    const newEntries = questLog.slice(prevQuestLog.length);
    for (const entry of newEntries) {
      switch (entry.type) {
        case "action": {
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
