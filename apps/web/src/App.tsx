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

      {/* Main content */}
      <div style={{
        flex: 1,
        display: "flex",
        minHeight: 0,
        overflow: "hidden",
      }}>
        {/* Left: Battle arena + Dialogue */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}>
          {/* Battle scene */}
          <BattleArena />

          {/* Bottom section: Dialogue + Commands */}
          <div style={{
            flex: 1,
            display: "flex",
            minHeight: 0,
            overflow: "hidden",
          }}>
            {/* Dialogue box */}
            <DialogueBox />

            {/* Command menu */}
            <CommandMenu />
          </div>
        </div>

        {/* Right sidebar: Party */}
        <div style={{
          width: "180px",
          display: "flex",
          flexDirection: "column",
          borderLeft: `2px solid ${COLORS.panelBorder}`,
        }}>
          <PartyList />
        </div>
      </div>

      {/* Overlays */}
      {(phase === "idle" || phase === "quest-input") && <GuildBoard />}
      {phase === "complete" && <VictoryScreen />}
    </div>
  );
}
