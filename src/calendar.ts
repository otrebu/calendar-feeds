import ical, { ICalEventData } from "ical-generator";

export function buildCalendar(
  events: ICalEventData[],
  opts: { name?: string; timezone?: string } = {}
): string {
  const cal = ical({ name: opts.name ?? "\u26bd Fixtures", timezone: opts.timezone });
  events.forEach(ev => cal.createEvent(ev));
  return cal.toString();
}
