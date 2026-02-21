import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { COLORS, PIXEL_FONT, PIXEL_FONT_SM, PIXEL_FONT_MD } from "../theme";

const EXAMPLE_QUESTS = [
  { emoji: "\uD83C\uDFD3", label: "Ping Pong", prompt: "Build a browser-based Pong game with HTML Canvas \u2014 two paddles, ball physics, scoring to 10, keyboard controls", cwd: "examples/ping-pong-game" },
  { emoji: "\uD83D\uDC0D", label: "Snake Game", prompt: "Create the classic Snake game in a single HTML file using Canvas \u2014 grid movement, growing snake, increasing speed", cwd: "examples/snake-game" },
  { emoji: "\uD83E\uDDEE", label: "Solve Equations", prompt: "Write a Python script that solves: quadratic 2x\u00B2+5x-3=0, linear system 3x+2y=12 & x-y=1, and derivative of x\u00B3-4x\u00B2+7x-2 at x=3. No external libraries.", cwd: "examples/solve-equations" },
  { emoji: "\uD83D\uDCCB", label: "Todo CLI", prompt: "Build a Node.js CLI todo app \u2014 add, list, done, remove commands. Store tasks in todos.json. No dependencies.", cwd: "examples/todo-cli" },
  { emoji: "\uD83D\uDCF0", label: "AI Report", prompt: "Research the state of AI in 2025 and write a ~500 word report covering breakthroughs, open vs closed source, agents, and regulation. Save to report.md", cwd: "examples/research-report" },
  { emoji: "\uD83C\uDF24\uFE0F", label: "Weather App", prompt: "Build a responsive weather dashboard showing current weather for Tokyo, New York, and London with card layout and emoji icons", cwd: "examples/weather-dashboard" },
  { emoji: "\uD83C\uDFB2", label: "RPG Battle", prompt: "Build a turn-based RPG battle system in HTML/JS/CSS: party of 3 heroes vs 2 monsters, each with HP/ATK/DEF stats, attack/heal/defend commands, animated HP bars, battle log, victory/defeat screens. Multiple files: index.html, styles.css, battle.js, data.js", cwd: "examples/rpg-battle" },
  { emoji: "\uD83D\uDCC8", label: "Dashboard", prompt: "Build a full analytics dashboard with HTML/CSS/JS: 4 metric cards (users, revenue, orders, conversion), a line chart drawn on Canvas, a sortable data table with 10 rows, and a dark theme. Separate files for HTML, CSS, and JS. Make it responsive.", cwd: "examples/analytics-dashboard" },
  { emoji: "\uD83C\uDFAE", label: "Tetris", prompt: "Build a complete Tetris game: all 7 tetromino shapes, rotation, wall kicks, line clearing with animation, score/level system, increasing speed, ghost piece, next piece preview, game over detection. Use HTML Canvas.", cwd: "examples/tetris" },
  { emoji: "\uD83D\uDE80", label: "Space Shooter", prompt: "Build a space shooter game with HTML Canvas: player ship with WASD+arrow controls, shooting with spacebar, waves of enemies that move in patterns, explosions, score counter, 3 lives, boss enemy every 5 waves. Multiple files.", cwd: "examples/space-shooter" },
];

