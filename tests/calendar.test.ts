import { expect, test } from "vitest";
import { buildCalendar, loadCalendar, coverageDays } from "../src/calendar";
import { dummyProvider } from "../src/providers/dummy";
import { writeFileSync, rmSync } from "node:fs";
import { addMinutes, addDays, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

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

test("coverageDays counts future range", () => {
  const tz = "Europe/Jersey";
  const today = startOfDay(toZonedTime(new Date(), tz));
  const events = [
    {
      id: "1",
      summary: "a",
      start: today,
      end: addMinutes(today, 1),
      location: "here"
    },
    {
      id: "2",
      summary: "b",
      start: addDays(today, 10),
      end: addMinutes(addDays(today, 10), 1),
      location: "here"
    }
  ];
  expect(coverageDays(events, tz)).toBe(11);
});
