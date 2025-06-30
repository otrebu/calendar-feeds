import fetch from 'node-fetch';
import { addDays, addMinutes, startOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { ICalEventData } from 'ical-generator';
import { EventProvider } from './types';

const LAT = 49.18;
const LNG = -2.11;
const TIMEZONE = 'Europe/Jersey';
const DATUM = process.env.STORM_DATUM;
// Jersey tide tables are relative to local Chart Datum which is about
// 6.03 m below mean sea level at St Helier. Storm Glass returns heights
// relative to MSL by default so we apply this constant correction.
const OFFSET = 6.03;

interface TideExtreme {
  time: string;
  type: string;
  height: number;
}

export const jerseyTideProvider: EventProvider = {
  async getEvents(days = 7): Promise<ICalEventData[]> {
    // Align range to full local days so that each day contains four tide times
    const nowLocal = toZonedTime(new Date(), TIMEZONE);
    const startLocal = startOfDay(nowLocal);
    const endLocal = addDays(startLocal, days);
    const start = fromZonedTime(startLocal, TIMEZONE);
    const end = fromZonedTime(endLocal, TIMEZONE);
    let url =
      `https://api.stormglass.io/v2/tide/extremes/point?lat=${LAT}&lng=${LNG}&start=${start.toISOString()}&end=${end.toISOString()}`;
    if (DATUM) url += `&datum=${encodeURIComponent(DATUM)}`;

    const res = await fetch(url, {
      headers: { Authorization: process.env.STORM_TOKEN ?? '' }
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`StormGlass request failed: ${res.status} ${text}`);
    }
    const json = (await res.json()) as { data?: TideExtreme[]; extremes?: TideExtreme[] };
    const list = json.data ?? json.extremes ?? [];
    return list
      .map((ex): ICalEventData => {
        const startUtc = new Date(ex.time);
        const evStartLocal = toZonedTime(startUtc, TIMEZONE);
        const evEndLocal = addMinutes(evStartLocal, 1);
        const summary = ex.type === 'low' ? 'Low Tide' : 'High Tide';
        const height = ex.height + OFFSET;
        return {
          id: `tide-${startUtc.toISOString()}`,
          summary,
          start: evStartLocal,
          end: evEndLocal,
          description: `Height: ${height} m`,
          location: 'St Helier, Jersey',
          timezone: TIMEZONE
        };
      })
      .filter((ev) => ev.start >= startLocal && ev.start < endLocal);
  }
};
