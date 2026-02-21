import { useState, useMemo } from "react";
import { useGameStore } from "../store/gameStore";
import { COLORS, PIXEL_FONT, PIXEL_FONT_SM } from "../theme";

const RANK_COLORS: Record<string, string> = {
  S: "#ff44aa",
  A: COLORS.healGreen,
  B: COLORS.ice,
  C: COLORS.fire,
  D: COLORS.textMid,
  F: COLORS.textDim,
};

type ViewTab = "preview" | "results" | "files";

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function FileViewer({ filename, content }: { filename: string; content: string }) {
  const lines = content.split("\n");
  const maxLines = 60;
  const truncated = lines.length > maxLines;
  const visibleLines = truncated ? lines.slice(0, maxLines) : lines;

  return (
    <div style={{
      background: "#0d0d1a",
      border: `1px solid ${COLORS.panelBorder}`,
      overflow: "auto",
      maxHeight: "400px",
    }}>
      <pre style={{
        margin: 0,
        padding: "8px",
        fontFamily: "'Courier New', monospace",
        fontSize: "11px",
        lineHeight: "16px",
        color: COLORS.parchment,
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
      }}>
        {visibleLines.map((line, i) => (
          <div key={i} style={{ display: "flex" }}>
            <span style={{
              color: COLORS.textDim,
              minWidth: "30px",
              textAlign: "right",
              paddingRight: "8px",
              userSelect: "none",
              fontSize: "10px",
            }}>
              {i + 1}
            </span>
            <span>{line}</span>
          </div>
        ))}
        {truncated && (
          <div style={{ color: COLORS.textDim, marginTop: "4px" }}>
            ... ({lines.length - maxLines} more lines)
          </div>
        )}
      </pre>
    </div>
  );
}

// Build a preview URL for the output. Tries to find an HTML entry point.
function getPreviewUrl(questId: string, files: string[]): string | null {
  // Prefer index.html, then any .html file
  const htmlFiles = files.filter((f) => /\.html?$/i.test(f));
  const entry =
    htmlFiles.find((f) => /index\.html?$/i.test(f)) ||
    htmlFiles[0];
  if (!entry) return null;
  // Server serves output/ statically at /output/
  return `http://localhost:3001/output/${questId}/${entry}`;
}

