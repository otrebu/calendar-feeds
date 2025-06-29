import fetch from 'node-fetch';
import { addDays, addMinutes } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ICalEventData } from 'ical-generator';
import { EventProvider } from './types';

const LAT = 49.18;
const LNG = -2.11;
const TIMEZONE = 'Europe/Jersey';

interface TideExtreme {
  time: string;
  type: string;
  height: number;
}

export const jerseyTideProvider: EventProvider = {
  async getEvents(days = 7): Promise<ICalEventData[]> {
    const start = new Date();
    const end = addDays(start, days);
    const url =
      `https://api.stormglass.io/v2/tide/extremes/point?lat=${LAT}&lng=${LNG}&start=${start.toISOString()}&end=${end.toISOString()}`;

    const res = await fetch(url, {
      headers: { Authorization: process.env.STORM_TOKEN ?? '' }
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`StormGlass request failed: ${res.status} ${text}`);
    }
    const json = (await res.json()) as { data?: TideExtreme[]; extremes?: TideExtreme[] };
    const list = json.data ?? json.extremes ?? [];
    return list.map((ex): ICalEventData => {
      const startUtc = new Date(ex.time);
      const startLocal = toZonedTime(startUtc, TIMEZONE);
      const endLocal = addMinutes(startLocal, 1);
      const summary = ex.type === 'low' ? 'Low Tide' : 'High Tide';
      return {
        id: `tide-${startUtc.toISOString()}`,
        summary,
        start: startLocal,
        end: endLocal,
        description: `Height: ${ex.height} m`,
        location: 'St Helier, Jersey',
        timezone: TIMEZONE
      };
    });
  }
};
