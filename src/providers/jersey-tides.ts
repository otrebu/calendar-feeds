import fetch from 'node-fetch';
import { addDays, addMinutes, startOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { ICalEventData } from 'ical-generator';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { EventProvider } from './types';
import { logger, logDir } from '../logger';

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
  async getEvents(days = 7, offset = 0): Promise<ICalEventData[]> {
    // Align range to full local days so that each day contains four tide times
    const nowLocal = toZonedTime(new Date(), TIMEZONE);
    const startLocal = startOfDay(addDays(nowLocal, offset));
    const endLocal = addDays(startLocal, days);
    const CHUNK = 10;
    const extremes: TideExtreme[] = [];

    for (let offsetDays = 0; offsetDays < days; offsetDays += CHUNK) {
      const chunkStartLocal = addDays(startLocal, offsetDays);
      const chunkEndLocal = addDays(chunkStartLocal, Math.min(CHUNK, days - offsetDays));
      const start = fromZonedTime(chunkStartLocal, TIMEZONE);
      const end = fromZonedTime(chunkEndLocal, TIMEZONE);

      let url =
        `https://api.stormglass.io/v2/tide/extremes/point?lat=${LAT}&lng=${LNG}&start=${start.toISOString()}&end=${end.toISOString()}`;
      if (DATUM) url += `&datum=${encodeURIComponent(DATUM)}`;

      logger.info({ url }, 'fetching tides');
      const res = await fetch(url, {
        headers: { Authorization: process.env.STORM_TOKEN ?? '' }
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`StormGlass request failed: ${res.status} ${text}`);
      }
      const json = (await res.json()) as { data?: TideExtreme[]; extremes?: TideExtreme[] };
      extremes.push(...(json.data ?? json.extremes ?? []));
    }

    writeFileSync(join(logDir, 'tides-response.json'), JSON.stringify(extremes, null, 2));
    logger.debug({ count: extremes.length }, 'received tide extremes');
    const events = extremes
      .map((ex): ICalEventData => {
        const startUtc = new Date(ex.time);
        const evStartLocal = toZonedTime(startUtc, TIMEZONE);
        const evEndLocal = addMinutes(evStartLocal, 1);
        const height = ex.height + OFFSET;
        const prefix = ex.type === 'low' ? 'Low Tide' : 'High Tide';
        const summary = `${prefix} ${height.toFixed(1)} m`;
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
    events.sort((a, b) => (a.start as Date).getTime() - (b.start as Date).getTime());
    logger.info({ events: events.length }, 'tide events parsed');
    return events;
  }
};
