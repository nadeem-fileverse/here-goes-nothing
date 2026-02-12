import { app } from "./routes";
import { ensureInitialized } from "./lib/init";
import { processPendingEvents } from "./lib/sync";
import type { Env } from "./types";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    await ensureInitialized(env);
    return app.fetch(request, env, ctx);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        await ensureInitialized(env);
        await processPendingEvents();
      })(),
    );
  },
};
