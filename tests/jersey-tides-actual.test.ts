import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { jerseyTideProvider } from "../src/providers/jersey-tides";
import { buildCalendar } from "../src/calendar";
import { toZonedTime } from 'date-fns-tz';

// Mock node-fetch
vi.mock('node-fetch', () => ({
  default: vi.fn()
}));

// Mock logger
vi.mock('../src/logger', () => ({
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

const mockFetch = fetch as any;
const TIMEZONE = 'Europe/Jersey';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-07-08T00:00:00Z"));
  vi.clearAllMocks();
  process.env.STORM_TOKEN = "test-token";
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

test("validate jersey tide provider event structure in summer time", async () => {
  const mockTideResponse = {
    data: [
      {
        time: "2025-07-08T06:00:00Z", // 6 AM UTC in summer (July)
        type: "high",
        height: 4.0
      }
    ]
  };
  
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockTideResponse
  });

  const events = await jerseyTideProvider.getEvents(1);
  
  console.log('Events from provider:', JSON.stringify(events, null, 2));
  
  expect(events).toHaveLength(1);
  const event = events[0];
  
  // Check the start time is correctly converted to local time
  const expectedLocal = toZonedTime(new Date("2025-07-08T06:00:00Z"), TIMEZONE);
  console.log('Expected local time:', expectedLocal);
  console.log('Actual event start:', event.start);
  console.log('Expected hours:', expectedLocal.getHours());
  console.log('Actual hours:', (event.start as Date).getHours());
  
  // In BST (summer), 6 AM UTC should become 7 AM local
  expect((event.start as Date).getHours()).toBe(7);
  
  // Now test the ICS generation
  const icsContent = buildCalendar(events, TIMEZONE, "tides");
  console.log('Generated ICS from real provider:');
  console.log(icsContent);
  
  // Check if timezone is properly set
  expect(icsContent).toContain('TZID=Europe/Jersey');
});