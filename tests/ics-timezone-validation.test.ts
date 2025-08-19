import { expect, test } from "vitest";
import { toZonedTime } from 'date-fns-tz';
import { buildCalendar } from "../src/calendar";
import { ICalEventData } from "ical-generator";

const TIMEZONE = 'Europe/Jersey';

test("validate ICS calendar output for summer time", () => {
  // Create a summer time event (July when BST is active)
  const summerUtc = new Date('2025-07-08T06:00:00Z'); // 6 AM UTC in July
  const summerLocal = toZonedTime(summerUtc, TIMEZONE); // Should be 7 AM local BST
  
  const event: ICalEventData = {
    id: `tide-${summerUtc.toISOString()}`,
    summary: "High Tide 10.0 m",
    start: summerLocal,
    end: new Date(summerLocal.getTime() + 60000), // 1 minute later
    description: "Height: 10.0 m",
    location: "St Helier, Jersey",
    timezone: TIMEZONE
  };
  
  const icsContent = buildCalendar([event], TIMEZONE, "test-tides");
  
  console.log('Generated ICS content:');
  console.log(icsContent);
  
  // Verify the ICS contains the correct timezone
  expect(icsContent).toContain('TIMEZONE-ID:Europe/Jersey');
  expect(icsContent).toContain('X-WR-TIMEZONE:Europe/Jersey');
  
  // Check if the time appears correctly in the ICS
  // In BST, 6 AM UTC should appear as 7 AM local time (07:00)
  expect(icsContent).toContain('20250708T070000');
});

test("validate ICS calendar output for winter time", () => {
  // Create a winter time event (January when GMT is active)
  const winterUtc = new Date('2025-01-08T06:00:00Z'); // 6 AM UTC in January
  const winterLocal = toZonedTime(winterUtc, TIMEZONE); // Should be 6 AM local GMT
  
  const event: ICalEventData = {
    id: `tide-${winterUtc.toISOString()}`,
    summary: "High Tide 10.0 m",
    start: winterLocal,
    end: new Date(winterLocal.getTime() + 60000), // 1 minute later
    description: "Height: 10.0 m",
    location: "St Helier, Jersey",
    timezone: TIMEZONE
  };
  
  const icsContent = buildCalendar([event], TIMEZONE, "test-tides");
  
  console.log('Generated ICS content for winter:');
  console.log(icsContent);
  
  // Check if the time appears correctly in the ICS
  // In GMT, 6 AM UTC should appear as 6 AM local time (06:00)
  expect(icsContent).toContain('20250108T060000');
});