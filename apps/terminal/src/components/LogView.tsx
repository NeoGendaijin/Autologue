import React from "react";
import { Box, Text } from "ink";
import type { LogEntry, LogType } from "@agent-quest/core";

const MAX_VISIBLE = 15;

const LOG_COLORS: Record<LogType, string> = {
  info: "gray",
  action: "cyan",
  success: "green",
  error: "red",
  question: "yellow",
  spawn: "magenta",
};

const LOG_ICONS: Record<LogType, string> = {
  info: "\u2591",
  action: "\u25B8",
  success: "\u2726",
  error: "\u2717",
  question: "?",
  spawn: "\u2605",
};

export interface LogViewProps {
  entries: LogEntry[];
}

/**
 * Scrolling log panel showing the last 15 entries.
 * Each entry is color-coded by log type.
 */
export function LogView({ entries }: LogViewProps) {
  const visible = entries.slice(-MAX_VISIBLE);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1}>
      <Text bold color="white">
        {"-- LOG " + "-".repeat(30)}
      </Text>
      {visible.length === 0 && (
        <Text dimColor>No events yet...</Text>
      )}
      {visible.map((entry, i) => {
        const icon = LOG_ICONS[entry.type] ?? "\u2591";
        const color = LOG_COLORS[entry.type] ?? "gray";
        const truncated =
          entry.text.length > 60
            ? entry.text.slice(0, 57) + "..."
            : entry.text;
        return (
          <Text key={i} color={color}>
            {icon} {truncated}
          </Text>
        );
      })}
      {/* Pad empty lines so layout stays stable */}
      {Array.from({ length: Math.max(0, MAX_VISIBLE - visible.length) }).map(
        (_, i) => (
          <Text key={`pad-${i}`}> </Text>
        )
      )}
    </Box>
  );
}
