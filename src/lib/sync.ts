import { EventsModel, processEvent } from "@fileverse/api/cloudflare";

const MAX_EVENTS_PER_INVOCATION = 3;

export async function processPendingEvents(): Promise<void> {
  console.log("[sync] starting processPendingEvents");
  const lockedFileIds: string[] = [];

  for (let i = 0; i < MAX_EVENTS_PER_INVOCATION; i++) {
    const event = await EventsModel.findNextEligible(lockedFileIds);
    console.log(`[sync] iteration ${i}, event:`, event?._id ?? "none");
    if (!event) break;

    lockedFileIds.push(event.fileId);

    try {
      await EventsModel.markProcessing(event._id);
      console.log(`[sync] processing event ${event._id}, type: ${event.type}, fileId: ${event.fileId}`);
      const result = await processEvent(event);
      console.log(`[sync] event ${event._id} result:`, JSON.stringify(result));

      if (result.success) {
        await EventsModel.markProcessed(event._id);
      } else {
        await EventsModel.markFailed(event._id, result.error || "Unknown error");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[sync] event ${event._id} threw:`, errorMsg);
      await EventsModel.markFailed(event._id, errorMsg);
    }
  }
  console.log("[sync] done");
}
