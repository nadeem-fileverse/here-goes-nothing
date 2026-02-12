import { EventsModel, processEvent } from "@fileverse/api/cloudflare";

const MAX_EVENTS_PER_INVOCATION = 3;

export async function processPendingEvents(): Promise<void> {
  const lockedFileIds: string[] = [];

  for (let i = 0; i < MAX_EVENTS_PER_INVOCATION; i++) {
    const event = await EventsModel.findNextEligible(lockedFileIds);
    if (!event) break;

    lockedFileIds.push(event.fileId);

    try {
      await EventsModel.markProcessing(event._id);
      const result = await processEvent(event);

      if (result.success) {
        await EventsModel.markProcessed(event._id);
      } else {
        await EventsModel.markFailed(event._id, result.error || "Unknown error");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await EventsModel.markFailed(event._id, errorMsg);
    }
  }
}
