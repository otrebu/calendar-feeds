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
  vi.setSystemTime(new Date("2025-07-08T00:00:00Z")); // July 8, 2025 - summer time
  vi.clearAllMocks();
  process.env.STORM_TOKEN = "test-token";
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

test("comprehensive summer time test - jersey provider to ICS", async () => {
  // Mock API response with summer time data
  const mockTideResponse = {
    data: [
      {
        time: "2025-07-08T06:00:00Z", // 6 AM UTC in July (summer)
        type: "high", 
        height: 4.0
      },
      {
        time: "2025-07-08T12:30:00Z", // 12:30 PM UTC in July (summer)
        type: "low",
        height: 1.5
      }
    ]
  };
  
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockTideResponse
  });

  // Get events from the provider
  const events = await jerseyTideProvider.getEvents(1);
  
  console.log('\\n=== SUMMER TIME ANALYSIS ===');
  console.log('System time (fake):', new Date().toISOString());
  
  events.forEach((event, i) => {
    const apiTime = mockTideResponse.data[i].time;
    const expectedLocal = toZonedTime(new Date(apiTime), TIMEZONE);
    
    console.log(`\\nEvent ${i + 1}:`);
    console.log('  API UTC time:', apiTime);
    console.log('  Expected local time:', expectedLocal.toISOString());
    console.log('  Event start time:', (event.start as Date).toISOString());
    console.log('  UTC hours:', new Date(apiTime).getHours());
    console.log('  Expected local hours:', expectedLocal.getHours());
    console.log('  Actual event hours:', (event.start as Date).getHours());
    console.log('  Timezone property:', event.timezone);
  });
  
  // Verify the times are correctly converted to BST
  expect((events[0].start as Date).getHours()).toBe(7); // 6 AM UTC + 1 hour BST = 7 AM local
  expect((events[1].start as Date).getHours()).toBe(13); // 12:30 PM UTC + 1 hour BST = 1:30 PM local
  
  // Generate the ICS calendar using the exact same flow as production
  const icsContent = buildCalendar(events, TIMEZONE, "tides");
  
  console.log('\\n=== GENERATED ICS CONTENT ===');
  console.log(icsContent);
  
  // Verify timezone is properly set at calendar level
  expect(icsContent).toContain('TIMEZONE-ID:Europe/Jersey');
  expect(icsContent).toContain('X-WR-TIMEZONE:Europe/Jersey');
  
  // Verify individual events have TZID parameter (this is the crucial test!)
  expect(icsContent).toContain('DTSTART;TZID=Europe/Jersey:20250708T070000');
  expect(icsContent).toContain('DTSTART;TZID=Europe/Jersey:20250708T133000');
  
  // Verify the ICS does NOT contain timezone-less start times
  expect(icsContent).not.toMatch(/DTSTART:20250708T0[67]0000$/);
  
  console.log('\\n=== TEST CONCLUSION ===');
  console.log('✅ All timezone validations passed');
});

test("winter time comparison test", async () => {
  // Set system time to winter
  vi.setSystemTime(new Date("2025-01-08T00:00:00Z")); // January 8, 2025 - winter time
  
  const mockTideResponse = {
    data: [
      {
        time: "2025-01-08T06:00:00Z", // 6 AM UTC in January (winter)
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
  
  console.log('\\n=== WINTER TIME ANALYSIS ===');
  console.log('System time (fake):', new Date().toISOString());
  console.log('API UTC time:', mockTideResponse.data[0].time);
  console.log('Event start time:', (events[0].start as Date).toISOString());
  console.log('UTC hours:', 6);
  console.log('Event hours:', (events[0].start as Date).getHours());
  
  // In winter (GMT), 6 AM UTC should remain 6 AM local
  expect((events[0].start as Date).getHours()).toBe(6);
  
  const icsContent = buildCalendar(events, TIMEZONE, "tides");
  
  console.log('\\n=== WINTER ICS CONTENT ===');
  console.log(icsContent);
  
  // Verify winter time has correct TZID
  expect(icsContent).toContain('DTSTART;TZID=Europe/Jersey:20250108T060000');
  
  console.log('\\n=== WINTER TEST CONCLUSION ===');
  console.log('✅ Winter timezone handling correct');
});