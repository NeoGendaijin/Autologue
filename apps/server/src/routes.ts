import { Router } from "express";
import { resolve } from "node:path";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import type { WsHandler } from "./ws-handler.js";

const EMOJI_MAP: Record<string, string> = {
  pong: "\uD83C\uDFD3", ping: "\uD83C\uDFD3", paddle: "\uD83C\uDFD3",
  snake: "\uD83D\uDC0D",
  todo: "\uD83D\uDCCB", task: "\uD83D\uDCCB",
  weather: "\uD83C\uDF24\uFE0F", forecast: "\uD83C\uDF24\uFE0F",
  report: "\uD83D\uDCF0", research: "\uD83D\uDCF0",
  equation: "\uD83E\uDDEE", math: "\uD83E\uDDEE", solve: "\uD83E\uDDEE", calc: "\uD83E\uDDEE",
  rpg: "\uD83C\uDFB2", battle: "\u2694\uFE0F",
  dashboard: "\uD83D\uDCC8", analytics: "\uD83D\uDCC8", chart: "\uD83D\uDCC8",
  tetris: "\uD83C\uDFAE", game: "\uD83C\uDFAE",
  space: "\uD83D\uDE80", shooter: "\uD83D\uDE80", rocket: "\uD83D\uDE80",
  chat: "\uD83D\uDCAC", bot: "\uD83E\uDD16",
  music: "\uD83C\uDFB5", audio: "\uD83C\uDFB5",
  image: "\uD83D\uDDBC\uFE0F", photo: "\uD83D\uDCF7",
  api: "\uD83D\uDD0C", server: "\uD83D\uDDA5\uFE0F",
};

function pickEmoji(dirName: string, title: string): string {
  const text = `${dirName} ${title}`.toLowerCase();
  for (const [keyword, emoji] of Object.entries(EMOJI_MAP)) {
    if (text.includes(keyword)) return emoji;
  }
  return "\uD83D\uDCDC"; // default scroll
}

function loadExampleQuests(): Array<{ emoji: string; label: string; prompt: string; cwd: string }> {
  const examplesDir = resolve(process.cwd(), "examples");
  if (!existsSync(examplesDir)) return [];

  const entries = readdirSync(examplesDir);
  const quests: Array<{ emoji: string; label: string; prompt: string; cwd: string }> = [];

  for (const entry of entries) {
    const fullPath = resolve(examplesDir, entry);
    if (!statSync(fullPath).isDirectory()) continue;

    const readmePath = resolve(fullPath, "README.md");
    if (!existsSync(readmePath)) continue;

    const content = readFileSync(readmePath, "utf-8");
    const lines = content.split("\n");

    // Extract title from first # heading
    const titleLine = lines.find((l) => l.startsWith("# "));
    const title = titleLine ? titleLine.replace(/^#\s+/, "").trim() : entry;

    const emoji = pickEmoji(entry, title);
    quests.push({
      emoji,
      label: title,
      prompt: content,
      cwd: `examples/${entry}`,
    });
  }

  return quests;
}

export function createRoutes(wsHandler: WsHandler): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  router.get("/examples", (_req, res) => {
    try {
      const quests = loadExampleQuests();
      res.json(quests);
    } catch (err) {
      res.status(500).json({ error: "Failed to load examples" });
    }
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
