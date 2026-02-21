import { useRef, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { useBattleStore } from "../store/battleStore";
import { COLORS, PIXEL_FONT_SM, HERO_PIXELS } from "../theme";

// --- Pixel Hero rendered via CSS box-shadow ---
function PixelHero({ scale = 3, attacking, hit }: { scale?: number; attacking?: boolean; hit?: boolean }) {
  const shadows: string[] = [];
  for (let r = 0; r < HERO_PIXELS.length; r++) {
    for (let c = 0; c < HERO_PIXELS[r].length; c++) {
      const color = HERO_PIXELS[r][c];
      if (color) {
        shadows.push(`${c * scale}px ${r * scale}px 0 0 ${color}`);
      }
    }
  }

  const w = 10 * scale;
  const h = 13 * scale;

  return (
    <div style={{
      width: `${w}px`,
      height: `${h}px`,
      position: "relative",
      animation: attacking ? "slash 0.5s ease" :
                hit ? "heroHit 0.5s ease" :
                "idle 2s infinite ease",
    }}>
      <div style={{
        width: `${scale}px`,
        height: `${scale}px`,
        position: "absolute",
        top: 0,
        left: 0,
        boxShadow: shadows.join(", "),
      }} />
    </div>
  );
}

// --- Defeated enemy marker ---
function DefeatedMarker({ emoji }: { emoji: string }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      opacity: 0.35,
      filter: "grayscale(0.8)",
    }}>
      <div style={{ fontSize: "20px", transform: "rotate(15deg)" }}>{emoji}</div>
      <div style={{
        ...PIXEL_FONT_SM,
        fontSize: "6px",
        color: COLORS.healGreen,
        marginTop: "2px",
      }}>
{"\u2713"}
      </div>
    </div>
  );
}

// --- Active enemy being fought ---
function ActiveEnemy({ emoji, name, color, isHit }: {
  emoji: string; name: string; color: string; isHit: boolean;
}) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      animation: isHit ? "enemyHit 0.5s ease" : "idle 2.5s infinite ease",
    }}>
      <div style={{
        fontSize: "40px",
        filter: isHit ? "brightness(2)" : undefined,
        transition: "filter 0.1s",
      }}>
        {emoji}
      </div>
      <div style={{
        ...PIXEL_FONT_SM,
        fontSize: "7px",
        color,
        marginTop: "4px",
        textShadow: "1px 1px 0 #000",
        whiteSpace: "nowrap",
      }}>
        {name}
      </div>
    </div>
  );
}

