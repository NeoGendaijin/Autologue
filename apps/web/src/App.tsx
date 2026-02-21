import { useEffect, useState } from "react";
import { useGameStore } from "./store/gameStore";
import "./store/battleStore"; // Initialize battle subscription
import { useKeyboard } from "./hooks/useKeyboard";
import "./battle-animations.css";

import { TitleScreen } from "./ui/TitleScreen";
import { StatusBar } from "./ui/StatusBar";
import { BattleArena } from "./ui/BattleArena";
import { DialogueBox } from "./ui/DialogueBox";
import { CliLog } from "./ui/CliLog";
import { PartyList } from "./ui/PartyList";
import { GuildBoard } from "./ui/GuildBoard";
import { VictoryScreen } from "./ui/VictoryScreen";
import { GameOverScreen } from "./ui/GameOverScreen";

import { COLORS } from "./theme";

function MovingDottedDivider() {
  return (
    <div
      style={{
        height: "20px",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        background: "linear-gradient(180deg, #121223 0%, #0f0f1e 100%)",
        borderTop: `1px solid ${COLORS.panelBorder}`,
        borderBottom: `1px solid ${COLORS.panelBorder}`,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "4px",
          background: `repeating-linear-gradient(90deg, ${COLORS.gold} 0px, ${COLORS.gold} 8px, transparent 8px, transparent 18px)`,
          opacity: 0.9,
          animation: "dottedFlow 0.7s linear infinite",
        }}
      />
    </div>
  );
}

export function App() {
  const phase = useGameStore((s) => s.state.phase);
  const [showTitle, setShowTitle] = useState(true);

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
      <StatusBar />
      <MovingDottedDivider />

      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <BattleArena />
      </div>

      <MovingDottedDivider />

      <div style={{
        height: "230px",
        minHeight: "230px",
        maxHeight: "230px",
        display: "flex",
        overflow: "hidden",
        borderTop: `1px solid ${COLORS.panelBorder}`,
        background: COLORS.bgDark,
        zIndex: 8,
      }}>
        <PartyList />
        <DialogueBox />
        <CliLog />
      </div>

      {/* Overlays */}
      {(phase === "idle" || phase === "quest-input") && <GuildBoard />}
      {phase === "complete" && <VictoryScreen />}
      {phase === "game-over" && <GameOverScreen />}

      {/* Title Screen — shown once on first load */}
      {showTitle && <TitleScreen onStart={() => setShowTitle(false)} />}
    </div>
  );
}
