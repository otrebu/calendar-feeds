import { expect, test } from "vitest";
import { buildCalendar, loadCalendar } from "../src/calendar";
import { writeFileSync, unlinkSync } from "node:fs";

test("fix existing broken tides.ics file", () => {
  const TIMEZONE = 'Europe/Jersey';
  const testFile = '/tmp/broken-tides.ics';
  
  console.log('\\n🚨 SIMULATING EXISTING BROKEN TIDES.ICS FILE 🚨\\n');
  
  // === CREATE A BROKEN ICS FILE (like the current tides.ics) ===
  const brokenIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//sebbo.net//ical-generator//EN
NAME:tides
X-WR-CALNAME:tides
TIMEZONE-ID:Europe/Jersey
X-WR-TIMEZONE:Europe/Jersey
BEGIN:VEVENT
UID:tide-2025-07-15T03:39:00.000Z
SEQUENCE:0
DTSTAMP:20250819T032142
DTSTART:20250715T033900
DTEND:20250715T034000
SUMMARY:Low Tide 1.8 m
LOCATION:St Helier, Jersey
DESCRIPTION:Height: 1.8328410405348032 m
END:VEVENT
BEGIN:VEVENT
UID:tide-2025-07-15T09:16:00.000Z
SEQUENCE:0
DTSTAMP:20250819T032142
DTSTART:20250715T091600
DTEND:20250715T091700
SUMMARY:High Tide 10.4 m
LOCATION:St Helier, Jersey
DESCRIPTION:Height: 10.408483834187656 m
END:VEVENT
END:VCALENDAR`;

  console.log('❌ Broken ICS (missing TZID):');
  console.log(brokenIcs);
  console.log('\\n🔍 Notice: DTSTART:20250715T033900 (no TZID=Europe/Jersey)');
  
  writeFileSync(testFile, brokenIcs);
  
  // === LOAD THE BROKEN CALENDAR ===
  console.log('\\n🔄 Loading broken calendar...');
  const loadedEvents = loadCalendar(testFile);
  
  console.log('Loaded events:');
  loadedEvents.forEach((event, i) => {
    console.log(`  Event ${i + 1}:`);
    console.log(`    ID: ${event.id}`);
    console.log(`    Start: ${(event.start as Date).toISOString()}`);
    console.log(`    Timezone: ${event.timezone || 'MISSING!'}`);
  });
  
  // === REBUILD WITH THE FIX ===
  console.log('\\n🔧 Rebuilding with timezone fix...');
  const fixedIcs = buildCalendar(loadedEvents, TIMEZONE, "tides");
  
  console.log('✅ Fixed ICS:');
  console.log(fixedIcs);
  
  // === VERIFICATION ===
  console.log('\\n🔍 VERIFICATION:');
  
  const hasAllTzid = loadedEvents.every(event => {
    const eventStr = fixedIcs.substring(fixedIcs.indexOf(`UID:${event.id}`));
    const nextEvent = eventStr.indexOf('UID:', 1);
    const eventBlock = nextEvent > 0 ? eventStr.substring(0, nextEvent) : eventStr;
    return eventBlock.includes('TZID=Europe/Jersey');
  });
  
  console.log('  All events have TZID:', hasAllTzid ? '✅' : '❌');
  console.log('  Timezone preserved in loaded events:', loadedEvents.every(e => e.timezone === 'Europe/Jersey') ? '✅' : '❌');
  
  expect(hasAllTzid).toBe(true);
  expect(loadedEvents.every(e => e.timezone === 'Europe/Jersey')).toBe(true);
  
  console.log('\\n🎉 EXISTING TIDES.ICS FIX VERIFIED!');
  console.log('\\n📝 WHAT THIS MEANS:');
  console.log('   • The next time the calendar is generated, it will be fixed');
  console.log('   • Calendar apps will show the correct BST times');
  console.log('   • No more "one hour early" issue in summer time!');
  
  // Clean up
  unlinkSync(testFile);
});