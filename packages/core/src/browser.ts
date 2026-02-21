// Browser-safe exports (no Node.js dependencies like child_process)

// Game Engine
export * from "./game-engine/events.js";
export * from "./game-engine/state.js";
export * from "./game-engine/quest.js";
export * from "./game-engine/scoring.js";
export * from "./game-engine/tactics.js";

// Event Mapper
export * from "./event-mapper/patterns.js";
export * from "./event-mapper/action-classifier.js";
export * from "./event-mapper/mapper.js";

// Gemini Adapter (types only, no process management)
export * from "./gemini-adapter/types.js";
export * from "./gemini-adapter/stdin-relay.js";
