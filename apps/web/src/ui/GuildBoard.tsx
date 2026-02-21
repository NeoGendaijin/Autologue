import { useState, useEffect, useMemo } from "react";
import { useGameStore, type ContinueContext } from "../store/gameStore";
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

/** Generate "next step" suggestions based on what was built. */
function generateContinueSuggestions(ctx: ContinueContext): Array<{ emoji: string; label: string; prompt: string }> {
  const files = ctx.filesCreated;
  const suggestions: Array<{ emoji: string; label: string; prompt: string }> = [];

  const hasHtml = files.some((f) => /\.html?$/i.test(f));
  const hasCss = files.some((f) => /\.css$/i.test(f));
  const hasJs = files.some((f) => /\.(js|ts|jsx|tsx)$/i.test(f));
  const hasTest = files.some((f) => /test|spec/i.test(f));
  const hasPy = files.some((f) => /\.py$/i.test(f));

  if (hasHtml && !hasCss) {
    suggestions.push({ emoji: "\uD83C\uDFA8", label: "Add styling", prompt: "Add beautiful CSS styling to the project. Make it look polished and modern." });
  }
  if (hasHtml || hasCss) {
    suggestions.push({ emoji: "\uD83C\uDF19", label: "Dark mode", prompt: "Add a dark mode toggle with smooth transitions." });
    suggestions.push({ emoji: "\u2728", label: "Add animations", prompt: "Add smooth CSS animations and transitions to make the UI feel alive." });
    suggestions.push({ emoji: "\uD83D\uDCF1", label: "Make responsive", prompt: "Make the layout responsive for mobile and tablet screens." });
  }
  if (hasJs || hasPy) {
    if (!hasTest) {
      suggestions.push({ emoji: "\uD83E\uDDEA", label: "Add tests", prompt: "Write unit tests for the main functionality." });
    }
    suggestions.push({ emoji: "\uD83D\uDC1B", label: "Fix bugs", prompt: "Review the code, find and fix any bugs or edge cases." });
    suggestions.push({ emoji: "\u26A1", label: "Optimize", prompt: "Optimize the code for better performance and cleaner structure." });
    suggestions.push({ emoji: "\uD83D\uDD12", label: "Error handling", prompt: "Add proper error handling and input validation." });
  }
  if (hasHtml) {
    suggestions.push({ emoji: "\uD83C\uDFAE", label: "Add interactivity", prompt: "Add more interactive features and user controls." });
  }

  // Always available
  suggestions.push({ emoji: "\uD83D\uDE80", label: "New feature", prompt: "Add a cool new feature to the project." });
  suggestions.push({ emoji: "\uD83D\uDCDD", label: "README", prompt: "Write a clear README.md with description, setup instructions, and usage." });
  suggestions.push({ emoji: "\u267B\uFE0F", label: "Refactor", prompt: "Refactor the code to be cleaner and more maintainable." });

  return suggestions;
}

