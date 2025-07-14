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

test("buildCalendar with timezone", async () => {
  const events = await dummyProvider.getEvents();
  const text = buildCalendar(events, "Europe/London", "test-calendar");
  expect(text).toContain("Europe/London");
  expect(text).toContain("test-calendar");
});

test("buildCalendar without timezone", async () => {
  const events = await dummyProvider.getEvents();
  const text = buildCalendar(events);
  expect(text).toContain("calendar");
  expect(text).not.toContain("Europe/");
});

test("loadCalendar returns empty array for non-existent file", () => {
  const events = loadCalendar("non-existent-file.ics");
  expect(events).toEqual([]);
});

test("loadCalendar handles malformed ICS file", () => {
  const malformedFile = "malformed.ics";
  writeFileSync(malformedFile, "invalid ics content");
  
  const events = loadCalendar(malformedFile);
  expect(events).toEqual([]);
  
  rmSync(malformedFile);
});

test("loadCalendar handles empty ICS file", () => {
  const emptyFile = "empty.ics";
  writeFileSync(emptyFile, "");
  
  const events = loadCalendar(emptyFile);
  expect(events).toEqual([]);
  
  rmSync(emptyFile);
});

test("calculateFetchDays with no existing events", () => {
  const { coverage, target, fetch } = calculateFetchDays(7, []);
  expect(coverage).toBe(0);
  expect(target).toBe(14); // MIN_COVERAGE
  expect(fetch).toBe(14);
});

test("calculateFetchDays with existing events beyond max coverage", () => {
  const now = new Date();
  const existing = [
    {
      id: "x",
      summary: "future",
      start: now,
      end: new Date(now.getTime() + 50 * 24 * 60 * 60 * 1000) // 50 days ahead
    }
  ];
  const { coverage, target, fetch } = calculateFetchDays(7, existing);
  expect(coverage).toBe(50);
  expect(target).toBe(40); // MAX_COVERAGE
  expect(fetch).toBe(40);
});

test("calculateFetchDays respects requested days when higher than target", () => {
  const now = new Date();
  const existing = [
    {
      id: "x",
      summary: "future",
      start: now,
      end: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
    }
  ];
  const { coverage, target, fetch } = calculateFetchDays(30, existing);
  expect(coverage).toBe(10);
  expect(target).toBe(24); // coverage + MIN_COVERAGE
  expect(fetch).toBe(30); // requested days is higher
});
