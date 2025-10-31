import { fastify } from "./app";
import { initializeServer } from "./server";

// Dev entry point - uses top-level await (works with Vite ESM)
await initializeServer();

export { fastify };
