import { ICalEventData } from "ical-generator";
export interface EventProvider {
  /**
   * Return calendar events for the next `days` days. Implementations may
   * ignore the argument and use their own default range.
   */
  getEvents(days?: number): Promise<ICalEventData[]>;
}
