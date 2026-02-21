import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Text, useInput, useApp } from "ink";
import {
  type GameState,
  type GameEvent,
  createInitialState,
  reduceGameEvent,
  createQuest,
  buildQuestResult,
  GeminiProcess,
  EventMapper,
  formatPlayerResponse,
} from "@agent-quest/core";
import { Stage } from "./components/Stage.js";
import { StatusBar } from "./components/StatusBar.js";
import { LogView } from "./components/LogView.js";
import { ChoiceMenu } from "./components/ChoiceMenu.js";
import { PartyList } from "./components/PartyList.js";

/**
 * Main terminal layout for Agent Quest.
 */
export function App() {
  const { exit } = useApp();
  const [state, setState] = useState<GameState>(createInitialState);
  const [questInput, setQuestInput] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const processRef = useRef<GeminiProcess | null>(null);

  // Timer that ticks every second during a running quest
  useEffect(() => {
    if (state.phase !== "running" && state.phase !== "question") return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - state.startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [state.phase, state.startTime]);

  // Dispatch a game event through the reducer
  const dispatch = useCallback((event: GameEvent) => {
    setState((prev) => reduceGameEvent(prev, event));
  }, []);

  // Start processing the Gemini event stream
  const startQuest = useCallback(
    async (description: string) => {
      const quest = createQuest({ description, cwd: process.cwd() });
      dispatch({ type: "QUEST_START", quest });

      const gemini = new GeminiProcess({ prompt: description, cwd: process.cwd() });
      processRef.current = gemini;

      try {
        gemini.start();
      } catch (err) {
        dispatch({
          type: "ERROR",
          message: `Failed to start Gemini: ${err instanceof Error ? err.message : String(err)}`,
          severity: "fatal",
        });
        return;
      }

      const mapper = new EventMapper();

      try {
        const stream = gemini.getEventStream();
        for await (const rawEvent of stream) {
          const gameEvents = mapper.map(rawEvent);
          for (const ge of gameEvents) {
            dispatch(ge);
          }
        }
      } catch (err) {
        dispatch({
          type: "ERROR",
          message: `Stream error: ${err instanceof Error ? err.message : String(err)}`,
          severity: "error",
        });
      }

      // Stream ended -- build quest result
      setState((prev) => {
        if (prev.phase === "running" || prev.phase === "question") {
          const result = buildQuestResult(prev);
          return reduceGameEvent(prev, { type: "QUEST_COMPLETE", result });
        }
        return prev;
      });
    },
    [dispatch]
  );

  // Handle player choice in question phase
  const handleChoice = useCallback(
    (index: number) => {
      if (!state.pendingQuestion || !processRef.current) return;
      const choice = state.pendingQuestion.choices[index];
      if (!choice) return;

      // Send formatted response to Gemini process
      const response = formatPlayerResponse(choice, state.mode);
      processRef.current.sendInput(response);

      dispatch({
        type: "PLAYER_CHOICE",
        choiceIndex: index,
        response: choice.label,
      });
    },
    [state.pendingQuestion, state.mode, dispatch]
  );

  // Keyboard input handler
  useInput((input, key) => {
    // Quit with Ctrl+C or q when idle/complete
    if (key.ctrl && input === "c") {
      processRef.current?.kill();
      exit();
      return;
    }

    if (state.phase === "idle" || state.phase === "quest-input") {
      // Quest input mode
      if (key.return && questInput.trim().length > 0) {
        setState((prev) => ({ ...prev, phase: "quest-input" }));
        startQuest(questInput.trim());
        setQuestInput("");
        return;
      }
      if (key.backspace || key.delete) {
        setQuestInput((prev) => prev.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        setQuestInput((prev) => prev + input);
      }
      return;
    }

    if (state.phase === "complete" || state.phase === "game-over") {
      // Press enter to start a new quest or q to quit
      if (key.return) {
        setState(createInitialState());
        setQuestInput("");
        setElapsed(0);
        return;
      }
      if (input === "q") {
        processRef.current?.kill();
        exit();
        return;
      }
    }
  });

  // Format elapsed time
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  // Mode badge
  const modeBadge = state.mode === "adventure" ? "ADV" : "EXP";

  return (
    <Box flexDirection="column" width="100%">
      {/* Header Bar */}
      <Box
        borderStyle="double"
        borderColor="cyan"
        paddingX={1}
        justifyContent="space-between"
      >
        <Text bold color="cyan">
          AGENT QUEST
        </Text>
        <Box gap={2}>
          <Text color="magenta">[{modeBadge}]</Text>
          <Text color="yellow">Score: {state.score}</Text>
          <Text color="green">Lv.{state.level}</Text>
          <Text color="white">Time: {timeStr}</Text>
        </Box>
      </Box>

      {/* Main Area */}
      <Box flexDirection="row" minHeight={20}>
        {/* Left: Stage + Log */}
        <Box flexDirection="column" flexGrow={1} flexBasis="70%">
          <Stage agents={state.agents} />
          <LogView entries={state.questLog} />
        </Box>

        {/* Right Sidebar */}
        <Box
          flexDirection="column"
          flexBasis="30%"
          borderStyle="single"
          borderColor="gray"
          paddingX={1}
          gap={1}
        >
          <Text bold color="white">
            {"-- STATUS " + "-".repeat(14)}
          </Text>
          <StatusBar
            icon={"\u2764"}
            label="CONTEXT"
            value={state.contextUsed}
            max={state.contextMax}
          />
          <StatusBar
            icon={"\u25C6"}
            label="API MP"
            value={state.mp}
            max={state.mpMax}
          />
          <StatusBar
            icon={"\u2605"}
            label="EXP"
            value={state.exp}
            max={state.level * 100}
            color="cyan"
          />

          <Text> </Text>
          <PartyList agents={state.agents} />
        </Box>
      </Box>

      {/* Bottom: Input or Choice */}
      {(state.phase === "idle" || state.phase === "quest-input") && (
        <Box borderStyle="single" borderColor="green" paddingX={1}>
          <Text bold color="green">
            QUEST&gt;{" "}
          </Text>
          <Text color="white">{questInput}</Text>
          <Text color="green" dimColor>
            {questInput.length === 0 ? " Enter a quest description..." : "\u2588"}
          </Text>
        </Box>
      )}

      {state.phase === "question" && state.pendingQuestion && (
        <ChoiceMenu question={state.pendingQuestion} onChoice={handleChoice} />
      )}

      {state.phase === "running" && (
        <Box borderStyle="single" borderColor="cyan" paddingX={1}>
          <Text color="cyan" dimColor>
            Quest in progress... Press Ctrl+C to abort.
          </Text>
        </Box>
      )}

      {state.phase === "complete" && state.lastResult && (
        <Box
          flexDirection="column"
          borderStyle="double"
          borderColor="green"
          paddingX={1}
        >
          <Text bold color="green">
            === QUEST COMPLETE ===
          </Text>
          <Box gap={2}>
            <Text color="yellow">
              Rank: {state.lastResult.rank}
            </Text>
            <Text color="cyan">
              Score: {state.lastResult.score}
            </Text>
            <Text color="white">
              Duration: {Math.round(state.lastResult.duration / 1000)}s
            </Text>
            <Text color="green">
              Tests: {state.lastResult.testsPassed}/{state.lastResult.testsPassed + state.lastResult.testsFailed}
            </Text>
          </Box>
          {state.lastResult.achievements.length > 0 && (
            <Box gap={1}>
              <Text bold color="yellow">Achievements:</Text>
              {state.lastResult.achievements.map((a) => (
                <Text key={a.id} color="yellow">
                  {a.icon} {a.name}
                </Text>
              ))}
            </Box>
          )}
          <Text dimColor>Press Enter for new quest, q to quit</Text>
        </Box>
      )}

      {state.phase === "game-over" && (
        <Box
          flexDirection="column"
          borderStyle="double"
          borderColor="red"
          paddingX={1}
        >
          <Text bold color="red">
            === GAME OVER ===
          </Text>
          <Text color="white">
            Final Score: {state.score}
          </Text>
          <Text dimColor>Press Enter to try again, q to quit</Text>
        </Box>
      )}
    </Box>
  );
}
