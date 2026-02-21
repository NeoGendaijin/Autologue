import http from "node:http";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { WsHandler } from "./ws-handler.js";
import { createRoutes } from "./routes.js";

export function createServer(): http.Server {
  const app = express();
  const __dirname = dirname(fileURLToPath(import.meta.url));

  app.use(cors());
  app.use(express.json());

  // Serve generated output files so the browser can preview them (HTML games, etc.)
  const outputDir = resolve(process.cwd(), "output");
  app.use("/output", express.static(outputDir));

  // Serve static stage assets (battle backgrounds, etc.)
  const assetDir = resolve(__dirname, "../asset");
  app.use("/asset", express.static(assetDir));

  const httpServer = http.createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const wsHandler = new WsHandler();

  wss.on("connection", (ws) => {
    wsHandler.handleConnection(ws);
  });

  app.use("/api", createRoutes(wsHandler));

  return httpServer;
}
