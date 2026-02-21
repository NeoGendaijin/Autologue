# Todo CLI App

Build a command-line todo list app in Node.js.

## Features
- `node todo.js add "Buy milk"` — add a task
- `node todo.js list` — show all tasks
- `node todo.js done 1` — mark task #1 as done
- `node todo.js remove 1` — delete task #1

## Requirements
- Store tasks in a `todos.json` file
- Show task number, status ([ ] or [x]), and text
- Handle errors gracefully (missing file, bad index, etc.)
- No external dependencies — use only Node.js built-ins
