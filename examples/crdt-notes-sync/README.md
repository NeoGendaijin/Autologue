# Local-First CRDT Notes App

Build a collaborative notes editor that converges correctly under offline edits.

## Objective
Implement a browser-based local-first notes app with a CRDT core and a network simulator.

## Required Features
1. Editor:
- Multi-line text editor with cursor support.
- Insert/delete operations represented as CRDT ops (not raw full-text overwrite).
- Undo/redo for local user operations.

2. Collaboration model:
- Simulate 2-3 peers in one page.
- Each peer can go offline/online independently.
- Buffered operations sync on reconnect.
- Eventually consistent convergence: all replicas must reach same final state.

3. Conflict scenarios:
- Concurrent inserts at same logical position.
- Concurrent delete/insert overlap.
- Out-of-order message delivery.
- Duplicate message handling (idempotency).

4. Observability:
- Operation log panel with operation IDs, lamport/vector clock info.
- Replica state inspector.
- "Run deterministic scenario" button with predefined conflict scripts.

## Technical Constraints
- Vanilla JS/TS + HTML/CSS only (no external CRDT packages).
- CRDT algorithm must be explicitly implemented (e.g., RGA/LSEQ/Logoot-style approach).
- Deterministic tie-breaking strategy required.

## Output Files
- `index.html`
- `styles.css`
- `app.js` (or `src/*.js` with clear module split)
- `SCENARIOS.md` (describe at least 5 conflict scenarios and expected outcome)

## Acceptance Criteria
- All peers converge after reconnection in every predefined scenario.
- Duplicate and out-of-order operations do not corrupt state.
- Operation log is human-readable and useful for debugging.
- No data loss after repeated offline/online cycles.
