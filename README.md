# Agent Quest

Turn your AI coding agent into an RPG. Watch it fight through tasks, manage resources, make tactical decisions, and earn ranks.

Agent Quest wraps the **Gemini CLI** with real-time game mechanics — context tokens become HP, API calls become MP, sub-agents become party members, and every coding task is a quest.

```
┌─ ░░ AGENT QUEST ░░ ─── ADVENTURE ─── Score: 1450 ─── 02:31 ─── LV.3 ─┐
│                                                                         │
│  ┌─ STAGE ──────────────────┐  ┌─ STATS ─────────────────────────────┐ │
│  │     🤖  🔍  🧪           │  │ ❤️ CONTEXT  ████████░░░░  680K/1M  │ │
│  │                          │  │ ◆ API MP    ██████████░░  85/100   │ │
│  │    ▸ IN PROGRESS ▸       │  │ ⭐ EXP      ████░░░░░░░░  40/100   │ │
│  └──────────────────────────┘  ├─ PARTY ─────────────────────────────┤ │
│  ┌─ LOG ────────────────────┐  │ 🤖 Main Agent      ████████ 100    │ │
│  │ ▸ Reading src/index.ts   │  │ 🔍 Scout           ██████░░  80    │ │
│  │ ✦ 3 tests passed!       │  │ 🧪 Tester          ██████░░  80    │ │
│  │ ▸ Writing utils.ts      │  ├─ TACTICS ────────────────────────────┤ │
│  │ ? Agent asks: "Use       │  │ [1] 📋 Summarize  [2] 🔀 Split    │ │
│  │   Redis or in-memory?"   │  │ [3] 💾 Checkpoint  [4] 🗑️ Forget   │ │
│  └──────────────────────────┘  └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## How It Works

1. You describe a coding task (or pick an example quest)
2. Gemini CLI starts working on it
3. Its actions stream in as game events — file reads, writes, test runs, errors
4. When the agent has a question, you choose from 3 options (detailed guidance / brief direction / let it decide)
5. You can use **tactics** mid-quest to manage context (summarize, split task, checkpoint, forget)
6. Quest ends with a score, rank (S through F), and achievements

## Game Mechanics

### Resources

| Resource | Icon | What It Represents |
|----------|------|--------------------|
| Context | ❤️ | Token usage (1M pool) — your HP |
| API MP | ◆ | API calls (100 pool) — spent on tools, tests, tactics |
| EXP | ⭐ | Experience — level up across quests |

### Party System

Agents spawn during quests as party members:

| Type | Icon | Role |
|------|------|------|
| Main | 🤖 | Primary coding agent |
| Scout | 🔍 | File/code search |
| Tester | 🧪 | Test runner |
| Scribe | 📝 | Documentation |
| Fixer | 🔧 | Bug fixing |

### Tactics

Use during a quest to manage resources (costs 15 MP each):

| Tactic | Effect | Context Recovery |
|--------|--------|-----------------|
| 📋 Summarize | Compress conversation history | ~100K tokens |
| 🔀 Split Task | Break into subtasks | ~50K tokens |
| 💾 Checkpoint | Save current state | — |
| 🗑️ Forget | Drop old context (risky!) | ~150K tokens |

### Scoring & Ranks

Score is based on context efficiency, speed, test pass rate, and player intervention count. Ranks: **S** > A > B > C > D > F.

### Achievements

- **First Blood** 🏅 — Complete your first quest
- **Ice Cold** 🧊 — Finish with 90%+ context remaining
- **Gambler** 🎰 — Never intervene
- **Squad Leader** 👨‍👩‍👧‍👦 — 4+ sub-agents active at once
- **Speedrunner** ⚡ — Complete in under 1 minute
- **From the Brink** 💀 — Win with context below 5%

## Getting Started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) installed and authenticated

### Install & Run

```bash
pnpm install
pnpm dev
```

This starts the server (port 3001) and web UI (Vite dev server). Open the URL shown in the terminal.

### Terminal UI

For a text-based experience:

```bash
pnpm dev:terminal
```

### Keyboard Controls

**During a question:**
- `A` / `B` / `C` — pick a choice

**During a quest:**
- `1` — Summarize
- `2` — Split Task
- `3` — Checkpoint
- `4` — Forget

## Example Quests

The `examples/` directory has starter tasks you can launch from the UI:

| Quest | Description |
|-------|-------------|
| 🏓 Ping Pong | Build a Canvas pong game |
| 🐍 Snake Game | Classic snake in one HTML file |
| 🧮 Solve Equations | Solve quadratic, linear system, and derivatives in Python |
| 📋 Todo CLI | Node.js CLI todo app with JSON storage |
| 📰 AI Report | Research and write a report on AI in 2025 |
| 🌤️ Weather App | Responsive weather dashboard for 3 cities |

## Project Structure

```
├── packages/
│   └── core/                  # Shared game logic & Gemini adapter
│       ├── game-engine/       # State, events, scoring, tactics
│       ├── event-mapper/      # Gemini → game event translation
│       └── gemini-adapter/    # Process management, JSONL parsing
├── apps/
│   ├── server/                # Express + WebSocket server
│   ├── web/                   # React + PixiJS web client
│   └── terminal/              # Ink (React for terminal) client
└── examples/                  # Standalone example quest tasks
```

## Tech Stack

- **Core:** TypeScript, Zod, EventEmitter3
- **Server:** Express, ws, Node.js child_process
- **Web:** React 19, PixiJS 8, Zustand, Vite
- **Terminal:** Ink 5, React 19
- **Build:** tsup, pnpm workspaces

## Architecture

```
Gemini CLI (child process)
    │ stdout: JSONL stream
    ▼
EventMapper (pattern matching → GameEvents)
    │
    ▼
Pure Reducer (GameEvent → GameState)
    │
    ├─ WebSocket → Web UI (React + PixiJS)
    └─ Direct state → Terminal UI (Ink)
```

The core uses a **pure reducer pattern** — `reduceGameEvent(state, event) → state` — with no side effects. Gemini CLI output is parsed via Zod-validated schemas, mapped to game events through pattern matching (question detection, test result parsing, sub-agent spawning), and streamed to clients over WebSocket.

## License

MIT
