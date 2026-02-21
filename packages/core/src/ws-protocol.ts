import { z } from "zod";
import type { TacticType, GameEvent } from "./game-engine/events.js";
import type { GameState } from "./game-engine/state.js";

const TacticTypeSchema = z.enum([
  "summarize",
  "split-task",
  "forget",
  "delegate",
  "checkpoint",
]);

const GameModeSchema = z.enum(["expert", "adventure"]);

export const StartQuestMessageSchema = z.object({
  type: z.literal("start-quest"),
  prompt: z.string().min(1),
  cwd: z.string().optional(),
  mode: GameModeSchema.optional(),
});

export const PlayerChoiceMessageSchema = z.object({
  type: z.literal("player-choice"),
  choiceIndex: z.number().int().min(0),
  responseText: z.string(),
});

export const TacticMessageSchema = z.object({
  type: z.literal("tactic"),
  tactic: TacticTypeSchema,
});

export const DeleteOutputMessageSchema = z.object({
  type: z.literal("delete-output"),
  outputDir: z.string().min(1),
});

export const ReviveMessageSchema = z.object({
  type: z.literal("revive"),
});

export const ClientToServerMessageSchema = z.discriminatedUnion("type", [
  StartQuestMessageSchema,
  PlayerChoiceMessageSchema,
  TacticMessageSchema,
  DeleteOutputMessageSchema,
  ReviveMessageSchema,
]);

export type StartQuestMessage = z.infer<typeof StartQuestMessageSchema>;
export type PlayerChoiceMessage = z.infer<typeof PlayerChoiceMessageSchema>;
export type TacticMessage = z.infer<typeof TacticMessageSchema>;
export type DeleteOutputMessage = z.infer<typeof DeleteOutputMessageSchema>;
export type ReviveMessage = z.infer<typeof ReviveMessageSchema>;
export type ClientToServerMessage = z.infer<typeof ClientToServerMessageSchema>;

export type ServerToClientMessage =
  | { type: "session-id"; sessionId: string }
  | { type: "game-event"; event: GameEvent }
  | { type: "state-update"; state: GameState }
  | { type: "error"; message: string }
  | { type: "output-deleted"; outputDir: string };

export function parseClientToServerMessage(
  input: unknown
): ClientToServerMessage | null {
  const parsed = ClientToServerMessageSchema.safeParse(input);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}

export function parseServerToClientMessage(
  input: unknown
): ServerToClientMessage | null {
  if (!input || typeof input !== "object") return null;
  const message = input as Record<string, unknown>;

  switch (message.type) {
    case "session-id":
      return typeof message.sessionId === "string"
        ? { type: "session-id", sessionId: message.sessionId }
        : null;

    case "game-event":
      return "event" in message
        ? { type: "game-event", event: message.event as GameEvent }
        : null;

    case "state-update":
      return "state" in message
        ? { type: "state-update", state: message.state as GameState }
        : null;

    case "error":
      return typeof message.message === "string"
        ? { type: "error", message: message.message }
        : null;

    case "output-deleted":
      return typeof message.outputDir === "string"
        ? { type: "output-deleted", outputDir: message.outputDir }
        : null;

    default:
      return null;
  }
}

export function isTacticType(value: string): value is TacticType {
  return TacticTypeSchema.safeParse(value).success;
}
