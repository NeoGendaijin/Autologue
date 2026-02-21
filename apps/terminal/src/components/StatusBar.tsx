import React from "react";
import { Box, Text } from "ink";

export interface StatusBarProps {
  label: string;
  icon: string;
  value: number;
  max: number;
  color?: string;
}

/**
 * HP/MP/EXP bar using block characters.
 * Color: green >50%, yellow 20-50%, red <20%.
 */
export function StatusBar({ label, icon, value, max, color }: StatusBarProps) {
  const ratio = max > 0 ? value / max : 0;
  const pct = Math.round(ratio * 100);
  const barWidth = 12;
  const filled = Math.round(ratio * barWidth);
  const empty = barWidth - filled;

  // Auto-color based on ratio if not specified
  let barColor = color;
  if (!barColor) {
    if (ratio > 0.5) {
      barColor = "green";
    } else if (ratio > 0.2) {
      barColor = "yellow";
    } else {
      barColor = "red";
    }
  }

  const filledBar = "\u2588".repeat(filled);
  const emptyBar = "\u2591".repeat(empty);

  // Format value display
  let valueDisplay: string;
  if (max >= 10000) {
    valueDisplay = `${Math.round(value / 1000)}K/${Math.round(max / 1000)}K`;
  } else {
    valueDisplay = `${value}/${max}`;
  }

  return (
    <Box>
      <Text>
        {icon} {label.padEnd(8)}
      </Text>
      <Text>[</Text>
      <Text color={barColor}>{filledBar}</Text>
      <Text dimColor>{emptyBar}</Text>
      <Text>] </Text>
      <Text color={barColor}>{pct}%</Text>
      <Text dimColor>  {valueDisplay}</Text>
    </Box>
  );
}
