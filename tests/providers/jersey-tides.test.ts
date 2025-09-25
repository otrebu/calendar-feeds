import { addDays, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { jerseyTideProvider } from "../../src/providers/jersey-tides";

const TIMEZONE = "Europe/Jersey";

vi.mock("../../src/logger", () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
  },
  logDir: "/tmp/test-logs"
}));

vi.mock("node:fs", () => ({
  writeFileSync: vi.fn(),
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn()
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-07-08T00:00:00Z"));
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

test("jersey tide provider generates harmonic tide events", async () => {
  const events = await jerseyTideProvider.getEvents(1);

  expect(events).toHaveLength(3);
  expect(events.map((ev) => ev.summary)).toEqual([
    "High Tide 8.3 m",
    "Low Tide 3.5 m",
    "High Tide 9.2 m"
  ]);

  const startLocal = startOfDay(toZonedTime(new Date(), TIMEZONE));
  const endLocal = addDays(startLocal, 1);

  for (const event of events) {
    expect(event.location).toBe("St Helier, Jersey");
    expect(event.timezone).toBe(TIMEZONE);
    expect(event.description).toMatch(/Height: [0-9]+\.[0-9]{2} m/);

    const start = event.start as Date;
    expect(start.getTime()).toBeGreaterThanOrEqual(startLocal.getTime());
    expect(start.getTime()).toBeLessThan(endLocal.getTime());
  }
});

test("jersey tide provider returns sorted events for multiple days", async () => {
  const events = await jerseyTideProvider.getEvents(3);

  expect(events.length).toBeGreaterThan(0);
  const starts = events.map((ev) => (ev.start as Date).getTime());
  const sortedStarts = [...starts].sort((a, b) => a - b);
  expect(starts).toEqual(sortedStarts);

  // verify highs and lows alternate across the range
  const prefixes = events.map((ev) => ev.summary.split(" ")[0]);
  expect(new Set(prefixes)).toEqual(new Set(["High", "Low"]));
});
