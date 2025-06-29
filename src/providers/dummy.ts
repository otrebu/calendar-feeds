import { EventProvider } from "./types";

export const dummyProvider: EventProvider = {
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
