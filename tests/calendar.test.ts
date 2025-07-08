import { expect, test } from "vitest";
import { buildCalendar, loadCalendar } from "../src/calendar";
import { dummyProvider } from "../src/providers/dummy";
import { calculateFetchDays } from "../src/cli";
import { writeFileSync, rmSync } from "node:fs";

test("dummy provider returns one event", async () => {
  const events = await dummyProvider.getEvents();
  const text = buildCalendar(events, undefined, "dummy");
  expect(text).includes("Dummy Match");
});

test("loadCalendar parses existing events", async () => {
  const events = await dummyProvider.getEvents();
  const file = "tmp.ics";
  writeFileSync(file, buildCalendar(events, undefined, "dummy"));
  const parsed = loadCalendar(file);
  expect(parsed.length).toBe(1);
  expect(parsed[0].summary).toBe("Dummy Match");
  rmSync(file);
});

test("cli extends coverage to at least 34 days", () => {
  const now = new Date();
  const existing = [
    {
      id: "x",
      summary: "future",
      start: now,
      end: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000)
    }
  ];
  const { fetch } = calculateFetchDays(7, existing);
  expect(fetch).toBeGreaterThanOrEqual(34);
  expect(fetch).toBeLessThanOrEqual(40);
});
