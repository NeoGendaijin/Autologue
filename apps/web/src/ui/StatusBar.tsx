import { useState, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { COLORS, PIXEL_FONT, PIXEL_FONT_SM } from "../theme";

function PixelBar({ current, max, color, darkColor, label }: {
  current: number; max: number; color: string; darkColor: string; label: string;
}) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ ...PIXEL_FONT_SM, color, minWidth: "24px" }}>{label}</span>
      <div style={{
        flex: 1,
        height: "10px",
        background: darkColor,
        border: `1px solid ${COLORS.borderLight}`,
        position: "relative",
        minWidth: "80px",
      }}>
        <div style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          transition: "width 0.5s ease",
        }} />
      </div>
      <span style={{ ...PIXEL_FONT_SM, color: COLORS.textDim, minWidth: "50px", textAlign: "right", fontSize: "7px" }}>
        {current}/{max}
      </span>
    </div>
  );
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function StatusBar() {
  const state = useGameStore((s) => s.state);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (state.phase !== "running" && state.phase !== "question") return;
    const timer = setInterval(() => {
      if (state.startTime > 0) {
        setElapsed(Date.now() - state.startTime);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [state.phase, state.startTime]);

  const contextRemaining = state.contextMax - state.contextUsed;
  const questName = state.currentQuest?.description
    ? state.currentQuest.description.slice(0, 40) + (state.currentQuest.description.length > 40 ? "..." : "")
    : "No active quest";

  return (
    <div style={{
      background: COLORS.bgDark,
      borderBottom: `2px solid ${COLORS.panelBorder}`,
      padding: "8px 16px",
      display: "flex",
      alignItems: "center",
      gap: "16px",
    }}>
      {/* Title */}
      <div style={{
        ...PIXEL_FONT,
        fontSize: "12px",
        color: COLORS.gold,
        textShadow: `0 0 8px ${COLORS.gold}44`,
        letterSpacing: "2px",
        whiteSpace: "nowrap",
      }}>
        AUTOLOGUE
      </div>

      <div style={{ width: "1px", height: "24px", background: COLORS.panelBorder }} />

      {/* Quest name */}
      <div style={{
        ...PIXEL_FONT_SM,
        color: COLORS.parchment,
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {questName}
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        {/* Timer */}
        <div style={{ ...PIXEL_FONT_SM, color: COLORS.textMid }}>
          {formatTime(elapsed)}
        </div>

        {/* Score */}
        <div style={{ ...PIXEL_FONT_SM, color: COLORS.gold }}>
          {state.score} G
        </div>

        {/* Level */}
        <div style={{
          ...PIXEL_FONT_SM,
          color: COLORS.expGold,
          background: COLORS.bgPanel,
          border: `1px solid ${COLORS.expGoldDark}`,
          padding: "2px 6px",
        }}>
          LV{state.level}
        </div>
      </div>

      <div style={{ width: "1px", height: "24px", background: COLORS.panelBorder }} />

      {/* Bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "200px" }}>
        <PixelBar label="HP" current={Math.max(0, contextRemaining)} max={state.contextMax} color={COLORS.hpRed} darkColor={COLORS.hpRedDark} />
        <PixelBar label="MP" current={state.mp} max={state.mpMax} color={COLORS.mpBlue} darkColor={COLORS.mpBlueDark} />
      </div>
    </div>
  );
}
