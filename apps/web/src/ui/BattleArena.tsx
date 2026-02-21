import { useRef, useEffect, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { useBattleStore } from "../store/battleStore";
import { COLORS, PIXEL_FONT_SM, PIXEL_FONT, PIXEL_FONT_MD, AGENT_PIXELS, AGENT_PIXEL_SPRITES, AGENT_SPRITES } from "../theme";

const BACKGROUND_IMAGES = [
  "http://localhost:3001/asset/BackGround-day.png",
  "http://localhost:3001/asset/BackGround-night.png",
  "http://localhost:3001/asset/BackGround-3.png",
];

function pickRandomBackground(): string {
  return BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];
}

// --- Generic pixel sprite renderer via CSS box-shadow ---
function PixelSprite({ pixels, scale = 3, animation }: {
  pixels: (string | null)[][];
  scale?: number;
  animation?: string;
}) {
  const shadows: string[] = [];
  for (let r = 0; r < pixels.length; r++) {
    for (let c = 0; c < pixels[r].length; c++) {
      const color = pixels[r][c];
      if (color) {
        shadows.push(`${c * scale}px ${r * scale}px 0 0 ${color}`);
      }
    }
  }

  const cols = pixels[0]?.length ?? 0;
  const rows = pixels.length;

  return (
    <div style={{
      width: `${cols * scale}px`,
      height: `${rows * scale}px`,
      position: "relative",
      animation: animation || "idle 2s infinite ease",
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

// --- Main Agent (pixel character) ---
function MainAgent({ scale = 12, attacking, hit }: { scale?: number; attacking?: boolean; hit?: boolean }) {
  const anim = attacking ? "slash 0.5s ease" :
               hit ? "agentHit 0.5s ease" :
               "idle 2s infinite ease";

  return (
    <div style={{
      filter: attacking
        ? "drop-shadow(0 0 20px #ffcc00) drop-shadow(0 0 40px #ffcc0066)"
        : "drop-shadow(0 0 8px #ffcc0044)",
      transition: "filter 0.3s",
    }}>
      <PixelSprite pixels={AGENT_PIXELS} scale={scale} animation={anim} />
    </div>
  );
}

// --- Sub-agent party member sprite ---
function PartyMemberSprite({ agentType, index }: { agentType: string; index: number }) {
  const pixels = AGENT_PIXEL_SPRITES[agentType];
  const sprite = AGENT_SPRITES[agentType] || AGENT_SPRITES.main;

  if (!pixels) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        animation: "summon 0.6s ease",
      }}>
        <div style={{
          fontSize: "80px",
          animation: "wobble 3s infinite ease",
          filter: "drop-shadow(0 0 8px #aa44ff66)",
        }}>
          {sprite.emoji}
        </div>
        <div style={{
          ...PIXEL_FONT_SM,
          color: COLORS.ice,
          marginTop: "4px",
          textShadow: "1px 1px 0 #000",
        }}>
          {sprite.name}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      animation: "summon 0.6s ease",
    }}>
      <div style={{
        filter: "drop-shadow(0 0 8px #aa44ff66)",
      }}>
        <PixelSprite
          pixels={pixels}
          scale={9}
          animation={`idle ${2.2 + index * 0.3}s infinite ease`}
        />
      </div>
      <div style={{
        ...PIXEL_FONT_SM,
        color: COLORS.ice,
        marginTop: "4px",
        textShadow: "1px 1px 0 #000",
        animation: "pulse 3s infinite ease",
      }}>
        {sprite.name}
      </div>
    </div>
  );
}

// --- Defeated enemy marker ---
function DefeatedMarker({ emoji, index }: { emoji: string; index: number }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      opacity: 0.35,
      filter: "grayscale(0.8)",
      animation: `defeatSpin 0.5s ease forwards`,
      animationDelay: `${index * 0.05}s`,
    }}>
      <div style={{
        fontSize: "60px",
        transform: "rotate(15deg)",
        animation: "sway 4s infinite ease-in-out",
        animationDelay: `${index * 0.3}s`,
      }}>{emoji}</div>
      <div style={{
        ...PIXEL_FONT_SM,
        color: COLORS.healGreen,
        marginTop: "3px",
      }}>
        {"\u2713"}
      </div>
    </div>
  );
}

