# Snake Game Plus

Build an advanced Snake game with robust input handling and replayable gameplay.

## Objective
Implement a polished Snake game in the browser with predictable timing and multiple game modes.

## Functional Requirements
1. Core mechanics:
- Grid-based movement with fixed simulation tick.
- Snake grows when eating food.
- Collision with self is always game over.
- Support two wall modes:
  - `classic`: wall collision is game over
  - `wrap`: crossing edge wraps to opposite side

2. Input system:
- Arrow keys and WASD support.
- Input queue so fast key presses are not dropped.
- Prevent immediate 180-degree reversal.

3. Difficulty and progression:
- At least 3 difficulty levels with different initial speed.
- Speed scales up every N foods eaten.
- Display score, level, and current speed.

4. Extra gameplay:
- Obstacles appear after level 3.
- Bonus food appears temporarily and gives extra points.
- Pause/resume and restart support.

5. Persistence:
- Save top 5 high scores to `localStorage`.
- Show score board on start/game-over screen.

## Technical Constraints
- Use HTML Canvas and vanilla JavaScript only.
- No external libraries.
- Keep rendering and game-state updates separated.

## Output Files
- `index.html`
- `style.css`
- `game.js`

## Acceptance Criteria
- Game remains responsive after 5+ minutes of play.
- Input queue prevents missed turns at higher speed.
- Difficulty differences are noticeable.
- High scores persist across browser refreshes.
- No console errors during normal gameplay.
