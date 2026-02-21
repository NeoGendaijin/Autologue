import { z } from "zod";

// --- Zod Schemas ---

export const GeminiInitEventSchema = z.object({
  type: z.literal("init"),
  timestamp: z.number().optional(),
  sessionId: z.string().optional(),
  model: z.string().optional(),
});

export const GeminiMessageEventSchema = z.object({
  type: z.literal("message"),
  timestamp: z.number().optional(),
  role: z.enum(["user", "model"]),
  content: z.string(),
  isPartial: z.boolean().optional(),
  turnComplete: z.boolean().optional(),
});

export const GeminiToolUseEventSchema = z.object({
  type: z.literal("tool_use"),
  timestamp: z.number().optional(),
  toolName: z.string(),
  toolCallId: z.string().optional(),
  args: z.record(z.unknown()).optional(),
});

export const GeminiToolResultEventSchema = z.object({
  type: z.literal("tool_result"),
  timestamp: z.number().optional(),
  toolCallId: z.string().optional(),
  output: z.string().optional(),
  isError: z.boolean().optional(),
});

export const GeminiErrorEventSchema = z.object({
  type: z.literal("error"),
  timestamp: z.number().optional(),
  errorType: z.string().optional(),
  message: z.string().optional(),
  code: z.number().optional(),
});

export const GeminiStatsSchema = z.object({
  session: z
    .object({
      duration: z.number().optional(),
    })
    .optional(),
  model: z
    .object({
      turns: z.number().optional(),
      inputTokens: z.number().optional(),
      outputTokens: z.number().optional(),
    })
    .optional(),
  tools: z
    .object({
      calls: z.number().optional(),
    })
    .optional(),
});

export const GeminiResultEventSchema = z.object({
  type: z.literal("result"),
  timestamp: z.number().optional(),
  response: z.string().nullable().optional(),
  stats: GeminiStatsSchema.optional(),
  error: z
    .object({
      type: z.string().optional(),
      message: z.string().optional(),
      code: z.number().optional(),
    })
    .nullable()
    .optional(),
});

// Discriminated union of all known event types
export const GeminiEventSchema = z.discriminatedUnion("type", [
  GeminiInitEventSchema,
  GeminiMessageEventSchema,
  GeminiToolUseEventSchema,
  GeminiToolResultEventSchema,
  GeminiErrorEventSchema,
  GeminiResultEventSchema,
]);

// Fallback for unknown event types -- preserves raw data
export const GeminiRawEventSchema = z
  .object({
    type: z.string(),
  })
  .passthrough();

// --- TypeScript Types ---

export type GeminiInitEvent = z.infer<typeof GeminiInitEventSchema>;
export type GeminiMessageEvent = z.infer<typeof GeminiMessageEventSchema>;
export type GeminiToolUseEvent = z.infer<typeof GeminiToolUseEventSchema>;
export type GeminiToolResultEvent = z.infer<typeof GeminiToolResultEventSchema>;
export type GeminiErrorEvent = z.infer<typeof GeminiErrorEventSchema>;
export type GeminiResultEvent = z.infer<typeof GeminiResultEventSchema>;

export type GeminiEvent = z.infer<typeof GeminiEventSchema>;
export type GeminiRawEvent = z.infer<typeof GeminiRawEventSchema>;
