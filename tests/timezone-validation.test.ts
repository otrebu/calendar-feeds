import { expect, test } from "vitest";
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Europe/Jersey';

test("validate timezone behavior in summer time (BST)", () => {
  // Test with a summer time date (July when BST is active)
  const summerUtc = new Date('2025-07-08T06:00:00Z'); // 6 AM UTC in July
  const summerLocal = toZonedTime(summerUtc, TIMEZONE);
  
  console.log('Summer time test:');
  console.log('UTC time:', summerUtc.toISOString());
  console.log('Local Jersey time:', summerLocal.toString());
  console.log('Local Jersey time (ISO):', summerLocal.toISOString());
  console.log('Local hours:', summerLocal.getHours());
  
  // In BST (summer), Jersey is UTC+1, so 6 AM UTC should be 7 AM local
  expect(summerLocal.getHours()).toBe(7);
});

test("validate timezone behavior in winter time (GMT)", () => {
  // Test with a winter time date (January when GMT is active)
  const winterUtc = new Date('2025-01-08T06:00:00Z'); // 6 AM UTC in January
  const winterLocal = toZonedTime(winterUtc, TIMEZONE);
  
  console.log('Winter time test:');
  console.log('UTC time:', winterUtc.toISOString());
  console.log('Local Jersey time:', winterLocal.toString());
  console.log('Local Jersey time (ISO):', winterLocal.toISOString());
  console.log('Local hours:', winterLocal.getHours());
  
  // In GMT (winter), Jersey is UTC+0, so 6 AM UTC should be 6 AM local
  expect(winterLocal.getHours()).toBe(6);
});

test("validate from and to timezone conversions", () => {
  // Test round-trip conversion
  const originalUtc = new Date('2025-07-08T06:00:00Z');
  const local = toZonedTime(originalUtc, TIMEZONE);
  const backToUtc = fromZonedTime(local, TIMEZONE);
  
  console.log('Round-trip test:');
  console.log('Original UTC:', originalUtc.toISOString());
  console.log('Local time:', local.toString());
  console.log('Back to UTC:', backToUtc.toISOString());
  
  // They should be equal
  expect(backToUtc.getTime()).toBe(originalUtc.getTime());
});