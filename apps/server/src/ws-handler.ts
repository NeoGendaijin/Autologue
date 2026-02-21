import crypto from "node:crypto";
import { rmSync } from "node:fs";
import type { WebSocket } from "ws";
import { GeminiSession } from "./gemini-session.js";
import type { TacticType } from "@agent-quest/core";

interface StartQuestMessage {
  type: "start-quest";
  prompt: string;
  cwd?: string;
  mode?: "expert" | "adventure";
}

interface PlayerChoiceMessage {
  type: "player-choice";
  choiceIndex: number;
  responseText: string;
}

interface TacticMessage {
  type: "tactic";
  tactic: TacticType;
}

interface DeleteOutputMessage {
  type: "delete-output";
  outputDir: string;
}

type ClientMessage = StartQuestMessage | PlayerChoiceMessage | TacticMessage | DeleteOutputMessage;

export class WsHandler {
  private sessions = new Map<string, GeminiSession>();

  handleConnection(ws: WebSocket): void {
    const sessionId = crypto.randomUUID();

    ws.send(JSON.stringify({ type: "session-id", sessionId }));

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(String(data)) as ClientMessage;
        this.handleMessage(ws, sessionId, message);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Invalid message";
        ws.send(JSON.stringify({ type: "error", message: errorMsg }));
      }
    });

    ws.on("close", () => {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.destroy();
        this.sessions.delete(sessionId);
      }
    });

    ws.on("error", (err) => {
      console.error(`[ws] Error for session ${sessionId}:`, err.message);
      const session = this.sessions.get(sessionId);
      if (session) {
        session.destroy();
        this.sessions.delete(sessionId);
      }
    });
  }

  getSession(id: string): GeminiSession | undefined {
    return this.sessions.get(id);
  }

  private handleMessage(
    ws: WebSocket,
    sessionId: string,
    message: ClientMessage
  ): void {
    switch (message.type) {
      case "start-quest": {
        // Clean up any existing session
        const existing = this.sessions.get(sessionId);
        if (existing) {
          existing.destroy();
        }

        const session = new GeminiSession({
          prompt: message.prompt,
          cwd: message.cwd,
          mode: message.mode ?? "adventure",
        });

        this.sessions.set(sessionId, session);

        // Subscribe to session events and relay to the WebSocket client
        session.on("game-event", (event) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: "game-event", event }));
          }
        });

        session.on("state-update", (state) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: "state-update", state }));
          }
        });

        // Start the session (runs asynchronously)
        session.start().catch((err) => {
          const errorMsg = err instanceof Error ? err.message : "Session start failed";
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: "error", message: errorMsg }));
          }
        });

        break;
      }

      case "player-choice": {
        const session = this.sessions.get(sessionId);
        if (session) {
          session.handlePlayerChoice(message.choiceIndex, message.responseText);
        }
        break;
      }

      case "tactic": {
        const session = this.sessions.get(sessionId);
        if (session) {
          session.handleTactic(message.tactic);
        }
        break;
      }

      case "delete-output": {
        try {
          const dir = message.outputDir;
          // Safety: only allow deleting inside the output/ directory
          if (dir && dir.includes("/output/") && !dir.includes("..")) {
            rmSync(dir, { recursive: true, force: true });
            ws.send(JSON.stringify({ type: "output-deleted", outputDir: dir }));
            console.log(`[ws] Deleted output: ${dir}`);
          } else {
            ws.send(JSON.stringify({ type: "error", message: "Invalid output directory" }));
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Delete failed";
          ws.send(JSON.stringify({ type: "error", message: msg }));
        }
        break;
      }
    }
  }
}
