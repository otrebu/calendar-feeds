import { ICalEventData } from "ical-generator";

/**
 * Object capable of producing calendar events.
 */
export interface EventProvider {
  /**
   * Return events for the next `days` days.
   */
  getEvents(days?: number): Promise<ICalEventData[]>;
}
