import { ICalEventData } from "ical-generator";
export interface EventProvider {
  getEvents(days?: number): Promise<ICalEventData[]>;
}
