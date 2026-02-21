# Todo CLI Pro

Build a robust Node.js CLI task manager with filtering, sorting, and safe persistence.

## Objective
Create a maintainable command-line todo app for daily use, not just a demo.

## Required Commands
- `node todo.js add "Buy milk" --priority high --tag home --due 2026-03-01`
- `node todo.js list [--status open|done] [--tag <name>] [--sort due|priority|created]`
- `node todo.js done <id>`
- `node todo.js undo <id>`
- `node todo.js edit <id> --text "New text"`
- `node todo.js remove <id>`
- `node todo.js stats`
- `node todo.js export --format markdown|json`

## Data Model
Each task must include:
- `id` (stable integer or UUID)
- `text`
- `status` (`open` or `done`)
- `priority` (`low`, `medium`, `high`)
- `tags` (array)
- `createdAt` (ISO datetime)
- `updatedAt` (ISO datetime)
- `dueDate` (optional, `YYYY-MM-DD`)

## Persistence Requirements
- Store data in `todos.json`.
- Create file automatically if missing.
- Use atomic write strategy (write temp file then rename).
- Handle malformed JSON with a clear recovery message.

## UX Requirements
- Human-readable table output for `list`.
- Colored terminal output is optional, but no external packages allowed.
- Helpful error messages for invalid command/args.
- `node todo.js help` must print command usage examples.

## Constraints
- Node.js built-ins only.
- No external dependencies.
- Keep app in a single executable file `todo.js`.

## Acceptance Criteria
- Supports at least 50 tasks without formatting issues.
- Filtering and sorting combinations work correctly.
- Exported markdown is readable and grouped by status.
- App never silently loses data on normal command usage.
