# Advanced Pong Arena

Build a polished browser Pong game with deterministic gameplay, stronger AI, and clean architecture.

## Objective
Implement a production-quality Pong clone using HTML Canvas and vanilla JavaScript.

## Functional Requirements
1. Core gameplay:
- Two paddles and one ball.
- Left paddle: player controls (`W`/`S`).
- Right paddle: AI-controlled.
- Match rules: first to 11 points and must win by 2.

2. Ball and collision system:
- Ball movement must be frame-rate independent.
- On paddle hit, outgoing angle depends on contact point.
- Add spin effect: paddle movement at impact modifies ball Y velocity.
- Prevent ball tunneling at high speed.

3. AI opponent:
- AI predicts future ball intercept instead of only following current ball Y.
- At least 3 difficulty levels: `easy`, `normal`, `hard`.
- Higher difficulty should improve reaction time and max paddle speed.

4. UX and game flow:
- Start screen, pause/resume, restart after match end.
- HUD showing score, current difficulty, and game state (`PAUSED`, `POINT`, `MATCH POINT`, `WINNER`).
- Visible center line and clean retro visual style.

## Technical Constraints
- Use only HTML, CSS, and vanilla JS.
- No external libraries.
- Separate rendering from update logic (fixed-timestep update loop recommended).
- Keep game logic in `game.js` (no inline JS).

## Output Files
- `index.html`
- `style.css`
- `game.js`

## Acceptance Criteria
- Gameplay speed feels the same on 60Hz and 120Hz displays.
- Collision behavior is stable even when ball speed increases.
- AI is clearly beatable on `easy` and challenging on `hard`.
- Match ends correctly with win-by-2 logic.
- No console errors during 2+ minutes of continuous play.
