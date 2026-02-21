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
  const pendingQuestion = useGameStore((s) => s.state.pendingQuestion);
  const makeChoice = useGameStore((s) => s.makeChoice);
  const useTactic = useGameStore((s) => s.useTactic);
  const [hoveredIdx, setHoveredIdx] = useState(-1);

  const isActive = phase === "running" || phase === "question";
  const isQuestion = phase === "question" && pendingQuestion;

  return (
    <div style={{
      background: COLORS.bgPanel,
      border: `2px solid ${COLORS.panelBorder}`,
      padding: "8px",
      minWidth: "180px",
      display: "flex",
      flexDirection: "column",
      gap: "2px",
      animation: isQuestion ? "borderGlow 2s infinite ease" : undefined,
    }}>
      {/* Header */}
      <div style={{
        ...PIXEL_FONT_SM,
        color: isQuestion ? COLORS.gold : COLORS.textDim,
        letterSpacing: "2px",
        marginBottom: "4px",
        fontSize: "7px",
        animation: isQuestion ? "shimmer 2s infinite ease" : undefined,
      }}>
        {isQuestion ? "CHOOSE ACTION" : "COMMANDS"}
      </div>

      {/* Question choices */}
      {isQuestion && pendingQuestion && (
        <>
          <div style={{
            ...PIXEL_FONT_SM,
            color: COLORS.parchment,
            fontSize: "8px",
            marginBottom: "6px",
            padding: "4px",
            background: COLORS.bgDark,
            border: `1px solid ${COLORS.borderLight}`,
            lineHeight: "14px",
            animation: "slideInLeft 0.3s ease",
          }}>
            &ldquo;{pendingQuestion.text}&rdquo;
          </div>
          {pendingQuestion.choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => makeChoice(i, choice.label)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(-1)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                width: "100%",
                padding: "4px 6px",
                background: hoveredIdx === i ? `${COLORS.selectCursor}11` : "transparent",
                border: `1px solid ${hoveredIdx === i ? COLORS.selectCursor : COLORS.panelBorder}`,
                color: COLORS.parchment,
                cursor: "pointer",
                textAlign: "left",
                ...PIXEL_FONT_SM,
                fontSize: "8px",
                animation: `bounceIn 0.3s ease`,
                animationDelay: `${i * 0.1}s`,
                animationFillMode: "both",
              }}
            >
              <span style={{
                color: COLORS.selectCursor,
                minWidth: "8px",
                animation: hoveredIdx === i ? "wobble 0.5s infinite" : undefined,
              }}>
                {hoveredIdx === i ? "\u25B6" : " "}
              </span>
              <span style={{ flex: 1 }}>{choice.label}</span>
              <span style={{ color: COLORS.textDim, fontSize: "6px" }}>
                {choice.risk}
              </span>
            </button>
          ))}
        </>
      )}

      {/* Tactics (when not in question mode) */}
      {!isQuestion && (
        <>
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
                gap: "6px",
                width: "100%",
                padding: "4px 6px",
                background: hoveredIdx === i && isActive ? `${COLORS.selectCursor}11` : "transparent",
                border: `1px solid ${hoveredIdx === i && isActive ? COLORS.selectCursor : COLORS.panelBorder}`,
                color: isActive ? COLORS.parchment : COLORS.textDim,
                cursor: isActive ? "pointer" : "not-allowed",
                opacity: isActive ? 1 : 0.4,
                textAlign: "left",
                ...PIXEL_FONT_SM,
                fontSize: "8px",
              }}
            >
              <span style={{
                color: COLORS.selectCursor,
                minWidth: "8px",
                animation: hoveredIdx === i && isActive ? "wobble 0.5s infinite" : undefined,
              }}>
                {hoveredIdx === i && isActive ? "\u25B6" : " "}
              </span>
              <span style={{
                animation: isActive ? "sway 4s infinite ease" : undefined,
                animationDelay: `${i * 0.2}s`,
              }}>
                {t.icon}
              </span>
              <span style={{ flex: 1 }}>{t.rpgName}</span>
              <span style={{ color: COLORS.textDim, fontSize: "6px" }}>{t.label}</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}
