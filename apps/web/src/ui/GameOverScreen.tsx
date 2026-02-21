import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { COLORS, PIXEL_FONT, PIXEL_FONT_SM } from "../theme";

export function GameOverScreen() {
  const revive = useGameStore((s) => s.revive);
  const returnToQuestBoard = useGameStore((s) => s.returnToQuestBoard);
  const score = useGameStore((s) => s.state.score);
  const questLog = useGameStore((s) => s.state.questLog);
  const connected = useGameStore((s) => s.connected);
  const [reviving, setReviving] = useState(false);

  // Find the game-over reason from the last error log entry
  const reason = [...questLog].reverse().find((e) => e.type === "error")?.text || "The quest has ended.";

  const handleRevive = () => {
    setReviving(true);
    revive();
  };

  return (
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: `${COLORS.bg}ee`,
      zIndex: 100,
    }}>
      <div style={{
        width: "500px",
        maxWidth: "92vw",
        background: COLORS.bgPanel,
        border: `3px solid ${COLORS.fire}66`,
        boxShadow: `0 0 40px ${COLORS.fire}22, inset 0 0 20px ${COLORS.bgDark}44`,
        padding: "24px",
        animation: "slideUp 0.5s ease",
        textAlign: "center",
      }}>
        {/* Title */}
        <div style={{
          ...PIXEL_FONT,
          fontSize: "28px",
          color: COLORS.fire,
          textShadow: `0 0 15px ${COLORS.fire}66, 2px 2px 0 #000`,
          letterSpacing: "6px",
          marginBottom: "8px",
          animation: "pulse 2s infinite ease",
        }}>
          GAME OVER
        </div>

        {/* Skull */}
        <div style={{
          fontSize: "48px",
          margin: "8px 0",
          animation: "float 3s infinite ease",
        }}>
          {"💀"}
        </div>

        {/* Reason */}
        <div style={{
          ...PIXEL_FONT_SM,
          color: COLORS.parchment,
          marginBottom: "16px",
          lineHeight: "22px",
          maxHeight: "66px",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {reason}
        </div>

        {/* Score */}
        <div style={{
          ...PIXEL_FONT_SM,
          color: COLORS.textDim,
          marginBottom: "20px",
        }}>
          Score: <span style={{ color: COLORS.gold }}>{score.toLocaleString()}</span>
        </div>

        {/* Buttons */}
        <div style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
        }}>
          {/* Revive button */}
          <button
            onClick={handleRevive}
            disabled={!connected || reviving}
            style={{
              ...PIXEL_FONT,
              fontSize: "14px",
              background: reviving ? `${COLORS.healGreen}11` : `${COLORS.healGreen}22`,
              border: `2px solid ${COLORS.healGreen}`,
              color: COLORS.healGreen,
              padding: "12px 28px",
              cursor: !connected || reviving ? "not-allowed" : "pointer",
              opacity: !connected || reviving ? 0.5 : 1,
              letterSpacing: "2px",
              animation: reviving ? undefined : "pulseGlow 2s infinite",
              width: "320px",
            }}
          >
            {reviving ? "REVIVING..." : "REVIVE (+100K TOKENS)"}
          </button>
          <div style={{
            ...PIXEL_FONT_SM,
            fontSize: "10px",
            color: COLORS.textDim,
            marginTop: "-4px",
          }}>
            Add 100K more token limit and continue
          </div>

          {/* Next button */}
          <button
            onClick={returnToQuestBoard}
            style={{
              ...PIXEL_FONT_SM,
              background: COLORS.bgDark,
              border: `2px solid ${COLORS.panelBorder}`,
              color: COLORS.textMid,
              padding: "10px 28px",
              cursor: "pointer",
              letterSpacing: "1px",
              width: "320px",
              marginTop: "4px",
            }}
          >
            {"BACK TO QUEST BOARD  \u2192"}
          </button>
        </div>
      </div>
    </div>
  );
}
