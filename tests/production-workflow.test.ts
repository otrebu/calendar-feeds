import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { jerseyTideProvider } from "../src/providers/jersey-tides";
import { buildCalendar, loadCalendar } from "../src/calendar";
import { writeFileSync, unlinkSync, existsSync } from "node:fs";

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

// Mock fs for the provider's file writing, but allow our test to write real files
const originalWriteFileSync = writeFileSync;
vi.mock('node:fs', async () => {
  const actual = await vi.importActual('node:fs');
  return {
    ...actual,
    writeFileSync: vi.fn(),
  };
});

import fetch from 'node-fetch';

const mockFetch = fetch as any;
const TIMEZONE = 'Europe/Jersey';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-07-15T00:00:00Z")); // July 15, 2025 - summer time
  vi.clearAllMocks();
  process.env.STORM_TOKEN = "test-token";
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

test("end-to-end production workflow simulation - summer time fix", async () => {
  const testFile = '/tmp/production-test-tides.ics';
  
  // Clean up any existing test file
  if (existsSync(testFile)) {
    unlinkSync(testFile);
  }
  
  // === STEP 1: Simulate initial calendar generation ===
  console.log('\\n=== STEP 1: Initial calendar generation ===');
  
  const initialMockResponse = {
    data: [
      {
        time: "2025-07-15T03:39:00Z", // 3:39 AM UTC in July (matches real tides.ics)
        type: "low",
        height: 1.0 // Will become ~7.0m with offset
      },
      {
        time: "2025-07-15T09:16:00Z", // 9:16 AM UTC in July
        type: "high", 
        height: 4.4 // Will become ~10.4m with offset
      }
    ]
  };
  
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => initialMockResponse
  });
  
  const initialEvents = await jerseyTideProvider.getEvents(1);
  console.log('Initial events from provider:');
  initialEvents.forEach(event => {
    const apiTime = initialMockResponse.data.find(d => event.id.includes(d.time));
    console.log(`  API: ${apiTime?.time} → Event: ${(event.start as Date).toISOString()} (${(event.start as Date).getHours()}:${(event.start as Date).getMinutes().toString().padStart(2, '0')})`);
  });
  
  // Generate initial ICS file
  const initialIcs = buildCalendar(initialEvents, TIMEZONE, "tides");
  originalWriteFileSync(testFile, initialIcs);
  
  console.log('Initial ICS content:');
  console.log(initialIcs);
  
  // === STEP 2: Simulate loading existing calendar (like in production) ===
  console.log('\\n=== STEP 2: Load existing calendar ===');
  
  const loadedEvents = loadCalendar(testFile);
  console.log('Loaded events:');
  loadedEvents.forEach(event => {
    console.log(`  ID: ${event.id}`);
    console.log(`  Start: ${(event.start as Date).toISOString()} (${(event.start as Date).getHours()}:${(event.start as Date).getMinutes().toString().padStart(2, '0')})`);
    console.log(`  Timezone: ${event.timezone}`);
  });
  
  // === STEP 3: Simulate adding new events (like production workflow) ===
  console.log('\\n=== STEP 3: Add new events ===');
  
  const newMockResponse = {
    data: [
      {
        time: "2025-07-16T04:18:00Z", // Next day events
        type: "low",
        height: 1.2
      }
    ]
  };
  
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => newMockResponse
  });
  
  const newEvents = await jerseyTideProvider.getEvents(1, 1); // offset by 1 day
  console.log('New events from provider:');
  newEvents.forEach(event => {
    console.log(`  API: ${newMockResponse.data[0].time} → Event: ${(event.start as Date).toISOString()} (${(event.start as Date).getHours()}:${(event.start as Date).getMinutes().toString().padStart(2, '0')})`);
  });
  
  // === STEP 4: Merge existing + new events (production workflow) ===
  console.log('\\n=== STEP 4: Merge events ===');
  
  const seen = new Set(loadedEvents.map(e => e.id));
  const fresh = newEvents.filter(e => !seen.has(e.id));
  const allEvents = [...loadedEvents, ...fresh];
  
  console.log(`Total events: ${allEvents.length} (${loadedEvents.length} existing + ${fresh.length} new)`);
  
  // === STEP 5: Generate final ICS ===
  console.log('\\n=== STEP 5: Generate final ICS ===');
  
  const finalIcs = buildCalendar(allEvents, TIMEZONE, "tides");
  originalWriteFileSync(testFile, finalIcs);
  
  console.log('Final ICS content:');
  console.log(finalIcs);
  
  // === VERIFICATION ===
  console.log('\\n=== VERIFICATION ===');
  
  // Verify all events have proper TZID in final ICS
  const hasAllTzid = allEvents.every(event => {
    const eventStr = finalIcs.substring(finalIcs.indexOf(`UID:${event.id}`));
    const nextEvent = eventStr.indexOf('UID:', 1);
    const eventBlock = nextEvent > 0 ? eventStr.substring(0, nextEvent) : eventStr;
    return eventBlock.includes('TZID=Europe/Jersey');
  });
  
  expect(hasAllTzid).toBe(true);
  
  // Verify specific summer time conversion
  // 3:39 AM UTC should appear as 4:39 AM BST in the ICS
  expect(finalIcs).toContain('DTSTART;TZID=Europe/Jersey:20250715T043900');
  // 9:16 AM UTC should appear as 10:16 AM BST in the ICS  
  expect(finalIcs).toContain('DTSTART;TZID=Europe/Jersey:20250715T101600');
  
  console.log('✅ Summer time conversion verified!');
  console.log('✅ TZID preservation verified!');
  console.log('✅ Production workflow simulation successful!');
  
  // Clean up
  unlinkSync(testFile);
});