export function GuildBoard() {
  const [prompt, setPrompt] = useState("");
  const [cwd, setCwd] = useState("");
  const startQuest = useGameStore((s) => s.startQuest);
  const setMode = useGameStore((s) => s.setMode);
  const mode = useGameStore((s) => s.state.mode);
  const connected = useGameStore((s) => s.connected);

  const handleStart = () => {
    if (!prompt.trim()) return;
    startQuest(prompt.trim(), cwd.trim() || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleStart();
    }
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
        width: "520px",
        maxWidth: "92vw",
        background: COLORS.bgPanel,
        border: `3px solid ${COLORS.borderLight}`,
        boxShadow: `0 0 30px ${COLORS.bg}, inset 0 0 20px ${COLORS.bgDark}44`,
        padding: "20px",
        animation: "slideUp 0.4s ease",
      }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <div style={{
            ...PIXEL_FONT,
            fontSize: "16px",
            color: COLORS.gold,
            letterSpacing: "4px",
            marginBottom: "4px",
            animation: "shimmer 3s infinite ease, float 4s infinite ease",
          }}>
            QUEST BOARD
          </div>
          <div style={{
            ...PIXEL_FONT_SM,
            color: COLORS.textDim,
            fontSize: "7px",
          }}>
            Choose a quest or write your own
          </div>
        </div>

        {/* Example quests */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{
            ...PIXEL_FONT_SM,
            color: COLORS.textDim,
            letterSpacing: "2px",
            marginBottom: "6px",
            fontSize: "7px",
          }}>
            POSTED QUESTS
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {EXAMPLE_QUESTS.map((q, i) => {
              const selected = prompt === q.prompt;
              return (
                <button
                  key={q.label}
                  onClick={() => { setPrompt(q.prompt); if (q.cwd) setCwd(q.cwd); }}
                  style={{
                    background: selected ? `${COLORS.gold}22` : COLORS.bgDark,
                    border: `1px solid ${selected ? COLORS.gold : COLORS.panelBorder}`,
                    color: selected ? COLORS.gold : COLORS.textMid,
                    padding: "4px 8px",
                    cursor: "pointer",
                    ...PIXEL_FONT_SM,
                    fontSize: "7px",
                    transition: "all 0.15s",
                    animation: selected ? "pulseGlow 2s infinite" : `bounceIn 0.4s ease ${i * 0.05}s both`,
                  }}
                >
                  <span style={{ animation: `sway ${3 + i * 0.3}s infinite ease` }}>{q.emoji}</span> {q.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quest description */}
        <div style={{ marginBottom: "10px" }}>
          <label style={{
            ...PIXEL_FONT_SM,
            color: COLORS.textDim,
            display: "block",
            marginBottom: "4px",
            letterSpacing: "2px",
            fontSize: "7px",
          }}>
            QUEST DETAILS
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the quest..."
            rows={3}
            style={{
              width: "100%",
              background: COLORS.bgDark,
              border: `2px solid ${COLORS.panelBorder}`,
              color: COLORS.parchment,
              padding: "8px",
              resize: "vertical",
              outline: "none",
              ...PIXEL_FONT_SM,
              fontSize: "8px",
              lineHeight: "14px",
            }}
          />
        </div>

        {/* CWD */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{
            ...PIXEL_FONT_SM,
            color: COLORS.textDim,
            display: "block",
            marginBottom: "4px",
            letterSpacing: "2px",
            fontSize: "7px",
          }}>
            WORKING DIR (OPTIONAL)
          </label>
          <input
            value={cwd}
            onChange={(e) => setCwd(e.target.value)}
            placeholder="/path/to/project"
            style={{
              width: "100%",
              background: COLORS.bgDark,
              border: `2px solid ${COLORS.panelBorder}`,
              color: COLORS.parchment,
              padding: "6px 8px",
              outline: "none",
              ...PIXEL_FONT_SM,
              fontSize: "8px",
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <button
            onClick={() => setMode(mode === "expert" ? "adventure" : "expert")}
            style={{
              background: COLORS.bgDark,
              border: `2px solid ${COLORS.poison}44`,
              color: COLORS.poison,
              padding: "6px 14px",
              cursor: "pointer",
              ...PIXEL_FONT_SM,
              fontSize: "8px",
            }}
          >
            {mode === "expert" ? "\uD83E\uDDE0 EXPERT" : "\uD83C\uDFB2 ADVENTURE"}
          </button>
          <button
            onClick={handleStart}
            disabled={!prompt.trim() || !connected}
            style={{
              background: prompt.trim() && connected ? `${COLORS.gold}22` : COLORS.bgDark,
              border: `2px solid ${prompt.trim() && connected ? COLORS.gold : COLORS.panelBorder}`,
              color: prompt.trim() && connected ? COLORS.gold : COLORS.textDim,
              padding: "6px 20px",
              cursor: !prompt.trim() || !connected ? "not-allowed" : "pointer",
              opacity: !prompt.trim() || !connected ? 0.5 : 1,
              animation: prompt.trim() && connected ? "pulseGlow 2s infinite" : undefined,
              ...PIXEL_FONT,
              fontSize: "10px",
              letterSpacing: "2px",
            }}
          >
            ACCEPT QUEST
          </button>
        </div>

        {!connected && (
          <div style={{
            textAlign: "center",
            marginTop: "8px",
            ...PIXEL_FONT_SM,
            color: COLORS.textDim,
            fontSize: "7px",
          }}>
            Connecting to guild server...
          </div>
        )}
      </div>
    </div>
  );
}
