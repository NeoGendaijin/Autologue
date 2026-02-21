import React from "react";
import { Box, Text } from "ink";
import type { AgentInfo, AgentType } from "@agent-quest/core";

const PARTY_ICONS: Record<AgentType, string> = {
  main: "\u{1F916}",
  search: "\u{1F50D}",
  test: "\u{1F9EA}",
  docs: "\u{1F4DD}",
  fix: "\u{1F527}",
};

const AGENT_COLORS: Record<AgentType, string> = {
  main: "cyan",
  search: "green",
  test: "magenta",
  docs: "yellow",
  fix: "red",
};

export interface PartyListProps {
  agents: AgentInfo[];
  maxParty?: number;
}

/**
 * Party list showing active agents with compact HP bars.
 */
export function PartyList({ agents, maxParty = 5 }: PartyListProps) {
  return (
    <Box flexDirection="column">
      <Text bold color="white">
        PARTY [{agents.length}/{maxParty}]
      </Text>
      {agents.length === 0 && (
        <Text dimColor>  (empty)</Text>
      )}
      {agents.map((agent) => {
        const icon = PARTY_ICONS[agent.type] ?? "\u{1F916}";
        const color = AGENT_COLORS[agent.type] ?? "white";
        const hpBarWidth = 5;
        const filled = Math.round((agent.hp / 100) * hpBarWidth);
        const empty = hpBarWidth - filled;
        const hpBar =
          "\u2588".repeat(filled) + "\u2591".repeat(empty);
        const name = agent.name.length > 8
          ? agent.name.slice(0, 8)
          : agent.name.padEnd(8);

        return (
          <Box key={agent.id} gap={1}>
            <Text>{icon}</Text>
            <Text color={color}>{name}</Text>
            <Text color={agent.hp > 50 ? "green" : agent.hp > 20 ? "yellow" : "red"}>
              [{hpBar}]
            </Text>
            <Text dimColor>Lv.{agent.level}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