// --- Active enemy being fought ---
function ActiveEnemy({ emoji, name, color, isHit, isTaunting }: {
  emoji: string; name: string; color: string; isHit: boolean; isTaunting?: boolean;
}) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      animation: isHit ? "enemyHit 0.5s ease" :
                 isTaunting ? "taunt 2s infinite ease" :
                 "enemyIdle 2.5s infinite ease",
    }}>
      <div style={{
        fontSize: "140px",
        filter: isHit
          ? "brightness(2) drop-shadow(0 0 24px #ff4444)"
          : isTaunting
            ? "drop-shadow(0 0 16px #ff444488) drop-shadow(0 0 30px #ff440044)"
            : "drop-shadow(0 0 12px #00000088) drop-shadow(0 0 24px #ff444422)",
        transition: "filter 0.1s",
        animation: isHit ? undefined : "wobble 3s infinite ease-in-out",
      }}>
        {emoji}
      </div>
      <div style={{
        ...PIXEL_FONT_SM,
        fontSize: "16px",
        color,
        marginTop: "8px",
        textShadow: `1px 1px 0 #000, 0 0 8px ${color}44`,
        whiteSpace: "nowrap",
        animation: "pulse 2s infinite ease",
      }}>
        {name}
      </div>
    </div>
  );
}

// --- Enemy Speech Bubble (question taunt) ---
function EnemySpeechBubble({ text, choices, onChoice }: {
  text: string;
  choices: Array<{ label: string; risk: string }>;
  onChoice: (idx: number, label: string) => void;
}) {
  const [hoveredIdx, setHoveredIdx] = useState(-1);

  const TAUNTS = [
    "Heh heh heh...",
    "Fufufu...",
    "You fool...",
    "Choose wisely...",
    "Dare you decide?",
  ];
  const taunt = TAUNTS[Math.floor(Math.random() * TAUNTS.length)];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "12px",
      animation: "speechBubble 0.5s ease",
    }}>
      {/* Speech bubble */}
      <div style={{
        position: "relative",
        background: `${COLORS.bgDark}ee`,
        border: `3px solid ${COLORS.fire}`,
        borderRadius: "8px",
        padding: "16px 22px",
        maxWidth: "480px",
        boxShadow: `0 0 20px ${COLORS.fire}44, inset 0 0 10px ${COLORS.fire}11`,
      }}>
        {/* Taunt */}
        <div style={{
          ...PIXEL_FONT_SM,
          fontSize: "14px",
          color: COLORS.fire,
          marginBottom: "8px",
          animation: "pulse 1.5s infinite ease",
        }}>
          {taunt}
        </div>
        {/* Question text */}
        <div style={{
          ...PIXEL_FONT_SM,
          fontSize: "15px",
          color: COLORS.parchment,
          lineHeight: "22px",
        }}>
          {text}
        </div>
        {/* Bubble arrow pointing down */}
        <div style={{
          position: "absolute",
          bottom: "-12px",
          right: "30px",
          width: 0,
          height: 0,
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          borderTop: `12px solid ${COLORS.fire}`,
        }} />
      </div>

      {/* Choice buttons */}
      <div style={{
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        justifyContent: "center",
      }}>
        {choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => onChoice(i, choice.label)}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(-1)}
            style={{
              background: hoveredIdx === i ? `${COLORS.gold}33` : `${COLORS.bgDark}dd`,
              border: `2px solid ${hoveredIdx === i ? COLORS.gold : COLORS.borderLight}`,
              color: hoveredIdx === i ? COLORS.gold : COLORS.parchment,
              padding: "14px 26px",
              cursor: "pointer",
              ...PIXEL_FONT_SM,
              fontSize: "15px",
              animation: `choiceSlideUp 0.4s ease`,
              animationDelay: `${0.3 + i * 0.12}s`,
              animationFillMode: "both",
              transition: "all 0.15s",
              boxShadow: hoveredIdx === i ? `0 0 16px ${COLORS.gold}44` : "none",
            }}
          >
            <span style={{
              color: COLORS.selectCursor,
              marginRight: "8px",
              animation: hoveredIdx === i ? "wobble 0.5s infinite" : undefined,
            }}>
              {hoveredIdx === i ? "\u25B6" : "\u25B7"}
            </span>
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Twinkling star ---
function Star({ index }: { index: number }) {
  const left = (index * 37 + 13) % 100;
  const top = (index * 23 + 7) % 60;
  const size = 1 + (index % 3);
  const duration = 2 + (index % 4) * 0.7;
  const delay = (index * 0.4) % 3;

  return (
    <div style={{
      position: "absolute",
      left: `${left}%`,
      top: `${top}%`,
      width: `${size}px`,
      height: `${size}px`,
      background: "#ffffff",
      borderRadius: size > 1 ? "50%" : undefined,
      animation: `twinkle ${duration}s ${delay}s infinite ease-in-out`,
    }} />
  );
}

