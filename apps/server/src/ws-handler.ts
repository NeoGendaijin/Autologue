import crypto from "node:crypto";
import { rmSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";
import type { WebSocket } from "ws";
import { GeminiSession } from "./gemini-session.js";
import {
  parseClientToServerMessage,
  type ClientToServerMessage,
  type ServerToClientMessage,
} from "@agent-quest/core";

export class WsHandler {
  private sessions = new Map<string, GeminiSession>();
  private readonly outputRoot = resolve(process.cwd(), "output");

  handleConnection(ws: WebSocket): void {
    const sessionId = crypto.randomUUID();

    this.send(ws, { type: "session-id", sessionId });

    ws.on("message", (data) => {
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(String(data));
      } catch {
        this.send(ws, { type: "error", message: "Invalid JSON payload" });
        return;
      }

      const message = parseClientToServerMessage(parsedJson);
      if (!message) {
        this.send(ws, { type: "error", message: "Invalid message payload" });
        return;
      }

      try {
        this.handleMessage(ws, sessionId, message);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Invalid message";
        this.send(ws, { type: "error", message: errorMsg });
      }
    });

    ws.on("close", () => {
      this.cleanupSession(sessionId);
    });

    ws.on("error", (err) => {
      console.error(`[ws] Error for session ${sessionId}:`, err.message);
      this.cleanupSession(sessionId);
    });
  }

  getSession(id: string): GeminiSession | undefined {
    return this.sessions.get(id);
  }

  private handleMessage(
    ws: WebSocket,
    sessionId: string,
    message: ClientToServerMessage
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
          this.send(ws, { type: "game-event", event });
        });

        session.on("state-update", (state) => {
          this.send(ws, { type: "state-update", state });
        });

        // Start the session (runs asynchronously)
        session.start().catch((err) => {
          const errorMsg = err instanceof Error ? err.message : "Session start failed";
          this.send(ws, { type: "error", message: errorMsg });
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
          const targetDir = this.resolveOutputTarget(message.outputDir);
          if (!targetDir) {
            this.send(ws, { type: "error", message: "Invalid output directory" });
            return;
          }

          rmSync(targetDir, { recursive: true, force: true });
          this.send(ws, { type: "output-deleted", outputDir: targetDir });
          console.log(`[ws] Deleted output: ${targetDir}`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Delete failed";
          this.send(ws, { type: "error", message: msg });
        }
        break;
      }
    }
  }

  private send(ws: WebSocket, message: ServerToClientMessage): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private cleanupSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.destroy();
    this.sessions.delete(sessionId);
  }

  private resolveOutputTarget(inputPath: string): string | null {
    const target = resolve(inputPath);
    const rel = relative(this.outputRoot, target);

    // Must stay under output/ and never allow deleting output root itself.
    if (!rel || rel.startsWith("..") || isAbsolute(rel)) {
      return null;
    }

    return target;
  }
}
