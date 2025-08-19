import { expect, test } from "vitest";
import { buildCalendar, loadCalendar } from "../src/calendar";
import { writeFileSync, unlinkSync } from "node:fs";
import { ICalEventData } from "ical-generator";

test("test calendar load/save cycle preserves timezone information", () => {
  const TIMEZONE = 'Europe/Jersey';
  
  // Create an event with proper timezone
  const originalEvent: ICalEventData = {
    id: "tide-2025-07-08T06:00:00.000Z",
    summary: "High Tide 10.0 m",
    start: new Date("2025-07-08T07:00:00.000Z"), // 7 AM BST 
    end: new Date("2025-07-08T07:01:00.000Z"),
    description: "Height: 10.0 m",
    location: "St Helier, Jersey",
    timezone: TIMEZONE
  };
  
  // Build calendar and save to file
  const icsContent = buildCalendar([originalEvent], TIMEZONE, "test-tides");
  console.log('Original ICS content:');
  console.log(icsContent);
  
  const testFile = '/tmp/test-tides.ics';
  writeFileSync(testFile, icsContent);
  
  // Load calendar back from file
  const loadedEvents = loadCalendar(testFile);
  console.log('\\nLoaded events:');
  console.log(JSON.stringify(loadedEvents, null, 2));
  
  // Check if loaded event has timezone information
  expect(loadedEvents).toHaveLength(1);
  const loadedEvent = loadedEvents[0];
  
  console.log('\\nLoaded event details:');
  console.log('ID:', loadedEvent.id);
  console.log('Start:', loadedEvent.start);
  console.log('Timezone property:', loadedEvent.timezone);
  console.log('Start hours:', (loadedEvent.start as Date).getHours());
  
  // Build calendar again from loaded events
  const rebuiltIcs = buildCalendar(loadedEvents, TIMEZONE, "test-tides");
  console.log('\\nRebuilt ICS content:');
  console.log(rebuiltIcs);
  
  // Check if rebuilt ICS still has timezone info
  expect(rebuiltIcs).toContain('TZID=Europe/Jersey');
  
  // Clean up
  unlinkSync(testFile);
});