export function GuildBoard() {
  const continueCwd = useGameStore((s) => s.continueCwd);
  const continueContext = useGameStore((s) => s.continueContext);
  const clearContinueCwd = useGameStore((s) => s.clearContinueCwd);

  const [prompt, setPrompt] = useState("");
  const [cwd, setCwd] = useState("");
  const [exampleQuests, setExampleQuests] = useState<ExampleQuest[]>(cachedQuests || []);

  const isContinuing = !!continueContext;

  const continueSuggestions = useMemo(
    () => (continueContext ? generateContinueSuggestions(continueContext) : []),
    [continueContext]
  );

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
        border: `3px solid ${isContinuing ? COLORS.healGreen : COLORS.borderLight}`,
        boxShadow: isContinuing
          ? `0 0 30px ${COLORS.healGreen}22, inset 0 0 20px ${COLORS.bgDark}44`
          : `0 0 30px ${COLORS.bg}, inset 0 0 20px ${COLORS.bgDark}44`,
        padding: "20px",
        animation: "slideUp 0.4s ease",
      }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <div style={{
            ...PIXEL_FONT,
            fontSize: "20px",
            color: isContinuing ? COLORS.healGreen : COLORS.gold,
            letterSpacing: "4px",
            marginBottom: "4px",
            animation: "shimmer 3s infinite ease, float 4s infinite ease",
          }}>
            {isContinuing ? "NEXT MOVE" : "QUEST BOARD"}
          </div>
          <div style={{
            ...PIXEL_FONT_SM,
            color: COLORS.textDim,
          }}>
            {isContinuing ? "What will you do next?" : "Choose a quest or write your own"}
          </div>
        </div>

        {/* Continue context banner */}
        {isContinuing && continueContext && (
          <div style={{
            marginBottom: "12px",
            padding: "10px 14px",
            background: `${COLORS.healGreen}11`,
            border: `2px solid ${COLORS.healGreen}33`,
            animation: "bounceIn 0.4s ease",
          }}>
            <div style={{
              ...PIXEL_FONT_SM,
              fontSize: "10px",
              color: COLORS.textDim,
              marginBottom: "4px",
            }}>
              PREVIOUS QUEST
            </div>
            <div style={{
              ...PIXEL_FONT_SM,
              fontSize: "12px",
              color: COLORS.parchment,
              marginBottom: "6px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {continueContext.prevQuest || "Unknown quest"}
            </div>
            {continueContext.filesCreated.length > 0 && (
              <div style={{
                ...PIXEL_FONT_SM,
                fontSize: "10px",
                color: COLORS.ice,
              }}>
                {continueContext.filesCreated.length} files created
              </div>
            )}
          </div>
        )}

        {/* === Continue suggestions (shown instead of examples) === */}
        {isContinuing && (
          <div style={{ marginBottom: "12px" }}>
            <div style={{
              ...PIXEL_FONT_SM,
              fontSize: "10px",
              color: COLORS.textDim,
              letterSpacing: "2px",
              marginBottom: "6px",
            }}>
              SUGGESTIONS
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {continueSuggestions.map((s, i) => {
                const selected = prompt === s.prompt;
                return (
                  <button
                    key={s.label}
                    onClick={() => setPrompt(s.prompt)}
                    style={{
                      background: selected ? `${COLORS.healGreen}22` : COLORS.bgDark,
                      border: `1px solid ${selected ? COLORS.healGreen : COLORS.panelBorder}`,
                      color: selected ? COLORS.healGreen : COLORS.textMid,
                      padding: "6px 10px",
                      cursor: "pointer",
                      ...PIXEL_FONT_SM,
                      transition: "all 0.15s",
                      animation: selected ? "pulseGlow 2s infinite" : `bounceIn 0.4s ease ${i * 0.04}s both`,
                    }}
                  >
                    <span style={{ animation: `sway ${3 + i * 0.3}s infinite ease` }}>{s.emoji}</span> {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* === Example quests (shown when NOT continuing) === */}
        {!isContinuing && (
          <div style={{ marginBottom: "12px" }}>
            <div style={{
              ...PIXEL_FONT_SM,
              fontSize: "10px",
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
        )}

        {/* Quest description */}
        <div style={{ marginBottom: "10px" }}>
          <label style={{
            ...PIXEL_FONT_SM,
            fontSize: "10px",
            color: COLORS.textDim,
            display: "block",
            marginBottom: "4px",
            letterSpacing: "2px",
          }}>
            {isContinuing ? "ORDERS" : "QUEST DETAILS"}
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
            fontSize: "10px",
            color: COLORS.textDim,
            display: "block",
            marginBottom: "4px",
            letterSpacing: "2px",
          }}>
            WORKING DIR {isContinuing ? "" : "(OPTIONAL)"}
          </label>
          <input
            value={cwd}
            onChange={(e) => setCwd(e.target.value)}
            placeholder="/path/to/project"
            readOnly={isContinuing}
            style={{
              width: "100%",
              background: isContinuing ? `${COLORS.bgDark}88` : COLORS.bgDark,
              border: `2px solid ${isContinuing ? COLORS.healGreen + "44" : COLORS.panelBorder}`,
              color: isContinuing ? COLORS.healGreen : COLORS.parchment,
              padding: "8px 10px",
              outline: "none",
              ...PIXEL_FONT_SM,
              opacity: isContinuing ? 0.8 : 1,
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
              background: prompt.trim() && connected ? `${isContinuing ? COLORS.healGreen : COLORS.gold}22` : COLORS.bgDark,
              border: `2px solid ${prompt.trim() && connected ? (isContinuing ? COLORS.healGreen : COLORS.gold) : COLORS.panelBorder}`,
              color: prompt.trim() && connected ? (isContinuing ? COLORS.healGreen : COLORS.gold) : COLORS.textDim,
              padding: "8px 22px",
              cursor: !prompt.trim() || !connected ? "not-allowed" : "pointer",
              opacity: !prompt.trim() || !connected ? 0.5 : 1,
              animation: prompt.trim() && connected ? "pulseGlow 2s infinite" : undefined,
              ...PIXEL_FONT,
              fontSize: "13px",
              letterSpacing: "2px",
            }}
          >
            {isContinuing ? "CONTINUE QUEST" : "ACCEPT QUEST"}
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
