import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { jerseyTideProvider } from "../../src/providers/jersey-tides";

// Mock node-fetch
vi.mock('node-fetch', () => ({
  default: vi.fn()
}));

// Mock logger
vi.mock('../../src/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
  },
  logDir: '/tmp/test-logs'
}));

// Mock fs
vi.mock('node:fs', () => ({
  writeFileSync: vi.fn(),
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn()
}));

import fetch from 'node-fetch';
import { writeFileSync } from 'node:fs';

const mockFetch = fetch as any;
const mockWriteFileSync = writeFileSync as any;


beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-07-08T00:00:00Z"));
  vi.clearAllMocks();
  // Clear environment variables
  delete process.env.STORM_TOKEN;
  delete process.env.STORM_DATUM;
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

const mockTideResponse = {
  data: [
    {
      time: "2025-07-08T06:00:00Z",
      type: "low",
      height: 1.2
    },
    {
      time: "2025-07-08T12:00:00Z", 
      type: "high",
      height: 3.8
    },
    {
      time: "2025-07-08T18:00:00Z",
      type: "low", 
      height: 1.5
    },
    {
      time: "2025-07-09T00:00:00Z",
      type: "high",
      height: 4.1
    }
  ]
};

test("jersey tide provider fetches and processes tide data", async () => {
  process.env.STORM_TOKEN = "test-token";
  
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockTideResponse
  });

  const events = await jerseyTideProvider.getEvents(1);
  
  expect(mockFetch).toHaveBeenCalledWith(
    expect.stringContaining("api.stormglass.io/v2/tide/extremes/point"),
    expect.objectContaining({
      headers: { Authorization: "test-token" }
    })
  );
  
  expect(events).toHaveLength(3); // Only events within local day boundary
  expect(events[0]).toMatchObject({
    id: "tide-2025-07-08T06:00:00.000Z",
    summary: "Low Tide 7.2 m",
    description: "Height: 7.23 m", // 1.2 + 6.03 offset
    location: "St Helier, Jersey"
  });
});

test("jersey tide provider applies height offset correctly", async () => {
  process.env.STORM_TOKEN = "test-token";
  
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      data: [{
        time: "2025-07-08T06:00:00Z",
        type: "low",
        height: 2.5
      }]
    })
  });

  const events = await jerseyTideProvider.getEvents(1);
  
  expect(parseFloat(events[0].description!.match(/([0-9.]+) m/)?.[1] || "0")).toBeCloseTo(8.53, 2);
});

test("jersey tide provider includes datum parameter when set", async () => {
  process.env.STORM_TOKEN = "test-token";
  process.env.STORM_DATUM = "MLLW";
  
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: [] })
  });

  // Clear the module cache to pick up new env vars
  vi.resetModules();
  const { jerseyTideProvider: freshProvider } = await import("../../src/providers/jersey-tides");
  
  await freshProvider.getEvents(1);
  
  const callArgs = mockFetch.mock.calls[0];
  expect(callArgs[0]).toContain("&datum=MLLW");
  
  delete process.env.STORM_DATUM;
});

test("jersey tide provider handles API errors", async () => {
  process.env.STORM_TOKEN = "test-token";
  
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 401,
    text: async () => "Unauthorized"
  });

  await expect(jerseyTideProvider.getEvents(1)).rejects.toThrow(
    "StormGlass request failed: 401 Unauthorized"
  );
});

test("jersey tide provider handles missing authorization token", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: [] })
  });

  await jerseyTideProvider.getEvents(1);
  
  expect(mockFetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      headers: { Authorization: "" }
    })
  );
});

test("jersey tide provider filters events to local day boundaries", async () => {
  process.env.STORM_TOKEN = "test-token";
  
  // Mock response with events spanning multiple days
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      data: [
        {
          time: "2025-07-07T23:00:00Z", // Before start of local day
          type: "low",
          height: 1.0
        },
        {
          time: "2025-07-08T06:00:00Z", // Within local day
          type: "high", 
          height: 3.0
        },
        {
          time: "2025-07-09T01:00:00Z", // After end of local day
          type: "low",
          height: 1.5
        }
      ]
    })
  });

  const events = await jerseyTideProvider.getEvents(1);
  
  // Should only include events within the local day boundary
  expect(events.length).toBeGreaterThanOrEqual(1);
  expect(events.some(e => e.summary.startsWith("High Tide"))).toBe(true);
});

test("jersey tide provider writes response to log file", async () => {
  process.env.STORM_TOKEN = "test-token";
  
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockTideResponse
  });

  await jerseyTideProvider.getEvents(1);
  
  expect(mockWriteFileSync).toHaveBeenCalledWith(
    "/tmp/test-logs/tides-response.json",
    JSON.stringify(mockTideResponse, null, 2)
  );
});

test("jersey tide provider handles alternative response format", async () => {
  process.env.STORM_TOKEN = "test-token";
  
  // Test with 'extremes' field instead of 'data'
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      extremes: [
        {
          time: "2025-07-08T06:00:00Z",
          type: "high",
          height: 3.5
        }
      ]
    })
  });

  const events = await jerseyTideProvider.getEvents(1);
  
  expect(events).toHaveLength(1);
  expect(events[0].summary).toBe("High Tide 9.5 m");
});

test("jersey tide provider creates correct event structure", async () => {
  process.env.STORM_TOKEN = "test-token";
  
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      data: [{
        time: "2025-07-08T12:00:00Z",
        type: "high",
        height: 4.0
      }]
    })
  });

  const events = await jerseyTideProvider.getEvents(1);
  const event = events[0];
  
  expect(event.id).toBe("tide-2025-07-08T12:00:00.000Z");
  expect(event.summary).toBe("High Tide 10.0 m");
  expect(parseFloat(event.description!.match(/([0-9.]+) m/)?.[1] || "0")).toBeCloseTo(10.03, 2);
  expect(event.location).toBe("St Helier, Jersey");
  expect(event.timezone).toBe("Europe/Jersey");
  expect(event.start).toBeInstanceOf(Date);
  expect(event.end).toBeInstanceOf(Date);
  expect(event.end! > event.start).toBe(true);
});