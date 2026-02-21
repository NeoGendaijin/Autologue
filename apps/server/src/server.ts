import http from "node:http";
import { resolve } from "node:path";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { WsHandler } from "./ws-handler.js";
import { createRoutes } from "./routes.js";

export function createServer(): http.Server {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Serve generated output files so the browser can preview them (HTML games, etc.)
  const outputDir = resolve(process.cwd(), "output");
  app.use("/output", express.static(outputDir));

  const httpServer = http.createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const wsHandler = new WsHandler();

  wss.on("connection", (ws) => {
    wsHandler.handleConnection(ws);
  });

  app.use("/api", createRoutes(wsHandler));

  return httpServer;
}
