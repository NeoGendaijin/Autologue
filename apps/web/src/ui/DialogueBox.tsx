import { useRef, useEffect } from "react";
import { useBattleStore } from "../store/battleStore";
import { COLORS, PIXEL_FONT_SM } from "../theme";

export function DialogueBox() {
  const battleLog = useBattleStore((s) => s.battleLog);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [battleLog.length]);

  const visibleLog = battleLog.slice(-30);

  return (
    <div style={{
      background: COLORS.bgDark,
      border: `2px solid ${COLORS.panelBorder}`,
      borderTop: `3px solid ${COLORS.borderLight}`,
      padding: "8px 12px",
      position: "relative",
      flex: 1,
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        ...PIXEL_FONT_SM,
        color: COLORS.textDim,
        letterSpacing: "2px",
        marginBottom: "6px",
        fontSize: "7px",
      }}>
        BATTLE LOG
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "3px",
        minHeight: 0,
      }}>
        {visibleLog.length === 0 && (
          <div style={{
            ...PIXEL_FONT_SM,
            color: COLORS.textDim,
            fontStyle: "italic",
            fontSize: "7px",
          }}>
            Awaiting battle...
          </div>
        )}
        {visibleLog.map((entry, i) => {
          const isLatest = i === visibleLog.length - 1;
          const age = visibleLog.length - i;
          const opacity = age <= 1 ? 1 : age <= 3 ? 0.8 : age <= 6 ? 0.6 : 0.4;
          return (
            <div key={entry.id} style={{
              ...PIXEL_FONT_SM,
              fontSize: "8px",
              color: entry.text.includes("CRITICAL") ? COLORS.critYellow :
                     entry.text.includes("counterattack") || entry.text.includes("strikes back") ? COLORS.fire :
                     entry.text.includes("summoned") ? COLORS.poison :
                     entry.text.includes("defeated") ? COLORS.healGreen :
                     entry.text.includes("fallen") ? COLORS.hpRed :
                     COLORS.parchment,
              opacity,
              animation: isLatest ? "slideUp 0.2s ease" : undefined,
            }}>
              {">"} {entry.text}
            </div>
          );
        })}
        {/* Blinking cursor */}
        {visibleLog.length > 0 && (
          <span style={{
            ...PIXEL_FONT_SM,
            color: COLORS.parchment,
            animation: "blink 1s infinite",
            fontSize: "8px",
          }}>
            _
          </span>
        )}
      </div>
    </div>
  );
}
