/**
 * Runs once when the server boots.
 *
 * The Node-only implementation is imported dynamically so the Edge build never
 * sees `node:fs` / `node:path` (the store persists its index to disk).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Don't crawl while `next build` is running — pages are force-dynamic, so the
  // store is only needed by the live server.
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  try {
    const { init } = await import("./instrumentation-node");
    await init();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[newssplit] instrumentation failed:", error);
  }
}