export function VictoryScreen() {
  const lastResult = useGameStore((s) => s.state.lastResult);
  const resetState = useGameStore((s) => s.resetState);
  const deleteOutput = useGameStore((s) => s.deleteOutput);

  const files = lastResult?.filesCreated || [];
  const contents = lastResult?.fileContents || {};
  const hasFiles = files.length > 0;

  const previewUrl = useMemo(
    () => (lastResult ? getPreviewUrl(lastResult.questId, files) : null),
    [lastResult, files]
  );

  // Default to preview if there's an HTML file, otherwise results
  const [view, setView] = useState<ViewTab>(previewUrl ? "preview" : "results");
  const [activeTab, setActiveTab] = useState(0);
  const [deleted, setDeleted] = useState(false);

  if (!lastResult) return null;

  const contextPct = Math.round(
    (lastResult.contextRemaining / (lastResult.contextRemaining + lastResult.contextUsed)) * 100
  );
  const stars = contextPct > 80 ? 3 : contextPct > 50 ? 2 : 1;
  const rankColor = RANK_COLORS[lastResult.rank] || COLORS.textMid;

  const handleKeepAndNext = () => resetState();
  const handleDeleteAndNext = () => {
    if (lastResult.outputDir) {
      deleteOutput(lastResult.outputDir);
      setDeleted(true);
    }
    setTimeout(() => resetState(), 200);
  };

  const isWide = view === "preview" || view === "files";

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
        width: isWide ? "min(900px, 95vw)" : "480px",
        maxHeight: "92vh",
        overflow: "auto",
        background: COLORS.bgPanel,
        border: `3px solid ${COLORS.gold}66`,
        boxShadow: `0 0 40px ${COLORS.gold}22`,
        padding: "16px",
        animation: "slideUp 0.5s ease",
        transition: "width 0.3s ease",
        display: "flex",
        flexDirection: "column",
      }}>

        {/* === Header: Victory + Rank === */}
        <div style={{ textAlign: "center", marginBottom: "8px", flexShrink: 0 }}>
          <div style={{
            ...PIXEL_FONT,
            fontSize: "16px",
            color: COLORS.gold,
            textShadow: `0 0 15px ${COLORS.gold}66, 2px 2px 0 #000`,
            letterSpacing: "4px",
            animation: "victory 1s ease 2",
          }}>
            VICTORY!
          </div>
          <div style={{ display: "flex", gap: "6px", justifyContent: "center", margin: "6px 0" }}>
            {[1, 2, 3].map((n) => (
              <span key={n} style={{
                fontSize: "18px",
                filter: n <= stars ? "none" : "grayscale(1) opacity(0.3)",
              }}>
                {n <= stars ? "\u2B50" : "\u2606"}
              </span>
            ))}
            <span style={{
              ...PIXEL_FONT,
              fontSize: "22px",
              color: rankColor,
              textShadow: `0 0 12px ${rankColor}66, 1px 1px 0 #000`,
              marginLeft: "8px",
            }}>
              {lastResult.rank}
            </span>
          </div>
        </div>

        {/* === Tab switcher === */}
        <div style={{
          display: "flex",
          gap: "4px",
          marginBottom: "10px",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          {previewUrl && (
            <TabBtn label="PREVIEW" active={view === "preview"} onClick={() => setView("preview")} accent={COLORS.healGreen} />
          )}
          <TabBtn label="RESULTS" active={view === "results"} onClick={() => setView("results")} accent={COLORS.gold} />
          {hasFiles && (
            <TabBtn label={`CODE (${files.length})`} active={view === "files"} onClick={() => setView("files")} accent={COLORS.ice} />
          )}
        </div>

        {/* === PREVIEW VIEW === */}
        {view === "preview" && previewUrl && (
          <div style={{
            flex: 1,
            minHeight: "400px",
            border: `2px solid ${COLORS.healGreen}44`,
            background: "#fff",
            position: "relative",
          }}>
            <iframe
              src={previewUrl}
              title="Output preview"
              sandbox="allow-scripts allow-same-origin"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                minHeight: "400px",
              }}
            />
            {/* URL label */}
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "2px 8px",
              background: `${COLORS.bgDark}dd`,
              ...PIXEL_FONT_SM,
              fontSize: "6px",
              color: COLORS.textDim,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {previewUrl}
            </div>
          </div>
        )}

        {/* === RESULTS VIEW === */}
        {view === "results" && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <div style={{
              textAlign: "left",
              marginBottom: "10px",
              padding: "8px",
              background: COLORS.bgDark,
              border: `2px solid ${COLORS.panelBorder}`,
            }}>
              <div style={{ ...PIXEL_FONT_SM, color: COLORS.textDim, letterSpacing: "2px", marginBottom: "6px", fontSize: "7px" }}>
                BATTLE RESULTS
              </div>
              {[
                { label: "Gold Earned", value: lastResult.score.toLocaleString(), color: COLORS.gold },
                { label: "Time", value: formatDuration(lastResult.duration), color: COLORS.textMid },
                { label: "HP Remaining", value: `${contextPct}%`, color: COLORS.hpRed },
                { label: "Hits Landed", value: `${lastResult.testsPassed}`, color: COLORS.healGreen },
                { label: "Hits Taken", value: `${lastResult.testsFailed}`, color: lastResult.testsFailed > 0 ? COLORS.fire : COLORS.textDim },
                { label: "Allies Summoned", value: `${lastResult.subagentsUsed}`, color: COLORS.poison },
                { label: "Orders Given", value: `${lastResult.playerDecisions}`, color: COLORS.ice },
              ].map((row) => (
                <div key={row.label} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "2px 0",
                  ...PIXEL_FONT_SM,
                  fontSize: "8px",
                }}>
                  <span style={{ color: COLORS.textDim }}>{row.label}</span>
                  <span style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>

            {hasFiles && (
              <div style={{
                textAlign: "left",
                marginBottom: "10px",
                padding: "8px",
                background: COLORS.bgDark,
                border: `2px solid ${COLORS.healGreen}22`,
              }}>
                <div style={{ ...PIXEL_FONT_SM, color: COLORS.textDim, letterSpacing: "2px", marginBottom: "4px", fontSize: "7px" }}>
                  LOOT ({files.length} files)
                </div>
                {files.map((f) => (
                  <div key={f} style={{
                    ...PIXEL_FONT_SM,
                    color: COLORS.ice,
                    fontSize: "7px",
                    padding: "1px 0",
                    cursor: "pointer",
                  }} onClick={() => { setView("files"); setActiveTab(files.indexOf(f)); }}>
                    {"  \u25B8 "}{f}
                  </div>
                ))}
              </div>
            )}

            {lastResult.achievements.length > 0 && (
              <div style={{ marginBottom: "10px" }}>
                <div style={{ ...PIXEL_FONT_SM, color: COLORS.textDim, letterSpacing: "2px", marginBottom: "6px", fontSize: "7px" }}>
                  SKILLS LEARNED
                </div>
                <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                  {lastResult.achievements.map((a) => (
                    <div key={a.id} style={{
                      background: COLORS.bgDark,
                      border: `1px solid ${COLORS.poison}44`,
                      padding: "3px 6px",
                      ...PIXEL_FONT_SM,
                      fontSize: "7px",
                      color: COLORS.poison,
                    }} title={a.description}>
                      {a.icon} {a.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === FILES / CODE VIEW === */}
        {view === "files" && hasFiles && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "2px",
              marginBottom: "8px",
            }}>
              {files.map((f, i) => (
                <button
                  key={f}
                  onClick={() => setActiveTab(i)}
                  style={{
                    ...PIXEL_FONT_SM,
                    fontSize: "7px",
                    padding: "3px 8px",
                    background: activeTab === i ? COLORS.bgDark : "transparent",
                    border: `1px solid ${activeTab === i ? COLORS.ice : COLORS.panelBorder}`,
                    color: activeTab === i ? COLORS.ice : COLORS.textDim,
                    cursor: "pointer",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {files[activeTab] && contents[files[activeTab]] ? (
              <FileViewer
                filename={files[activeTab]}
                content={contents[files[activeTab]]}
              />
            ) : (
              <div style={{
                padding: "16px",
                textAlign: "center",
                ...PIXEL_FONT_SM,
                color: COLORS.textDim,
                background: COLORS.bgDark,
                border: `1px solid ${COLORS.panelBorder}`,
              }}>
                No preview available
              </div>
            )}
          </div>
        )}

        {/* === Action buttons === */}
        <div style={{
          display: "flex",
          gap: "8px",
          justifyContent: "center",
          marginTop: "10px",
          flexShrink: 0,
        }}>
          {lastResult.outputDir && !deleted && (
            <button
              onClick={handleDeleteAndNext}
              style={{
                ...PIXEL_FONT_SM,
                fontSize: "7px",
                background: COLORS.bgDark,
                border: `2px solid ${COLORS.hpRed}44`,
                color: COLORS.hpRed,
                padding: "6px 14px",
                cursor: "pointer",
              }}
            >
              DELETE & NEXT
            </button>
          )}
          <button
            onClick={handleKeepAndNext}
            style={{
              ...PIXEL_FONT,
              fontSize: "9px",
              background: COLORS.bgDark,
              border: `2px solid ${COLORS.gold}66`,
              color: COLORS.gold,
              padding: "6px 20px",
              cursor: "pointer",
              animation: "pulseGlow 2s infinite",
              letterSpacing: "1px",
            }}
          >
            {lastResult.outputDir && !deleted ? "KEEP & NEXT" : "NEXT QUEST"} {"\u2192"}
          </button>
        </div>

        {deleted && (
          <div style={{
            textAlign: "center",
            marginTop: "4px",
            ...PIXEL_FONT_SM,
            fontSize: "7px",
            color: COLORS.textDim,
            flexShrink: 0,
          }}>
            Output deleted.
          </div>
        )}
      </div>
    </div>
  );
}

// Small reusable tab button
function TabBtn({ label, active, onClick, accent }: {
  label: string; active: boolean; onClick: () => void; accent: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...PIXEL_FONT_SM,
        fontSize: "7px",
        padding: "4px 12px",
        background: active ? `${accent}22` : COLORS.bgDark,
        border: `1px solid ${active ? accent : COLORS.panelBorder}`,
        color: active ? accent : COLORS.textDim,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
