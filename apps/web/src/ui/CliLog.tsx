import { useRef, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { useBattleStore } from "../store/battleStore";
import { COLORS, PIXEL_FONT_SM } from "../theme";

const TYPE_STYLES: Record<string, { prefix: string; color: string }> = {
  action: { prefix: "$", color: COLORS.ice },
  success: { prefix: "\u2713", color: COLORS.healGreen },
  error: { prefix: "\u2717", color: COLORS.fire },
  spawn: { prefix: "+", color: COLORS.poison },
  question: { prefix: "?", color: COLORS.expGold },
  info: { prefix: "\u2022", color: COLORS.textMid },
};

export function CliLog() {
  const questLog = useGameStore((s) => s.state.questLog);
  const overclock = useBattleStore((s) => s.overclock);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [questLog.length]);

  const visible = questLog.slice(-80);

  return (
    <div style={{
      background: "#0a0a18",
      borderLeft: `2px solid ${COLORS.panelBorder}`,
      padding: "10px 14px",
      position: "relative",
      flex: 2,
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        ...PIXEL_FONT_SM,
        fontSize: "10px",
        color: COLORS.textDim,
        letterSpacing: "2px",
        marginBottom: "6px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        animation: "pulse 3s infinite ease",
      }}>
        <span style={{ color: COLORS.healGreen }}>{">"}_</span>
        AGENT LOG
        {questLog.length > 0 && (
          <span style={{ ...PIXEL_FONT_SM, fontSize: "9px", color: COLORS.textDim, marginLeft: "auto" }}>
            {questLog.length} entries
          </span>
        )}
      </div>

      {/* Log entries */}
      <div ref={scrollRef} style={{
        flex: 1,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        minHeight: 0,
      }}>
        {visible.length === 0 && (
          <div style={{
            ...PIXEL_FONT_SM,
            color: COLORS.textDim,
            fontStyle: "italic",
            animation: "float 3s infinite ease",
          }}>
            Waiting for agent...
          </div>
        )}
        {visible.map((entry, i) => {
          const style = TYPE_STYLES[entry.type] || TYPE_STYLES.info;
          const isRecent = i >= visible.length - 3;
          const age = visible.length - i;
          const opacity = age <= 1 ? 1 : age <= 4 ? 0.85 : age <= 10 ? 0.6 : 0.4;

          return (
            <div key={`${entry.timestamp}-${i}`} style={{
              ...PIXEL_FONT_SM,
              color: overclock && isRecent ? "#ffcc00" : style.color,
              opacity,
              animation: isRecent
                ? overclock
                  ? "slideInLeft 0.2s ease, goldFlash 0.8s infinite ease"
                  : "slideInLeft 0.2s ease"
                : undefined,
              transition: "opacity 0.5s ease",
            }}>
              <span style={{ color: COLORS.textDim, marginRight: "6px" }}>{style.prefix}</span>
              {entry.text}
            </div>
          );
        })}
        {visible.length > 0 && (
          <span style={{
            ...PIXEL_FONT_SM,
            color: COLORS.healGreen,
            animation: "blink 1s infinite",
          }}>
            _
          </span>
        )}
      </div>
    </div>
  );
}
