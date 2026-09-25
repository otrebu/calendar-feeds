import tidePrediction from '@neaps/tide-predictor';
import { addDays, addMinutes, startOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { ICalEventData } from 'ical-generator';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { EventProvider } from './types';
import { logger, logDir } from '../logger';
import { jerseyConstituents, jerseyMeanSeaLevel } from './jersey-constituents';

const TIMEZONE = 'Europe/Jersey';
const SEARCH_PADDING_HOURS = 12;
const TIME_FIDELITY_SECONDS = 300; // 5 minutes

const prediction = tidePrediction(jerseyConstituents, {
  phaseKey: 'phase_GMT',
  offset: jerseyMeanSeaLevel
});

export const jerseyTideProvider: EventProvider = {
  async getEvents(days = 7, offset = 0): Promise<ICalEventData[]> {
    // Align range to full local days so that each day contains four tide times
    const nowLocal = toZonedTime(new Date(), TIMEZONE);
    const startLocal = startOfDay(addDays(nowLocal, offset));
    const endLocal = addDays(startLocal, days);
    const startUtc = fromZonedTime(startLocal, TIMEZONE);
    const endUtc = fromZonedTime(endLocal, TIMEZONE);

    const extremes = prediction.getExtremesPrediction({
      start: new Date(startUtc.getTime() - SEARCH_PADDING_HOURS * 60 * 60 * 1000),
      end: new Date(endUtc.getTime() + SEARCH_PADDING_HOURS * 60 * 60 * 1000),
      timeFidelity: TIME_FIDELITY_SECONDS,
      labels: {
        high: 'High Tide',
        low: 'Low Tide'
      }
    });

    writeFileSync(join(logDir, 'tides-response.json'), JSON.stringify(extremes, null, 2));
    logger.debug({ count: extremes.length }, 'calculated tide extremes');

    const events = extremes
      .map((ex): ICalEventData => {
        const startUtc = ex.time;
        const startLocalEvent = toZonedTime(startUtc, TIMEZONE);
        const endLocalEvent = addMinutes(startLocalEvent, 1);
        const prefix = ex.high ? 'High Tide' : 'Low Tide';
        const summary = `${prefix} ${ex.level.toFixed(1)} m`;
        return {
          id: `tide-${startUtc.toISOString()}`,
          summary,
          start: startLocalEvent,
          end: endLocalEvent,
          description: `Height: ${ex.level.toFixed(2)} m`,
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
