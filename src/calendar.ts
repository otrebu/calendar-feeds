import ical, { ICalEventData } from "ical-generator";
import { existsSync, readFileSync } from "node:fs";
import * as nodeIcal from "node-ical";

export function buildCalendar(
  events: ICalEventData[],
  timezone?: string,
): string {
  const cal = ical({ name: "\u26bd Fixtures" });
  if (timezone) cal.timezone(timezone);
  events.forEach((ev) => cal.createEvent(ev));
  return cal.toString();
}

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
