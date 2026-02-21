# Advanced Pathfinding Lab

Create an interactive pathfinding simulator with multiple algorithms and terrain costs.

## Objective
Build a visual algorithm lab that compares search strategies on the same grid world.

## Required Features
1. Grid editor:
- Adjustable grid size (for example 20x20 to 100x100).
- Draw walls, weighted terrain, start node, goal node.
- Support random map generation and reset.

2. Algorithms:
- BFS
- Dijkstra
- A* (with Manhattan and Euclidean heuristics)
- Bidirectional search (at least for unweighted mode)

3. Visualization:
- Step-by-step animated frontier expansion.
- Optional instant solve mode.
- Distinct colors for visited/frontier/final path.
- Playback controls: pause/resume/step/speed slider.

4. Analysis panel:
- Path length
- Expanded node count
- Runtime in ms
- Algorithm-specific notes (heuristic admissibility warning for weighted terrain)

5. Maze generation:
- Include at least one maze generator (recursive backtracker or Prim-based).

## Technical Constraints
- HTML/CSS/JS only.
- No canvas chart libraries.
- Algorithms must be implemented from scratch.
- Maintain separation between model (grid), solver, and renderer.

## Output Files
- `index.html`
- `style.css`
- `app.js`

## Acceptance Criteria
- Results are reproducible for same random seed.
- Dijkstra/A* always return optimal path on weighted maps.
- Visualization stays responsive on at least 80x80 grid.
- Metrics update correctly after every run.
