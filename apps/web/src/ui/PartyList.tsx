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
  const level = useGameStore((s) => s.state.level);
  const exp = useGameStore((s) => s.state.exp);
  const mode = useGameStore((s) => s.state.mode);

  return (
    <div style={{
      background: COLORS.bgPanel,
      border: `2px solid ${COLORS.panelBorder}`,
      padding: "8px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    }}>
      {/* Header */}
      <div style={{
        ...PIXEL_FONT_SM,
        color: COLORS.textDim,
        letterSpacing: "2px",
        borderBottom: `1px solid ${COLORS.panelBorder}`,
        paddingBottom: "4px",
      }}>
        PARTY
      </div>

      {/* Party members */}
      {agents.length === 0 && (
        <div style={{ ...PIXEL_FONT_SM, color: COLORS.textDim, textAlign: "center", padding: "8px 0" }}>
          No party members
        </div>
      )}
      {agents.map((agent) => {
        const sprite = AGENT_SPRITES[agent.type] || AGENT_SPRITES.main;
        const statusInfo = STATUS_LABELS[agent.status] || STATUS_LABELS.idle;
        return (
          <div key={agent.id} style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "3px 4px",
            background: agent.status !== "idle" ? `${COLORS.borderLight}33` : "transparent",
            border: `1px solid ${agent.status !== "idle" ? COLORS.borderLight : "transparent"}`,
          }}>
            <span style={{ fontSize: "16px" }}>{sprite.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...PIXEL_FONT_SM, color: COLORS.parchment, fontSize: "7px" }}>
                {sprite.name}
              </div>
              {/* HP mini bar */}
              <div style={{
                width: "100%",
                height: "4px",
                background: COLORS.hpRedDark,
                marginTop: "2px",
              }}>
                <div style={{
                  width: `${agent.hp}%`,
                  height: "100%",
                  background: COLORS.hpRed,
                  transition: "width 0.3s",
                }} />
              </div>
            </div>
            <span style={{
              ...PIXEL_FONT_SM,
              fontSize: "6px",
              color: statusInfo.color,
              minWidth: "30px",
              textAlign: "right",
            }}>
              {statusInfo.label}
            </span>
          </div>
        );
      })}

      {/* Divider */}
      <div style={{ height: "1px", background: COLORS.panelBorder, margin: "2px 0" }} />

      {/* EXP + Mode */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...PIXEL_FONT_SM, color: COLORS.expGold, fontSize: "7px" }}>EXP</span>
          <span style={{ ...PIXEL_FONT_SM, color: COLORS.textDim, fontSize: "7px" }}>
            {exp % 100}/100
          </span>
        </div>
        <div style={{
          width: "100%",
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

        <div style={{
          ...PIXEL_FONT_SM,
          fontSize: "7px",
          color: COLORS.poison,
          textAlign: "center",
          marginTop: "2px",
        }}>
          {mode === "expert" ? "\uD83E\uDDE0 EXPERT" : "\uD83C\uDFB2 ADVENTURE"}
        </div>
      </div>
    </div>
  );
}
