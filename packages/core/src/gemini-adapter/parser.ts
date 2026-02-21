import { GeminiEventSchema, type GeminiEvent, type GeminiRawEvent } from "./types.js";

type NormalizedStats = {
  session?: { duration?: number };
  model?: { turns?: number; inputTokens?: number; outputTokens?: number };
  tools?: { calls?: number };
};

function toObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function toNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function toTimestamp(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function normalizeStats(value: unknown): NormalizedStats | undefined {
  const statsObj = toObject(value);
  if (!statsObj) return undefined;

  // Legacy format
  if (toObject(statsObj.model)) {
    return statsObj as NormalizedStats;
  }

  // New stream-json format:
  // {
  //   total_tokens, input_tokens, output_tokens, cached, input, duration_ms, tool_calls
  // }
  const inputTokens = toNumber(statsObj.input_tokens) ?? toNumber(statsObj.input);
  const outputTokens = toNumber(statsObj.output_tokens);

  return {
    session: {
      duration: toNumber(statsObj.duration_ms),
    },
    model: {
      inputTokens,
      outputTokens,
    },
    tools: {
      calls: toNumber(statsObj.tool_calls),
    },
  };
}

function normalizeGeminiEvent(raw: unknown): GeminiEvent | null {
  const obj = toObject(raw);
  if (!obj) return null;

  const type = toString(obj.type);
  if (!type) return null;
  const timestamp = toTimestamp(obj.timestamp);

  switch (type) {
    case "init":
      return {
        type: "init",
        timestamp,
        sessionId: toString(obj.sessionId) ?? toString(obj.session_id),
        model: toString(obj.model),
      };

    case "message": {
      const rawRole = toString(obj.role);
      const role =
        rawRole === "assistant" || rawRole === "model"
          ? "model"
          : rawRole === "user"
            ? "user"
            : undefined;
      if (!role) return null;

      return {
        type: "message",
        timestamp,
        role,
        content: toString(obj.content) ?? "",
        isPartial: toBoolean(obj.isPartial) ?? toBoolean(obj.delta),
        turnComplete: toBoolean(obj.turnComplete),
      };
    }

    case "tool_use":
      return {
        type: "tool_use",
        timestamp,
        toolName: toString(obj.toolName) ?? toString(obj.tool_name) ?? "unknown",
        toolCallId: toString(obj.toolCallId) ?? toString(obj.tool_id),
        args: toObject(obj.args) ?? toObject(obj.parameters) ?? undefined,
      };

    case "tool_result": {
      const errorObj = toObject(obj.error);
      const status = toString(obj.status);

      return {
        type: "tool_result",
        timestamp,
        toolCallId: toString(obj.toolCallId) ?? toString(obj.tool_id),
        output: toString(obj.output) ?? toString(errorObj?.message),
        isError:
          toBoolean(obj.isError) ??
          (status === "error" ? true : status === "success" ? false : undefined),
      };
    }

    case "error":
      return {
        type: "error",
        timestamp,
        severity:
          toString(obj.severity) === "warning"
            ? "warning"
            : toString(obj.severity) === "error"
              ? "error"
              : undefined,
        errorType: toString(obj.errorType) ?? toString(obj.error_type),
        message: toString(obj.message),
        code: toNumber(obj.code),
      };

    case "result": {
      const errorObj = toObject(obj.error);
      const status = toString(obj.status);
      const hasError = !!errorObj || status === "error";
      return {
        type: "result",
        timestamp,
        response: toString(obj.response) ?? null,
        stats: normalizeStats(obj.stats),
        error: hasError
          ? {
              type: toString(errorObj?.type) ?? (status === "error" ? "error" : undefined),
              message: toString(errorObj?.message),
              code: toNumber(errorObj?.code),
            }
          : undefined,
      };
    }

    default:
      return null;
  }
}

/**
 * Parse a single JSONL line into a GeminiEvent.
 * Returns null for lines that fail parsing or validation.
 */
export function parseGeminiLine(line: string): GeminiEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(trimmed);
  } catch {
    console.warn("[parser] Invalid JSON line:", trimmed.slice(0, 100));
    return null;
  }

  const normalized = normalizeGeminiEvent(raw);
  if (!normalized) {
    const rawObj = raw as GeminiRawEvent;
    console.warn(`[parser] Unrecognized event type "${rawObj?.type}"`);
    return null;
  }

  const result = GeminiEventSchema.safeParse(normalized);
  if (result.success) {
    return result.data;
  }

  // Log unrecognized event types for debugging, don't crash
  const rawObj = raw as GeminiRawEvent;
  console.warn(
    `[parser] Unrecognized event type "${rawObj?.type}":`,
    result.error.issues[0]?.message
  );
  return null;
}

/**
 * Create an async generator that yields GeminiEvents from a ReadableStream.
 * Handles line buffering (partial lines across chunks).
 */
export async function* createGeminiEventStream(
  readable: NodeJS.ReadableStream
): AsyncGenerator<GeminiEvent> {
  let buffer = "";

  for await (const chunk of readable) {
    buffer += chunk.toString();

    // Split on newlines, keeping the last (possibly incomplete) part in buffer
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const event = parseGeminiLine(line);
      if (event) {
        yield event;
      }
    }
  }

  // Process any remaining data in the buffer
  if (buffer.trim()) {
    const event = parseGeminiLine(buffer);
    if (event) {
      yield event;
    }
  }
}
