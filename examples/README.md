# Example Quest Index

These folders contain quest prompts consumed by `/api/examples`.

The server loads each `examples/<name>/README.md` as the quest prompt body.

## Challenge Map

| Folder | Quest Type | Difficulty | Main Focus |
|---|---|---:|---|
| `ping-pong-game` | Browser game | 3/5 | deterministic game loop, collision, AI paddle |
| `snake-game` | Browser game | 3/5 | fixed-tick simulation, input queue, progression |
| `todo-cli` | CLI app | 3/5 | command parsing, persistence, atomic writes |
| `weather-dashboard` | Frontend app | 3/5 | API integration, caching, chart rendering |
| `research-report` | Research/writing | 4/5 | source quality, evidence-based synthesis |
| `solve-equations` | Numerical Python | 4/5 | Gaussian elimination, Newton, Simpson |
| `mini-sql-engine` | Language/runtime | 5/5 | parser, AST, execution pipeline, joins/grouping |
| `shift-scheduler-optimizer` | Optimization | 5/5 | constraints, scoring, best-effort solving |
| `advanced-pathfinding-lab` | Algorithm visualizer | 5/5 | BFS/Dijkstra/A*/bidirectional + visualization |

## Usage

1. Run `pnpm dev`.
2. Open the quest board in web UI.
3. Pick one of the posted quests, or edit the prompt before starting.

## Authoring New Quests

To add a new quest:

1. Create `examples/<your-quest-name>/`.
2. Add `README.md` with a clear title (`# ...`) and concrete requirements.
3. Reload the web app; it will appear automatically in posted quests.
