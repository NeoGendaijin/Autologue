import { useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import type { TacticType } from "@agent-quest/core/browser";

const TACTIC_KEYS: Record<string, TacticType> = {
  "1": "summarize",
  "2": "split-task",
  "3": "checkpoint",
  "4": "forget",
};

export function useKeyboard() {
  const phase = useGameStore((s) => s.state.phase);
  const pendingQuestion = useGameStore((s) => s.state.pendingQuestion);
  const makeChoice = useGameStore((s) => s.makeChoice);
  const useTactic = useGameStore((s) => s.useTactic);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toUpperCase();

      // A/B/C during question phase to select choices
      if (phase === "question" && pendingQuestion) {
        const choiceIndex = key.charCodeAt(0) - 65; // A=0, B=1, C=2
        if (
          choiceIndex >= 0 &&
          choiceIndex < pendingQuestion.choices.length
        ) {
          e.preventDefault();
          const choice = pendingQuestion.choices[choiceIndex];
          makeChoice(choiceIndex, choice.label);
          return;
        }
      }

      // 1-4 for tactics during active game
      if (phase === "running" || phase === "question") {
        const tactic = TACTIC_KEYS[e.key];
        if (tactic) {
          e.preventDefault();
          useTactic(tactic);
          return;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, pendingQuestion, makeChoice, useTactic]);
}
