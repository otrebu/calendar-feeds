import ical, { ICalEventData } from "ical-generator";
import { existsSync, readFileSync } from "node:fs";
import * as nodeIcal from "node-ical";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

/**
 * Convert a list of events to an ICS calendar string.
 *
 * @param events   The events to include in the calendar
 * @param timezone Optional timezone identifier; if supplied the calendar
 *                 will use this zone
 * @param name     Optional calendar name
 * @returns The calendar contents in ICS format
 */
export function buildCalendar(
  events: ICalEventData[],
  timezone?: string,
  name?: string,
): string {
  const cal = ical({ name: name ?? "calendar" });
  if (timezone) cal.timezone(timezone);
  events.forEach((ev) => cal.createEvent(ev));
  return cal.toString();
}

/**
 * Load events from an existing ICS file.
 *
 * @param path Path to the calendar file
 * @returns Parsed events or an empty array if the file is missing
 */
export function loadCalendar(path: string): ICalEventData[] {
  if (!existsSync(path)) return [];
  const text = readFileSync(path, "utf8");
  const parsed = nodeIcal.parseICS(text);
  const events: ICalEventData[] = [];
  for (const item of Object.values(parsed)) {
    if (item.type === "VEVENT") {
      events.push({
        id: item.uid as string,
        summary: item.summary as string,
        start: item.start as Date,
        end: item.end as Date,
        description: item.description as string,
        location: item.location as string,
      });
    }
  }
  return events;
}

/**
 * Determine how many future days are covered by the given events.
 *
 * @param events   Calendar events
 * @param timezone Timezone used to interpret "today"
 * @returns Number of days from today until the last future event
 */
export function coverageDays(
  events: ICalEventData[],
  timezone: string
): number {
  const startLocal = startOfDay(toZonedTime(new Date(), timezone));
  const future = events.filter((e) => e.start >= startLocal);
  if (future.length === 0) return 0;
  const last = future.reduce(
    (max, ev) => (ev.start > max ? ev.start : max),
    future[0].start
  );
  return differenceInCalendarDays(last, startLocal) + 1;
}
