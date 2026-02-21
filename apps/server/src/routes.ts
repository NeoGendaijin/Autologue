import { Router } from "express";
import type { WsHandler } from "./ws-handler.js";

export function createRoutes(wsHandler: WsHandler): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  router.get("/session/:id/state", (req, res) => {
    const session = wsHandler.getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json(session.getState());
  });

  router.get("/session/:id/events", (req, res) => {
    const session = wsHandler.getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json(session.getEventLog());
  });

  return router;
}
