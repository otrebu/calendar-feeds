import { expect, test, beforeEach, afterEach } from "vitest";
import { rmSync, existsSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { run } from "../src/cli";
import { dummyProvider } from "../src/providers/dummy";
import { buildCalendar } from "../src/calendar";

// Integration tests - these test the actual functionality without mocking

beforeEach(() => {
  // Clean up any test files
  const testFiles = ["integration-test.ics", "integration-empty.ics"];
  testFiles.forEach(file => {
    if (existsSync(file)) {
      rmSync(file);
    }
  });
  
  // Ensure logs directory exists
  const logsDir = join(process.cwd(), "logs");
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir);
  }
});

afterEach(() => {
  // Clean up test files
  const testFiles = ["integration-test.ics", "integration-empty.ics"];
  testFiles.forEach(file => {
    if (existsSync(file)) {
      rmSync(file);
    }
  });
});

test("end-to-end calendar generation with dummy provider", async () => {
  const events = await dummyProvider.getEvents();
  const calendarContent = buildCalendar(events, "Europe/Jersey", "dummy");
  
  expect(calendarContent).toContain("BEGIN:VCALENDAR");
  expect(calendarContent).toContain("END:VCALENDAR");
  expect(calendarContent).toContain("Dummy Match");
  expect(calendarContent).toContain("Dream Stadium");
  expect(calendarContent).toContain("Europe/Jersey");
});

test("calendar generation creates valid ICS format", async () => {
  const events = await dummyProvider.getEvents();
  const calendarContent = buildCalendar(events, "Europe/Jersey", "test-calendar");
  
  // Check ICS format structure
  expect(calendarContent).toMatch(/BEGIN:VCALENDAR/);
  expect(calendarContent).toMatch(/VERSION:2.0/);
  expect(calendarContent).toMatch(/PRODID:/);
  expect(calendarContent).toMatch(/BEGIN:VEVENT/);
  expect(calendarContent).toMatch(/END:VEVENT/);
  expect(calendarContent).toMatch(/END:VCALENDAR/);
  
  // Check event properties
  expect(calendarContent).toMatch(/SUMMARY:Dummy Match/);
  expect(calendarContent).toMatch(/LOCATION:Dream Stadium/);
  expect(calendarContent).toMatch(/DTSTART:/);
  expect(calendarContent).toMatch(/DTEND:/);
  expect(calendarContent).toMatch(/UID:dummy-001/);
});

test("calendar generation with multiple events", async () => {
  const multipleEvents = [
    {
      id: "event-1",
      summary: "First Event",
      start: new Date("2025-07-08T10:00:00Z"),
      end: new Date("2025-07-08T11:00:00Z"),
      location: "Location 1"
    },
    {
      id: "event-2", 
      summary: "Second Event",
      start: new Date("2025-07-08T14:00:00Z"),
      end: new Date("2025-07-08T15:00:00Z"),
      location: "Location 2"
    }
  ];
  
  const calendarContent = buildCalendar(multipleEvents, "Europe/London", "multi-event");
  
  // Should contain both events
  expect(calendarContent).toContain("First Event");
  expect(calendarContent).toContain("Second Event");
  expect(calendarContent).toContain("Location 1");
  expect(calendarContent).toContain("Location 2");
  
  // Should have two VEVENT blocks
  const eventBlocks = calendarContent.match(/BEGIN:VEVENT/g);
  expect(eventBlocks).toHaveLength(2);
});

test("calendar generation without timezone", async () => {
  const events = await dummyProvider.getEvents();
  const calendarContent = buildCalendar(events);
  
  expect(calendarContent).toContain("BEGIN:VCALENDAR");
  expect(calendarContent).toContain("Dummy Match");
  expect(calendarContent).not.toContain("Europe/Jersey");
});

test("calendar generation with custom name", async () => {
  const events = await dummyProvider.getEvents();
  const calendarContent = buildCalendar(events, undefined, "custom-calendar");
  
  expect(calendarContent).toContain("custom-calendar");
});