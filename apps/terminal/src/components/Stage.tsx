import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import type { AgentInfo, AgentType } from "@agent-quest/core";
import { AGENT_FRAMES, AGENT_NAMES } from "../ascii/agents.js";
import { ACTION_EFFECTS } from "../ascii/effects.js";

const AGENT_COLORS: Record<AgentType, string> = {
  main: "cyan",
  search: "green",
  test: "magenta",
  docs: "yellow",
  fix: "red",
};

export interface StageProps {
  agents: AgentInfo[];
}

/**
 * ASCII art game stage displaying active agent characters.
 * Includes idle animation that cycles through frames.
 */
export function Stage({ agents }: StageProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % 60);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="cyan"
      paddingX={1}
      minHeight={7}
    >
      <Text bold color="cyan">
        {"-- STAGE " + "-".repeat(28)}
      </Text>
      {agents.length === 0 ? (
        <Box flexDirection="column" justifyContent="center" minHeight={4}>
          <Text dimColor>  No agents deployed...</Text>
        </Box>
      ) : (
        <Box flexDirection="row" gap={2} flexWrap="wrap">
          {agents.map((agent) => {
            const frames = AGENT_FRAMES[agent.type] ?? AGENT_FRAMES.main;
            const agentFrame = frames[frame % frames.length] ?? frames[0];
            const color = AGENT_COLORS[agent.type] ?? "white";
            const name = AGENT_NAMES[agent.type] ?? agent.name;

            // Show action effect if active
            const statusFrames = ACTION_EFFECTS[agent.status];
            const statusAnim = statusFrames
              ? statusFrames[frame % statusFrames.length]
              : "";

            return (
              <Box key={agent.id} flexDirection="column" alignItems="center">
                <Text color={color} bold>
                  {agentFrame}
                </Text>
                <Text color={color} dimColor={agent.status === "idle"}>
                  {name}
                </Text>
                <Text dimColor>
                  {agent.status}
                  {statusAnim ? ` ${statusAnim}` : ""}
                </Text>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