export function BattleArena() {
  const phase = useGameStore((s) => s.state.phase);
  const encounters = useBattleStore((s) => s.encounters);
  const currentIdx = useBattleStore((s) => s.currentIdx);
  const damageNumbers = useBattleStore((s) => s.damageNumbers);
  const screenShake = useBattleStore((s) => s.screenShake);
  const heroAttacking = useBattleStore((s) => s.heroAttacking);
  const heroHit = useBattleStore((s) => s.heroHit);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to keep the action visible
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTo({ left: el.scrollWidth - el.clientWidth, behavior: "smooth" });
    }
  }, [encounters.length]);

  const isActive = phase === "running" || phase === "question";
  const defeated = encounters.filter((e) => e.status === "defeated");
  const active = encounters.find((e) => e.status === "active");

  return (
    <div style={{
      width: "100%",
      height: "300px",
      position: "relative",
      overflow: "hidden",
      background: `linear-gradient(180deg, #0c0c24 0%, #1a1a3e 40%, #2a1a0e 70%, #1a1208 100%)`,
      borderBottom: `2px solid ${COLORS.panelBorder}`,
      animation: screenShake ? "screenShake 0.5s ease" : undefined,
    }}>
      {/* Stars */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: "50%", overflow: "hidden", opacity: 0.5 }}>
        {[...Array(25)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${(i * 37 + 13) % 100}%`,
            top: `${(i * 23 + 7) % 60}%`,
            width: "2px",
            height: "2px",
            background: "#ffffff",
            opacity: 0.2 + (i % 3) * 0.25,
          }} />
        ))}
      </div>

      {/* Ground */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "60px",
        background: "linear-gradient(180deg, #2a1a0e 0%, #1a1208 100%)",
        borderTop: `2px solid #3a2a1e`,
      }}>
        {/* Path dots */}
        <div style={{
          position: "absolute",
          top: "10px",
          left: 0,
          right: 0,
          height: "2px",
          background: `repeating-linear-gradient(90deg, #3a2a1e 0px, #3a2a1e 8px, transparent 8px, transparent 16px)`,
        }} />
      </div>

      {/* === Side-scrolling battle scene === */}
      <div ref={scrollRef} style={{
        position: "absolute",
        bottom: "60px",
        left: 0,
        right: 0,
        height: "200px",
        display: "flex",
        alignItems: "flex-end",
        overflowX: "hidden",
        padding: "0 20px",
      }}>
        {/* Defeated encounters on the left */}
        {defeated.map((enc) => (
          <div key={enc.id} style={{
            flexShrink: 0,
            marginRight: "16px",
            paddingBottom: "8px",
          }}>
            <DefeatedMarker emoji={enc.emoji} />
          </div>
        ))}

        {/* Hero character */}
        <div style={{
          flexShrink: 0,
          marginRight: active ? "30px" : "0",
          paddingBottom: "4px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <PixelHero scale={4} attacking={heroAttacking} hit={heroHit} />
          <div style={{
            ...PIXEL_FONT_SM,
            fontSize: "7px",
            color: COLORS.gold,
            marginTop: "4px",
            textShadow: "1px 1px 0 #000",
          }}>
            HERO
          </div>
        </div>

        {/* Current active enemy */}
        {active && (
          <div style={{
            flexShrink: 0,
            paddingBottom: "8px",
            position: "relative",
          }}>
            <ActiveEnemy
              emoji={active.emoji}
              name={active.name}
              color={active.color}
              isHit={heroAttacking}
            />
            {/* Description label */}
            <div style={{
              ...PIXEL_FONT_SM,
              fontSize: "6px",
              color: COLORS.textDim,
              textAlign: "center",
              marginTop: "2px",
              maxWidth: "80px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {active.description.replace(/^(Writing|Reading|Using tool:\s*\w+|Running tests:?|Generating code for)\s*/i, "").slice(0, 20)}
            </div>
          </div>
        )}

        {/* Upcoming placeholder enemies */}
        {isActive && !active && (
          <div style={{
            flexShrink: 0,
            paddingBottom: "8px",
            opacity: 0.2,
            fontSize: "24px",
          }}>
            {"..."}
          </div>
        )}
      </div>

      {/* === Damage numbers === */}
      {damageNumbers.map((dmg) => (
        <div key={dmg.id} style={{
          position: "absolute",
          right: "30%",
          bottom: "140px",
          ...PIXEL_FONT_SM,
          fontSize: dmg.isCrit ? "18px" : "12px",
          color: dmg.color,
          textShadow: `0 0 6px ${dmg.color}, 2px 2px 0 #000`,
          animation: `${dmg.isCrit ? "critFloat" : "damageFloat"} 1s forwards ease-out`,
          pointerEvents: "none",
          zIndex: 10,
        }}>
          {dmg.isCrit && "\u2605"}{dmg.value}
        </div>
      ))}

      {/* Progress indicator */}
      {encounters.length > 0 && (
        <div style={{
          position: "absolute",
          top: "8px",
          right: "12px",
          ...PIXEL_FONT_SM,
          fontSize: "7px",
          color: COLORS.textDim,
        }}>
          {defeated.length}/{encounters.length} defeated
        </div>
      )}

      {/* Phase overlay text */}
      {phase !== "running" && phase !== "question" && phase !== "complete" && encounters.length === 0 && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          ...PIXEL_FONT_SM,
          fontSize: "10px",
          color: COLORS.textDim,
          textShadow: "2px 2px 0 #000",
          letterSpacing: "3px",
        }}>
          {phase === "idle" ? "AWAITING ORDERS..." :
           phase === "game-over" ? "GAME OVER" : ""}
        </div>
      )}
    </div>
  );
}
