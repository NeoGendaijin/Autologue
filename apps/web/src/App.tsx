import { useEffect } from "react";
import { useGameStore } from "./store/gameStore";
import "./store/battleStore"; // Initialize battle subscription
import { useKeyboard } from "./hooks/useKeyboard";
import "./battle-animations.css";

import { StatusBar } from "./ui/StatusBar";
import { BattleArena } from "./ui/BattleArena";
import { DialogueBox } from "./ui/DialogueBox";
import { CommandMenu } from "./ui/CommandMenu";
import { PartyList } from "./ui/PartyList";
import { GuildBoard } from "./ui/GuildBoard";
import { VictoryScreen } from "./ui/VictoryScreen";

import { COLORS } from "./theme";

export function App() {
  const phase = useGameStore((s) => s.state.phase);

  useKeyboard();

  useEffect(() => {
    const { connect, disconnect } = useGameStore.getState();
    connect("ws://localhost:3001/ws");
    return () => disconnect();
  }, []);

  return (
    <div style={{
      background: COLORS.bg,
      minHeight: "100vh",
      maxHeight: "100vh",
      color: COLORS.white,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Top status bar */}
      <StatusBar />

      {/* Battle arena — takes all remaining space */}
      <BattleArena />

      {/* Bottom bar: Party + Dialogue + Commands — compact row */}
      <div style={{
        height: "170px",
        flexShrink: 0,
        display: "flex",
        minHeight: 0,
        overflow: "hidden",
        borderTop: `2px solid ${COLORS.panelBorder}`,
      }}>
        <PartyList />
        <DialogueBox />
        <CommandMenu />
      </div>

      {/* Overlays */}
      {(phase === "idle" || phase === "quest-input") && <GuildBoard />}
      {phase === "complete" && <VictoryScreen />}
    </div>
  );
}
