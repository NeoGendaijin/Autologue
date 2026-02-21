import { useRef, useEffect } from "react";
import { useBattleStore } from "../store/battleStore";
import { COLORS, PIXEL_FONT_SM } from "../theme";

export function DialogueBox() {
  const battleLog = useBattleStore((s) => s.battleLog);
  const overclock = useBattleStore((s) => s.overclock);
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
      padding: "10px 14px",
      position: "relative",
      flex: 1,
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      animation: visibleLog.length > 0 ? "borderGlow 4s infinite ease" : undefined,
    }}>
      {/* Header */}
      <div style={{
        ...PIXEL_FONT_SM,
        color: COLORS.textDim,
        letterSpacing: "2px",
        marginBottom: "6px",
        animation: "pulse 3s infinite ease",
      }}>
        BATTLE LOG
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        minHeight: 0,
      }}>
        {visibleLog.length === 0 && (
          <div style={{
            ...PIXEL_FONT_SM,
            color: COLORS.textDim,
            fontStyle: "italic",
            animation: "float 3s infinite ease",
          }}>
            Awaiting battle...
          </div>
        )}
        {visibleLog.map((entry, i) => {
          const isRecent = i >= visibleLog.length - 3;
          const age = visibleLog.length - i;
          const opacity = age <= 1 ? 1 : age <= 3 ? 0.8 : age <= 6 ? 0.6 : 0.4;

          const textColor = entry.text.includes("CRITICAL") ? COLORS.critYellow :
                 entry.text.includes("counterattack") || entry.text.includes("strikes back") ? COLORS.fire :
                 entry.text.includes("ally") || entry.text.includes("Summoned") ? COLORS.poison :
                 entry.text.includes("defeated") || entry.text.includes("Victory") ? COLORS.healGreen :
                 entry.text.includes("fallen") ? COLORS.hpRed :
                 entry.text.includes("Scout") || entry.text.includes("Tester") || entry.text.includes("Smith") ? COLORS.ice :
                 COLORS.parchment;

          return (
            <div key={entry.id} style={{
              ...PIXEL_FONT_SM,
              color: overclock && isRecent ? "#ffcc00" : textColor,
              opacity,
              animation: isRecent
                ? overclock
                  ? "slideInLeft 0.3s ease, goldFlash 0.8s infinite ease"
                  : "slideInLeft 0.3s ease"
                : undefined,
              transition: "opacity 0.5s ease",
            }}>
              {">"} {entry.text}
            </div>
          );
        })}
        {visibleLog.length > 0 && (
          <span style={{
            ...PIXEL_FONT_SM,
            color: COLORS.parchment,
            animation: "blink 1s infinite",
          }}>
            _
          </span>
        )}
      </div>
    </div>
  );
}
