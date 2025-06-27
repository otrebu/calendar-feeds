import { ICalEventData } from "ical-generator";
export interface EventProvider {
  getEvents(): Promise<ICalEventData[]>;
}
