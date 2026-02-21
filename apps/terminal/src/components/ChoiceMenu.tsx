import React from "react";
import { Box, Text, useInput } from "ink";
import type { QuestionEvent } from "@agent-quest/core";

export interface ChoiceMenuProps {
  question: QuestionEvent;
  onChoice: (index: number) => void;
}

/**
 * Choice menu displayed when the agent asks a question.
 * Uses number keys (1/2/3) to select a choice.
 */
export function ChoiceMenu({ question, onChoice }: ChoiceMenuProps) {
  useInput((input) => {
    const num = parseInt(input, 10);
    if (num >= 1 && num <= question.choices.length) {
      onChoice(num - 1);
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="yellow"
      paddingX={1}
      paddingY={0}
    >
      <Text bold color="yellow">
        ? AGENT ASKS:
      </Text>
      <Text color="white" wrap="wrap">
        {question.text.length > 120
          ? question.text.slice(0, 117) + "..."
          : question.text}
      </Text>
      <Text> </Text>
      {question.choices.map((choice, i) => {
        const riskColor =
          choice.risk === "LOW"
            ? "green"
            : choice.risk === "MED"
              ? "yellow"
              : "red";
        return (
          <Box key={i} gap={1}>
            <Text bold color="yellow">
              [{i + 1}]
            </Text>
            <Text color="white">{choice.label}</Text>
            <Text dimColor>
              Cost:{choice.contextCost}
            </Text>
            <Text dimColor>
              Qual:{choice.quality}
            </Text>
            <Text color={riskColor}>
              Risk:{choice.risk}
            </Text>
          </Box>
        );
      })}
      <Text dimColor>Press 1, 2, or 3 to choose</Text>
    </Box>
  );
}
