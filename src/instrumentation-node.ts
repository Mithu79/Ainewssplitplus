import { initStore } from "@/lib/store";

/** Node.js only: warms the news store and starts the crawl loop. */
export async function init(): Promise<void> {
  await initStore();
  // eslint-disable-next-line no-console
  console.log("[newssplit] store initialised — crawl loop running");
}
