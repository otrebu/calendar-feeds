import { expect, test } from "vitest";
import ical from "node-ical";
import { buildCalendar } from "../src/calendar";
import { dummyProvider } from "../src/providers/dummy";

test("dummy provider returns one event", async () => {
  const events = await dummyProvider.getEvents();
  const text = buildCalendar(events);
  expect(text).includes("Dummy Match");
});
