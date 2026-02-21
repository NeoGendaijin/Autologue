import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { COLORS, PIXEL_FONT_SM, PIXEL_FONT } from "../theme";
import type { TacticType } from "@agent-quest/core/browser";

interface TacticDef {
  icon: string;
  label: string;
  rpgName: string;
  tactic: TacticType;
}

const TACTICS: TacticDef[] = [
  { icon: "\uD83D\uDCCB", label: "Summarize", rpgName: "FOCUS", tactic: "summarize" },
  { icon: "\uD83D\uDD00", label: "Split Task", rpgName: "SPLIT", tactic: "split-task" },
  { icon: "\uD83D\uDCBE", label: "Checkpoint", rpgName: "SAVE", tactic: "checkpoint" },
  { icon: "\uD83D\uDD12", label: "Forget", rpgName: "PURGE", tactic: "forget" },
];

export function CommandMenu() {
  const phase = useGameStore((s) => s.state.phase);
  const useTactic = useGameStore((s) => s.useTactic);
  const [hoveredIdx, setHoveredIdx] = useState(-1);

  const isActive = phase === "running" || phase === "question";
  const isQuestion = phase === "question";

  return (
    <div style={{
      background: COLORS.bgPanel,
      border: `2px solid ${COLORS.panelBorder}`,
      padding: "10px 12px",
      minWidth: "220px",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      animation: isQuestion ? "borderGlow 2s infinite ease" : undefined,
    }}>
      {/* Header */}
      <div style={{
        ...PIXEL_FONT_SM,
        color: isQuestion ? COLORS.gold : COLORS.textDim,
        letterSpacing: "2px",
        marginBottom: "6px",
        animation: isQuestion ? "shimmer 2s infinite ease" : undefined,
      }}>
        {isQuestion ? "ENEMY AWAITS..." : "COMMANDS"}
      </div>

      {/* Tactics */}
      {TACTICS.map((t, i) => (
        <button
          key={t.tactic}
          disabled={!isActive}
          onClick={() => useTactic(t.tactic)}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
            padding: "6px 10px",
            background: hoveredIdx === i && isActive ? `${COLORS.selectCursor}11` : "transparent",
            border: `1px solid ${hoveredIdx === i && isActive ? COLORS.selectCursor : COLORS.panelBorder}`,
            color: isActive ? COLORS.parchment : COLORS.textDim,
            cursor: isActive ? "pointer" : "not-allowed",
            opacity: isActive ? 1 : 0.4,
            textAlign: "left",
            ...PIXEL_FONT_SM,
          }}
        >
          <span style={{
            color: COLORS.selectCursor,
            minWidth: "12px",
            animation: hoveredIdx === i && isActive ? "wobble 0.5s infinite" : undefined,
          }}>
            {hoveredIdx === i && isActive ? "\u25B6" : " "}
          </span>
          <span style={{
            fontSize: "18px",
            animation: isActive ? "sway 4s infinite ease" : undefined,
            animationDelay: `${i * 0.2}s`,
          }}>
            {t.icon}
          </span>
          <span style={{ flex: 1 }}>{t.rpgName}</span>
          <span style={{ color: COLORS.textDim, fontSize: "9px" }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}
