import { useGameStore } from "../store/gameStore";
import { COLORS, PIXEL_FONT_SM, PIXEL_FONT, AGENT_SPRITES } from "../theme";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  idle: { label: "IDLE", color: COLORS.textDim },
  thinking: { label: "THINK", color: COLORS.expGold },
  coding: { label: "CODE", color: COLORS.healGreen },
  searching: { label: "SCAN", color: COLORS.ice },
  testing: { label: "TEST", color: COLORS.mpBlue },
  waiting: { label: "WAIT", color: COLORS.fire },
};

export function PartyList() {
  const agents = useGameStore((s) => s.state.agents);
  const exp = useGameStore((s) => s.state.exp);
  const mode = useGameStore((s) => s.state.mode);
  const phase = useGameStore((s) => s.state.phase);
  const isActive = phase === "running" || phase === "question";

  return (
    <div style={{
      background: COLORS.bgPanel,
      borderRight: `2px solid ${COLORS.panelBorder}`,
      padding: "10px 14px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      minWidth: "200px",
      maxWidth: "220px",
      overflow: "auto",
      animation: isActive ? "borderGlow 5s infinite ease" : undefined,
    }}>
      {/* Header */}
      <div style={{
        ...PIXEL_FONT_SM,
        color: COLORS.textDim,
        letterSpacing: "2px",
        borderBottom: `1px solid ${COLORS.panelBorder}`,
        paddingBottom: "4px",
        animation: isActive ? "pulse 3s infinite ease" : undefined,
      }}>
        PARTY
      </div>

      {/* Party members */}
      {agents.length === 0 && (
        <div style={{
          ...PIXEL_FONT_SM,
          color: COLORS.textDim,
          textAlign: "center",
          padding: "6px 0",
          animation: "float 3s infinite ease",
        }}>
          No party
        </div>
      )}
      {agents.map((agent, i) => {
        const sprite = AGENT_SPRITES[agent.type] || AGENT_SPRITES.main;
        const statusInfo = STATUS_LABELS[agent.status] || STATUS_LABELS.idle;
        const isMain = agent.id === "main";
        return (
          <div key={agent.id} style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "3px 6px",
            background: agent.status !== "idle" ? `${COLORS.borderLight}33` : "transparent",
            border: `1px solid ${agent.status !== "idle" ? COLORS.borderLight : "transparent"}`,
            animation: isMain ? undefined : "summonFlash 0.8s ease, bounceIn 0.5s ease",
            animationDelay: isMain ? undefined : `${i * 0.1}s`,
          }}>
            <span style={{
              fontSize: "22px",
              animation: agent.status !== "idle" ? "wobble 2s infinite ease" : "sway 4s infinite ease",
            }}>
              {sprite.emoji}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...PIXEL_FONT_SM, color: COLORS.parchment, fontSize: "10px" }}>
                {sprite.name}
              </div>
              <div style={{
                width: "100%",
                height: "5px",
                background: COLORS.hpRedDark,
                marginTop: "2px",
              }}>
                <div style={{
                  width: `${agent.hp}%`,
                  height: "100%",
                  background: agent.hp < 30 ? COLORS.fire : COLORS.hpRed,
                  transition: "width 0.3s",
                  animation: agent.hp < 30 ? "dangerPulse 1s infinite" : undefined,
                }} />
              </div>
            </div>
            <span style={{
              ...PIXEL_FONT_SM,
              fontSize: "9px",
              color: statusInfo.color,
              animation: agent.status === "thinking" ? "blink 1.5s infinite" :
                         agent.status === "coding" ? "pulse 1s infinite" : undefined,
            }}>
              {statusInfo.label}
            </span>
          </div>
        );
      })}

      {/* EXP bar compact */}
      <div style={{
        marginTop: "auto",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}>
        <span style={{ ...PIXEL_FONT_SM, fontSize: "9px", color: COLORS.expGold }}>EXP</span>
        <div style={{
          flex: 1,
          height: "6px",
          background: COLORS.expGoldDark,
          border: `1px solid ${COLORS.borderLight}`,
        }}>
          <div style={{
            width: `${exp % 100}%`,
            height: "100%",
            background: COLORS.expGold,
            transition: "width 0.3s",
          }} />
        </div>
        <span style={{ ...PIXEL_FONT_SM, fontSize: "9px", color: COLORS.poison }}>
          {mode === "expert" ? "\uD83E\uDDE0" : "\uD83C\uDFB2"}
        </span>
      </div>
    </div>
  );
}
