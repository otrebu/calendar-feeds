import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { calculateFetchDays, MIN_COVERAGE, MAX_COVERAGE, run } from "../src/cli";
import { ICalEventData } from "ical-generator";

// Mock dependencies
vi.mock("../src/providers", () => ({
  loadProvider: vi.fn()
}));

vi.mock("../src/calendar", () => ({
  buildCalendar: vi.fn(() => "mocked-calendar-content"),
  loadCalendar: vi.fn(() => [])
}));

vi.mock("../src/logger", () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
  },
  logDir: "/tmp/test-logs"
}));

vi.mock("node:fs", () => ({
  writeFileSync: vi.fn()
}));

vi.mock("commander", () => ({
  Command: vi.fn(() => ({
    name: vi.fn().mockReturnThis(),
    option: vi.fn().mockReturnThis(),
    parse: vi.fn().mockReturnThis(),
    opts: vi.fn(() => ({
      provider: "dummy",
      days: "7",
      nuke: false
    }))
  }))
}));

import { loadProvider } from "../src/providers";
import { buildCalendar, loadCalendar } from "../src/calendar";
import { writeFileSync } from "node:fs";

const mockLoadProvider = loadProvider as any;
const mockBuildCalendar = buildCalendar as any;
const mockLoadCalendar = loadCalendar as any;
const mockWriteFileSync = writeFileSync as any;

beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock console methods
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
});

afterEach(() => {
  vi.resetAllMocks();
});

test("calculateFetchDays with existing events", () => {
  const now = new Date();
  const existing: ICalEventData[] = [
    {
      id: "test-1",
      summary: "Test Event",
      start: now,
      end: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
    }
  ];
  
  const result = calculateFetchDays(7, existing);
  
  expect(result.coverage).toBe(10);
  expect(result.target).toBe(24); // coverage + MIN_COVERAGE
  expect(result.fetch).toBe(24);
});

test("calculateFetchDays with no existing events", () => {
  const result = calculateFetchDays(7, []);
  
  expect(result.coverage).toBe(0);
  expect(result.target).toBe(MIN_COVERAGE);
  expect(result.fetch).toBe(MIN_COVERAGE);
});

test("calculateFetchDays respects MAX_COVERAGE", () => {
  const now = new Date();
  const existing: ICalEventData[] = [
    {
      id: "test-1",
      summary: "Test Event",
      start: now,
      end: new Date(now.getTime() + 50 * 24 * 60 * 60 * 1000)
    }
  ];
  
  const result = calculateFetchDays(7, existing);
  
  expect(result.coverage).toBe(50);
  expect(result.target).toBe(MAX_COVERAGE);
  expect(result.fetch).toBe(MAX_COVERAGE);
});

test("calculateFetchDays uses requested days when higher than target", () => {
  const now = new Date();
  const existing: ICalEventData[] = [
    {
      id: "test-1",
      summary: "Test Event",
      start: now,
      end: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
    }
  ];
  
  const result = calculateFetchDays(30, existing);
  
  expect(result.coverage).toBe(5);
  expect(result.target).toBe(19); // coverage + MIN_COVERAGE
  expect(result.fetch).toBe(30); // requested days is higher
});

test("calculateFetchDays handles events with only start date", () => {
  const now = new Date();
  const existing: ICalEventData[] = [
    {
      id: "test-1",
      summary: "Test Event",
      start: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
      // No end date
    }
  ];
  
  const result = calculateFetchDays(7, existing);
  
  expect(result.coverage).toBe(5);
  expect(result.target).toBe(19);
  expect(result.fetch).toBe(19);
});

test("run function executes successfully", async () => {
  const mockProvider = {
    getEvents: vi.fn().mockResolvedValue([
      {
        id: "test-1",
        summary: "Test Event",
        start: new Date(),
        end: new Date()
      }
    ])
  };
  
  mockLoadProvider.mockReturnValue(mockProvider);
  mockLoadCalendar.mockReturnValue([]);
  
  await run();
  
  expect(mockLoadProvider).toHaveBeenCalledWith("dummy");
  expect(mockProvider.getEvents).toHaveBeenCalled();
  expect(mockBuildCalendar).toHaveBeenCalled();
  expect(mockWriteFileSync).toHaveBeenCalledWith(
    "dummy.ics",
    "mocked-calendar-content"
  );
  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining("📅  added 1 new events")
  );
});

test("run function handles provider errors", async () => {
  const mockProvider = {
    getEvents: vi.fn().mockRejectedValue(new Error("Provider error"))
  };
  
  mockLoadProvider.mockReturnValue(mockProvider);
  mockLoadCalendar.mockReturnValue([]);
  
  await run();
  
  expect(console.error).toHaveBeenCalledWith(
    expect.stringContaining("❌ Failed to generate calendar")
  );
  expect(process.exit).toHaveBeenCalledWith(1);
});