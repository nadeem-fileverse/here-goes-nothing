import {
  setAdapter,
  runMigrations,
  initializeFromApiKey,
} from "@fileverse/api/cloudflare";
import { D1Adapter } from "../adapter/d1-adapter";
import type { Env } from "../types";

let initialized = false;

export async function ensureInitialized(env: Env): Promise<void> {
  if (initialized) return;

  // Expose env vars so the main package can read them via process.env
  process.env.API_KEY = env.API_KEY;
  if (env.RPC_URL) {
    process.env.RPC_URL = env.RPC_URL;
  }
  process.env.NODE_ENV = env.NODE_ENV || "production";

  // Inject D1 adapter before any domain logic runs
  const adapter = new D1Adapter(env.DB);
  setAdapter(adapter);

  // Run migrations (idempotent CREATE TABLE IF NOT EXISTS)
  await runMigrations();

  // Initialize portal & API key from the Fileverse backend
  await initializeFromApiKey(env.API_KEY);

  initialized = true;
}
