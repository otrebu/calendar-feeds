import ical, { ICalEventData } from "ical-generator";

export function buildCalendar(events: ICalEventData[]): string {
  const cal = ical({ name: "\u26bd Fixtures" });
  events.forEach(ev => cal.createEvent(ev));
  return cal.toString();
}
