import { create } from "zustand";
import type {
  GameState,
  TacticType,
  ClientToServerMessage,
} from "@agent-quest/core/browser";
import {
  createInitialState,
  parseServerToClientMessage,
} from "@agent-quest/core/browser";

export interface GameStore {
  // State
  state: GameState;
  connected: boolean;
  ws: WebSocket | null;
  sessionId: string | null;
  lastError: string | null;
  continueCwd: string | null;

  // Actions
  connect: (url: string) => void;
  disconnect: () => void;
  startQuest: (prompt: string, cwd?: string) => void;
  makeChoice: (index: number, response: string) => void;
  useTactic: (tactic: TacticType) => void;
  setMode: (mode: "expert" | "adventure") => void;
  resetState: () => void;
  deleteOutput: (outputDir: string) => void;
  continueProject: (cwd: string) => void;
  clearContinueCwd: () => void;
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
  sessionId: null,
  lastError: null,
  continueCwd: null,

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
      set({ connected: true, lastError: null });
    };

    ws.onclose = () => {
      set({ connected: false, ws: null, sessionId: null });
      scheduleReconnect();
    };

    ws.onerror = () => {
      set({ connected: false, lastError: "WebSocket error" });
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const raw = JSON.parse(event.data as string);
        const message = parseServerToClientMessage(raw);
        if (!message) return;

        switch (message.type) {
          case "session-id": {
            set({ sessionId: message.sessionId });
            break;
          }

          case "state-update": {
            set({ state: message.state, lastError: null });
            break;
          }

          case "error": {
            set({ lastError: message.message });
            break;
          }

          case "game-event":
          case "output-deleted": {
            // Ignored by state store; UI reacts from canonical state-update events.
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
    const { ws, connected, state } = get();
    if (ws && connected) {
      const message: ClientToServerMessage = {
        type: "start-quest",
        prompt,
        cwd,
        mode: state.mode,
      };
      ws.send(JSON.stringify(message));
    }
  },

  makeChoice: (index: number, response: string) => {
    const { ws, connected } = get();
    if (ws && connected) {
      const message: ClientToServerMessage = {
        type: "player-choice",
        choiceIndex: index,
        responseText: response,
      };
      ws.send(JSON.stringify(message));
    }
  },

  useTactic: (tactic: TacticType) => {
    const { ws, connected } = get();
    if (ws && connected) {
      const message: ClientToServerMessage = {
        type: "tactic",
        tactic,
      };
      ws.send(JSON.stringify(message));
    }
  },

  setMode: (mode: "expert" | "adventure") => {
    set((prev) => ({
      state: { ...prev.state, mode },
    }));
  },

  resetState: () => {
    set({ state: createInitialState() });
  },

  deleteOutput: (outputDir: string) => {
    const { ws, connected } = get();
    if (ws && connected) {
      const message: ClientToServerMessage = {
        type: "delete-output",
        outputDir,
      };
      ws.send(JSON.stringify(message));
    }
  },

  continueProject: (cwd: string) => {
    set({ continueCwd: cwd, state: createInitialState() });
  },

  clearContinueCwd: () => {
    set({ continueCwd: null });
  },
}));
