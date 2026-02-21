import { useState, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { COLORS, PIXEL_FONT, PIXEL_FONT_SM, PIXEL_FONT_MD } from "../theme";

interface ExampleQuest {
  emoji: string;
  label: string;
  prompt: string;
  cwd: string;
}

// Module-level cache so examples survive unmount/remount
let cachedQuests: ExampleQuest[] | null = null;
let fetchInFlight = false;

export function GuildBoard() {
  const continueCwd = useGameStore((s) => s.continueCwd);
  const clearContinueCwd = useGameStore((s) => s.clearContinueCwd);

  const [prompt, setPrompt] = useState("");
  const [cwd, setCwd] = useState("");
  const [exampleQuests, setExampleQuests] = useState<ExampleQuest[]>(cachedQuests || []);

  // Fetch examples (with cache)
  useEffect(() => {
    if (cachedQuests) {
      setExampleQuests(cachedQuests);
      return;
    }
    if (fetchInFlight) return;
    fetchInFlight = true;
    fetch("http://localhost:3001/api/examples")
      .then((r) => r.json())
      .then((data) => {
        cachedQuests = data;
        setExampleQuests(data);
      })
      .catch(() => {})
      .finally(() => { fetchInFlight = false; });
  }, []);

  // Pick up continue cwd from previous quest
  useEffect(() => {
    if (continueCwd) {
      setCwd(continueCwd);
      clearContinueCwd();
    }
  }, [continueCwd, clearContinueCwd]);

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

  const isContinuing = !!cwd && !prompt;

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
        width: "600px",
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
            fontSize: "20px",
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
          }}>
            Choose a quest or write your own
          </div>
        </div>

        {/* Continue banner */}
        {isContinuing && (
          <div style={{
            marginBottom: "12px",
            padding: "8px 12px",
            background: `${COLORS.healGreen}11`,
            border: `2px solid ${COLORS.healGreen}44`,
            textAlign: "center",
            animation: "bounceIn 0.4s ease",
          }}>
            <div style={{
              ...PIXEL_FONT_SM,
              color: COLORS.healGreen,
              marginBottom: "4px",
            }}>
              CONTINUING PROJECT
            </div>
            <div style={{
              ...PIXEL_FONT_SM,
              color: COLORS.textMid,
            }}>
              {cwd}
            </div>
          </div>
        )}

        {/* Example quests */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{
            ...PIXEL_FONT_SM,
            color: COLORS.textDim,
            letterSpacing: "2px",
            marginBottom: "6px",
          }}>
            POSTED QUESTS
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {exampleQuests.map((q, i) => {
              const selected = prompt === q.prompt;
              return (
                <button
                  key={q.label}
                  onClick={() => { setPrompt(q.prompt); if (q.cwd) setCwd(q.cwd); }}
                  style={{
                    background: selected ? `${COLORS.gold}22` : COLORS.bgDark,
                    border: `1px solid ${selected ? COLORS.gold : COLORS.panelBorder}`,
                    color: selected ? COLORS.gold : COLORS.textMid,
                    padding: "6px 10px",
                    cursor: "pointer",
                    ...PIXEL_FONT_SM,
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
          }}>
            QUEST DETAILS
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isContinuing ? "What should the agent do next?" : "Describe the quest..."}
            rows={3}
            style={{
              width: "100%",
              background: COLORS.bgDark,
              border: `2px solid ${isContinuing ? `${COLORS.healGreen}44` : COLORS.panelBorder}`,
              color: COLORS.parchment,
              padding: "10px",
              resize: "vertical",
              outline: "none",
              ...PIXEL_FONT_SM,
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
              padding: "8px 10px",
              outline: "none",
              ...PIXEL_FONT_SM,
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
              padding: "8px 16px",
              cursor: "pointer",
              ...PIXEL_FONT_SM,
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
              padding: "8px 22px",
              cursor: !prompt.trim() || !connected ? "not-allowed" : "pointer",
              opacity: !prompt.trim() || !connected ? 0.5 : 1,
              animation: prompt.trim() && connected ? "pulseGlow 2s infinite" : undefined,
              ...PIXEL_FONT,
              fontSize: "13px",
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
          }}>
            Connecting to guild server...
          </div>
        )}
      </div>
    </div>
  );
}
