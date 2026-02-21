import { useState, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { COLORS, PIXEL_FONT, PIXEL_FONT_SM, PIXEL_FONT_MD } from "../theme";

function PixelBar({ current, max, color, darkColor, label, danger }: {
  current: number; max: number; color: string; darkColor: string; label: string; danger?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ ...PIXEL_FONT_SM, color, minWidth: "28px" }}>{label}</span>
      <div style={{
        flex: 1,
        height: "14px",
        background: darkColor,
        border: `1px solid ${COLORS.borderLight}`,
        position: "relative",
        minWidth: "120px",
      }}>
        <div style={{
          width: `${pct}%`,
          height: "100%",
          background: danger ? COLORS.fire : color,
          transition: "width 0.5s ease",
          animation: danger ? "dangerPulse 1s infinite" : undefined,
        }} />
      </div>
      <span style={{ ...PIXEL_FONT_SM, color: COLORS.textDim, minWidth: "70px", textAlign: "right" }}>
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
  const hpPct = (contextRemaining / state.contextMax) * 100;
  const mpPct = (state.mp / state.mpMax) * 100;
  const isActive = state.phase === "running" || state.phase === "question";
  const questName = state.currentQuest?.description
    ? state.currentQuest.description.slice(0, 50) + (state.currentQuest.description.length > 50 ? "..." : "")
    : "No active quest";

  return (
    <div style={{
      background: COLORS.bgDark,
      borderBottom: `2px solid ${COLORS.panelBorder}`,
      padding: "12px 20px",
      display: "flex",
      alignItems: "center",
      gap: "20px",
    }}>
      {/* Title */}
      <div style={{
        ...PIXEL_FONT,
        fontSize: "24px",
        color: COLORS.gold,
        letterSpacing: "3px",
        whiteSpace: "nowrap",
        animation: "shimmer 4s infinite ease",
      }}>
        AUTOLOGUE
      </div>

      <div style={{ width: "1px", height: "32px", background: COLORS.panelBorder }} />

      {/* Quest name */}
      <div style={{
        ...PIXEL_FONT_SM,
        color: COLORS.parchment,
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        animation: isActive ? "pulse 4s infinite ease" : undefined,
      }}>
        {questName}
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <div style={{
          ...PIXEL_FONT_SM,
          color: COLORS.textMid,
          animation: isActive ? "blink 2s infinite" : undefined,
        }}>
          {formatTime(elapsed)}
        </div>

        <div style={{
          ...PIXEL_FONT_SM,
          color: COLORS.gold,
          animation: state.score > 0 ? "shimmer 3s infinite ease" : undefined,
        }}>
          {state.score} G
        </div>

        <div style={{
          ...PIXEL_FONT_SM,
          color: COLORS.expGold,
          background: COLORS.bgPanel,
          border: `1px solid ${COLORS.expGoldDark}`,
          padding: "3px 10px",
          animation: "sway 5s infinite ease",
        }}>
          LV{state.level}
        </div>
      </div>

      <div style={{ width: "1px", height: "32px", background: COLORS.panelBorder }} />

      {/* Bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "280px" }}>
        <PixelBar label="HP" current={Math.max(0, contextRemaining)} max={state.contextMax} color={COLORS.hpRed} darkColor={COLORS.hpRedDark} danger={hpPct < 20} />
        <PixelBar label="MP" current={state.mp} max={state.mpMax} color={COLORS.mpBlue} darkColor={COLORS.mpBlueDark} danger={mpPct < 20} />
      </div>
    </div>
  );
}