export function BattleArena() {
  const phase = useGameStore((s) => s.state.phase);
  const agents = useGameStore((s) => s.state.agents);
  const pendingQuestion = useGameStore((s) => s.state.pendingQuestion);
  const makeChoice = useGameStore((s) => s.makeChoice);
  const encounters = useBattleStore((s) => s.encounters);
  const damageNumbers = useBattleStore((s) => s.damageNumbers);
  const screenShake = useBattleStore((s) => s.screenShake);
  const agentAttacking = useBattleStore((s) => s.agentAttacking);
  const agentHit = useBattleStore((s) => s.agentHit);

  const scrollRef = useRef<HTMLDivElement>(null);
  const subAgents = agents.filter((a) => a.id !== "main");

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTo({ left: el.scrollWidth - el.clientWidth, behavior: "smooth" });
    }
  }, [encounters.length]);

  const isActive = phase === "running" || phase === "question";
  const isQuestion = phase === "question" && pendingQuestion;
  const defeated = encounters.filter((e) => e.status === "defeated");
  const active = encounters.find((e) => e.status === "active");
  const [bgImageUrl, setBgImageUrl] = useState<string>(() => pickRandomBackground());

  // Re-roll background at each quest start so each run feels different.
  useEffect(() => {
    if (phase === "running") {
      setBgImageUrl(pickRandomBackground());
    }
  }, [phase]);

  return (
    <div style={{
      width: "100%",
      flex: 1,
      minHeight: "240px",
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(180deg, #0c0c24 0%, #1a1a3e 35%, #2a1a0e 75%, #1a1208 100%)",
      borderBottom: `2px solid ${COLORS.panelBorder}`,
      animation: screenShake ? "screenShake 0.5s ease" : undefined,
    }}>
      {/* Seamless loop background: same image x2, scroll and wrap */}
      <div style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: 0,
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: "200%",
          display: "flex",
          animation: "bgLoopX 60s linear infinite",
          animationPlayState: isActive ? "running" : "paused",
          willChange: "transform",
          opacity: 0.5,
          filter: "saturate(1.05)",
        }}>
          <div style={{
            width: "50%",
            height: "100%",
            backgroundImage: `url(${bgImageUrl})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }} />
          <div style={{
            width: "50%",
            height: "100%",
            backgroundImage: `url(${bgImageUrl})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }} />
        </div>
      </div>

      {/* Twinkling Stars */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: "50%", overflow: "hidden", zIndex: 1 }}>
        {[...Array(35)].map((_, i) => (
          <Star key={i} index={i} />
        ))}
      </div>

      {/* Animated ground */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "90px",
        background: "linear-gradient(180deg, #2a1a0e 0%, #1a1208 100%)",
        borderTop: `2px solid #3a2a1e`,
        zIndex: 2,
      }}>
        <div style={{
          position: "absolute",
          top: "14px",
          left: 0,
          right: 0,
          height: "3px",
          background: `repeating-linear-gradient(90deg, #3a2a1e 0px, #3a2a1e 10px, transparent 10px, transparent 20px)`,
          animation: isActive ? "groundScroll 1s linear infinite" : undefined,
        }} />
        {isActive && [...Array(8)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            bottom: `${10 + (i * 9) % 40}px`,
            left: `${(i * 13 + 5) % 100}%`,
            width: "3px",
            height: "3px",
            background: "#3a2a1e",
            animation: `twinkle ${2 + i * 0.5}s ${i * 0.3}s infinite ease`,
            opacity: 0.4,
          }} />
        ))}
      </div>

      {/* === Main battle scene — centered === */}
      <div ref={scrollRef} style={{
        position: "absolute",
        bottom: "90px",
        left: 0,
        right: 0,
        top: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflowX: "hidden",
        padding: "0 40px",
        gap: "30px",
        zIndex: 3,
      }}>

        {/* Defeated markers */}
        {defeated.length > 0 && (
          <div style={{
            flexShrink: 0,
            display: "flex",
            gap: "14px",
            alignItems: "center",
          }}>
            {defeated.map((enc, i) => (
              <DefeatedMarker key={enc.id} emoji={enc.emoji} index={i} />
            ))}
          </div>
        )}

        {/* === Party: sub-agents + main agent side by side === */}
        <div style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "flex-end",
          gap: "18px",
        }}>
          {/* Sub-agents on the left, walking alongside */}
          {subAgents.map((agent, i) => (
            <PartyMemberSprite key={agent.id} agentType={agent.type} index={i} />
          ))}

          {/* Main Agent (front) */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}>
            <MainAgent attacking={agentAttacking} hit={agentHit} />
            <div style={{
              ...PIXEL_FONT,
              fontSize: "16px",
              color: COLORS.gold,
              marginTop: "8px",
              animation: "shimmer 3s infinite ease",
            }}>
              AGENT
            </div>
          </div>
        </div>

        {/* VS */}
        {active && !isQuestion && (
          <div style={{
            flexShrink: 0,
            width: "70px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <div style={{
              ...PIXEL_FONT,
              fontSize: "28px",
              color: COLORS.fire,
              animation: "pulse 1.5s infinite ease",
              textShadow: `0 0 10px ${COLORS.fire}66, 2px 2px 0 #000`,
            }}>
              VS
            </div>
          </div>
        )}

        {/* Active enemy */}
        {active && (
          <div style={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: "translateY(-14px)",
            animation: isQuestion ? undefined : "bounceIn 0.4s ease",
          }}>
            <ActiveEnemy
              emoji={active.emoji}
              name={active.name}
              color={active.color}
              isHit={agentAttacking}
              isTaunting={!!isQuestion}
            />
            {!isQuestion && (
              <div style={{
                ...PIXEL_FONT_SM,
                color: COLORS.textDim,
                textAlign: "center",
                marginTop: "2px",
                maxWidth: "160px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                animation: "slideInLeft 0.3s ease",
              }}>
                {active.description.replace(/^(Writing|Reading|Using tool:\s*\w+|Running tests:?|Generating code for)\s*/i, "").slice(0, 25)}
              </div>
            )}
          </div>
        )}

        {/* Waiting */}
        {isActive && !active && !isQuestion && (
          <div style={{
            flexShrink: 0,
            opacity: 0.2,
            fontSize: "60px",
            animation: "float 2s infinite ease",
          }}>
            {"..."}
          </div>
        )}
      </div>

      {/* === Enemy Question Overlay === */}
      {isQuestion && pendingQuestion && (
        <div style={{
          position: "absolute",
          top: "8px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <EnemySpeechBubble
            text={pendingQuestion.text}
            choices={pendingQuestion.choices}
            onChoice={(idx, label) => makeChoice(idx, label)}
          />
        </div>
      )}

      {/* === Damage numbers === */}
      {damageNumbers.map((dmg) => (
        <div key={dmg.id} style={{
          position: "absolute",
          right: "32%",
          top: "30%",
          ...PIXEL_FONT,
          fontSize: dmg.isCrit ? "44px" : "32px",
          color: dmg.color,
          textShadow: `0 0 10px ${dmg.color}, 3px 3px 0 #000`,
          animation: `${dmg.isCrit ? "critFloat" : "damageFloat"} 1s forwards ease-out`,
          pointerEvents: "none",
          zIndex: 10,
        }}>
          {dmg.isCrit && "\u2605"}{dmg.value}
        </div>
      ))}

      {/* Progress */}
      {encounters.length > 0 && (
        <div style={{
          position: "absolute",
          top: "12px",
          right: "18px",
          ...PIXEL_FONT_SM,
          fontSize: "11px",
          color: COLORS.textDim,
          animation: "pulse 3s infinite ease",
        }}>
          {defeated.length}/{encounters.length} defeated
        </div>
      )}

      {/* Party count */}
      {subAgents.length > 0 && (
        <div style={{
          position: "absolute",
          top: "12px",
          left: "18px",
          ...PIXEL_FONT_SM,
          fontSize: "11px",
          color: COLORS.poison,
          animation: "pulse 3s infinite ease",
        }}>
          Party: {agents.length}
        </div>
      )}

      {/* Phase overlay */}
      {phase !== "running" && phase !== "question" && phase !== "complete" && encounters.length === 0 && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          ...PIXEL_FONT,
          fontSize: "26px",
          color: COLORS.textDim,
          textShadow: "2px 2px 0 #000",
          letterSpacing: "4px",
          animation: phase === "idle" ? "float 3s infinite ease, pulse 4s infinite ease" : undefined,
        }}>
          {phase === "idle" ? "AWAITING ORDERS..." :
           phase === "game-over" ? "GAME OVER" : ""}
        </div>
      )}
    </div>
  );
}
