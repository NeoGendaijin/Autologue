import { useState, useEffect, useCallback } from "react";
import { COLORS, PIXEL_FONT, PIXEL_FONT_SM, PIXEL_FONT_MD, AGENT_PIXELS } from "../theme";

const BACKGROUND_IMAGES = [
  "http://localhost:3001/asset/BackGround-day.png",
  "http://localhost:3001/asset/BackGround-night.png",
  "http://localhost:3001/asset/BackGround-3.png",
];

function PixelSprite({ pixels, scale = 3 }: {
  pixels: (string | null)[][];
  scale?: number;
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

function Star({ index }: { index: number }) {
  const left = (index * 37 + 13) % 100;
  const top = (index * 23 + 7) % 80;
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

export function TitleScreen({ onStart }: { onStart: () => void }) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [bgUrl] = useState(() =>
    BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)]
  );

  const handleStart = useCallback(() => {
    if (fading) return;
    setFading(true);
    setTimeout(() => {
      setVisible(false);
      onStart();
    }, 600);
  }, [fading, onStart]);

  // Any key or click starts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return;
      handleStart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleStart]);

  if (!visible) return null;

  return (
    <div
      onClick={handleStart}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #06061a 0%, #0c0c24 25%, #1a1a3e 55%, #2a1a0e 80%, #1a1208 100%)",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.6s ease",
        overflow: "hidden",
      }}
    >
      {/* Scrolling background */}
      <div style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: "200%",
          display: "flex",
          animation: "bgLoopX 80s linear infinite",
          opacity: 0.3,
          filter: "saturate(0.8)",
        }}>
          <div style={{
            width: "50%",
            height: "100%",
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }} />
          <div style={{
            width: "50%",
            height: "100%",
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }} />
        </div>
      </div>

      {/* Stars */}
      <div style={{ position: "absolute", inset: 0 }}>
        {[...Array(60)].map((_, i) => (
          <Star key={i} index={i} />
        ))}
      </div>

      {/* Vignette overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at center, transparent 30%, #06061acc 70%, #06061a 100%)",
        pointerEvents: "none",
      }} />

      {/* Ground */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "120px",
        background: "linear-gradient(180deg, #2a1a0e 0%, #1a1208 100%)",
        borderTop: "2px solid #3a2a1e",
      }}>
        <div style={{
          position: "absolute",
          top: "14px",
          left: 0,
          right: 0,
          height: "3px",
          background: "repeating-linear-gradient(90deg, #3a2a1e 0px, #3a2a1e 10px, transparent 10px, transparent 20px)",
          animation: "groundScroll 2s linear infinite",
        }} />
      </div>

      {/* Content */}
      <div style={{
        position: "relative",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        animation: "slideUp 1s ease",
      }}>
        {/* Logo / Title */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}>
          {/* Decorative top line */}
          <div style={{
            width: "300px",
            height: "3px",
            background: `linear-gradient(90deg, transparent 0%, ${COLORS.gold}44 30%, ${COLORS.gold} 50%, ${COLORS.gold}44 70%, transparent 100%)`,
            animation: "shimmer 3s infinite ease",
          }} />

          {/* Main title */}
          <div style={{
            ...PIXEL_FONT,
            fontSize: "52px",
            color: COLORS.gold,
            letterSpacing: "8px",
            textShadow: `
              0 0 20px ${COLORS.gold}88,
              0 0 40px ${COLORS.gold}44,
              0 0 80px ${COLORS.gold}22,
              4px 4px 0 #000,
              -1px -1px 0 ${COLORS.gold}44
            `,
            animation: "shimmer 4s infinite ease, float 5s infinite ease",
          }}>
            AUTOLOGUE
          </div>

          {/* Subtitle */}
          <div style={{
            ...PIXEL_FONT_SM,
            fontSize: "12px",
            color: COLORS.textMid,
            letterSpacing: "6px",
            animation: "pulse 3s infinite ease",
          }}>
            AUTO-DEVELOPMENT RPG
          </div>

          {/* Decorative bottom line */}
          <div style={{
            width: "300px",
            height: "3px",
            background: `linear-gradient(90deg, transparent 0%, ${COLORS.gold}44 30%, ${COLORS.gold} 50%, ${COLORS.gold}44 70%, transparent 100%)`,
            animation: "shimmer 3s infinite ease",
          }} />
        </div>

        {/* Agent pixel art — standing at center */}
        <div style={{
          marginTop: "16px",
          filter: `drop-shadow(0 0 12px ${COLORS.gold}66) drop-shadow(0 0 30px ${COLORS.gold}22)`,
          animation: "idle 2s infinite ease",
        }}>
          <PixelSprite pixels={AGENT_PIXELS} scale={10} />
        </div>

        {/* Press Start */}
        <div style={{
          marginTop: "24px",
          ...PIXEL_FONT_MD,
          fontSize: "16px",
          color: COLORS.parchment,
          letterSpacing: "4px",
          animation: "blink 1.5s infinite step-end",
          textShadow: `0 0 10px ${COLORS.parchment}44`,
        }}>
          PRESS ANY KEY
        </div>

        {/* Version / Credits */}
        <div style={{
          marginTop: "8px",
          ...PIXEL_FONT_SM,
          fontSize: "9px",
          color: COLORS.textDim,
          letterSpacing: "2px",
        }}>
          v1.0 &middot; AI-POWERED CODING BATTLES
        </div>
      </div>

      {/* Animated border frame — top corners */}
      <div style={{
        position: "absolute",
        top: "24px",
        left: "24px",
        width: "60px",
        height: "60px",
        borderTop: `3px solid ${COLORS.gold}66`,
        borderLeft: `3px solid ${COLORS.gold}66`,
        animation: "pulse 4s infinite ease",
      }} />
      <div style={{
        position: "absolute",
        top: "24px",
        right: "24px",
        width: "60px",
        height: "60px",
        borderTop: `3px solid ${COLORS.gold}66`,
        borderRight: `3px solid ${COLORS.gold}66`,
        animation: "pulse 4s infinite ease",
      }} />
      <div style={{
        position: "absolute",
        bottom: "24px",
        left: "24px",
        width: "60px",
        height: "60px",
        borderBottom: `3px solid ${COLORS.gold}66`,
        borderLeft: `3px solid ${COLORS.gold}66`,
        animation: "pulse 4s infinite ease",
      }} />
      <div style={{
        position: "absolute",
        bottom: "24px",
        right: "24px",
        width: "60px",
        height: "60px",
        borderBottom: `3px solid ${COLORS.gold}66`,
        borderRight: `3px solid ${COLORS.gold}66`,
        animation: "pulse 4s infinite ease",
      }} />
    </div>
  );
}
