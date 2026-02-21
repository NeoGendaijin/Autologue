import dotenv from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "./server.js";

// Load .env from repo root
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../.env") });

const PORT = Number(process.env.PORT) || 3001;

const server = createServer();

server.listen(PORT, () => {
  console.log(`[agent-quest] Server listening on http://localhost:${PORT}`);
  console.log(`[agent-quest] WebSocket available at ws://localhost:${PORT}/ws`);
});
