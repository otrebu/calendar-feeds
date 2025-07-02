import { EventProvider } from "./types";

/**
 * Simple provider returning a single hard-coded event.
 */
export const dummyProvider: EventProvider = {
  /**
   * Return events for the given range. The dummy provider ignores the range
   * and always returns the same event.
   */
  async getEvents(_days?: number) {
    return [
      {
        id: "dummy-001",
        summary: "Dummy Match",
        start: new Date("2025-07-05T14:00:00Z"),
        end:   new Date("2025-07-05T16:00:00Z"),
        location: "Dream Stadium"
      }
    ];
  }
};
