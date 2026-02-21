import { create } from "zustand";
import type { GameState, GameEvent, TacticType } from "@agent-quest/core/browser";
import { createInitialState, reduceGameEvent } from "@agent-quest/core/browser";

export interface GameStore {
  // State
  state: GameState;
  connected: boolean;
  ws: WebSocket | null;

  // Actions
  connect: (url: string) => void;
  disconnect: () => void;
  startQuest: (prompt: string, cwd?: string) => void;
  makeChoice: (index: number, response: string) => void;
  useTactic: (tactic: TacticType) => void;
  setMode: (mode: "expert" | "adventure") => void;
  applyEvent: (event: GameEvent) => void;
  resetState: () => void;
  deleteOutput: (outputDir: string) => void;
}

let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectUrl: string | null = null;
let intentionalClose = false;

function scheduleReconnect() {
  if (reconnectTimer || !reconnectUrl || intentionalClose) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (reconnectUrl && !intentionalClose) {
      useGameStore.getState().connect(reconnectUrl);
    }
  }, 1500);
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(),
  connected: false,
  ws: null,

  connect: (url: string) => {
    // Clean up existing connection
    const { ws: existingWs } = get();
    if (existingWs) {
      existingWs.close();
    }

    reconnectUrl = url;
    intentionalClose = false;

    const ws = new WebSocket(url);

    ws.onopen = () => {
      set({ connected: true });
    };

    ws.onclose = () => {
      set({ connected: false, ws: null });
      scheduleReconnect();
    };

    ws.onerror = () => {
      set({ connected: false });
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data as string);

        switch (message.type) {
          case "game-event": {
            const gameEvent = message.event as GameEvent;
            get().applyEvent(gameEvent);
            break;
          }

          case "state-update": {
            const newState = message.state as GameState;
            set({ state: newState });
            break;
          }

          default:
            break;
        }
      } catch {
        // Ignore malformed messages
      }
    };

    set({ ws });
  },

  disconnect: () => {
    intentionalClose = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    const { ws } = get();
    if (ws) {
      ws.close();
      set({ ws: null, connected: false });
    }
  },

  startQuest: (prompt: string, cwd?: string) => {
    const { ws, connected } = get();
    if (ws && connected) {
      ws.send(
        JSON.stringify({
          type: "start-quest",
          prompt,
          cwd,
        })
      );
    }
  },

  makeChoice: (index: number, response: string) => {
    const { ws, connected } = get();
    if (ws && connected) {
      ws.send(
        JSON.stringify({
          type: "player-choice",
          choiceIndex: index,
          response,
        })
      );
    }
  },

  useTactic: (tactic: TacticType) => {
    const { ws, connected } = get();
    if (ws && connected) {
      ws.send(
        JSON.stringify({
          type: "tactic",
          tactic,
        })
      );
    }
  },

  setMode: (mode: "expert" | "adventure") => {
    set((prev) => ({
      state: { ...prev.state, mode },
    }));
  },

  applyEvent: (event: GameEvent) => {
    set((prev) => ({
      state: reduceGameEvent(prev.state, event),
    }));
  },

  resetState: () => {
    set({ state: createInitialState() });
  },

  deleteOutput: (outputDir: string) => {
    const { ws, connected } = get();
    if (ws && connected) {
      ws.send(JSON.stringify({ type: "delete-output", outputDir }));
    }
  },
}));
