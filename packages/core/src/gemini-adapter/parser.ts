import { GeminiEventSchema, type GeminiEvent, type GeminiRawEvent } from "./types.js";

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

  const result = GeminiEventSchema.safeParse(raw);
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
