#!/usr/bin/env node
import { Command } from "commander";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { differenceInCalendarDays, isDate, toDate } from "date-fns";
import { ICalEventData } from "ical-generator";
import { buildCalendar, loadCalendar } from "./calendar";
import { loadProvider } from "./providers";
import { logger, logDir } from "./logger";

export const MIN_COVERAGE = 14;
export const MAX_COVERAGE = 40;


export function calculateFetchDays(
  nDays: number,
  existing: ICalEventData[],
): { coverage: number; target: number; fetch: number; offset: number } {
  const now = new Date();
  const last = existing.reduce(
    (max, ev) => {
      const end = ev.end ?? ev.start;
      let endDate: Date;
      if (isDate(end)) {
        endDate = end;
      } else if (typeof end === 'string' || typeof end === 'number') {
        endDate = toDate(end);
      } else {
        // Handle other date-like objects by converting to string first
        endDate = toDate(end.toString());
      }
      return endDate > max ? endDate : max;
    },
    now
  );
  const coverage = Math.max(0, differenceInCalendarDays(last, now));
  const target = Math.min(Math.max(nDays, MIN_COVERAGE), MAX_COVERAGE);
  const fetch = coverage >= target ? 0 : target - coverage;
  const offset = coverage;
  return { coverage, target, fetch, offset };
}

const program = new Command()
  .name("make-ics")
  .option("-p, --provider <name>", "event source", "dummy")
  .option("-o, --out <file>", "output path")
  .option("-d, --days <num>", "number of days", "7")
  .option("-n, --nuke", "ignore existing calendar and recreate", false)
  .parse(process.argv);

const { provider, out, days, nuke } = program.opts() as {
  provider: string;
  out?: string;
  days: string;
  nuke: boolean;
};
const nDays = parseInt(days, 10);
const outFile = out ?? `${provider}.ics`;

export async function run(): Promise<void> {
  try {
    logger.info({ provider, days: nDays, outFile }, 'start generation');
    const eventProvider = loadProvider(provider);
    const existing = nuke ? [] : loadCalendar(outFile);
    const { coverage, target, fetch, offset } = calculateFetchDays(nDays, existing);
    logger.debug(
      { existing: existing.length, coverage, target, fetch, offset },
      'loaded existing events'
    );
    const events = fetch > 0 ? await eventProvider.getEvents(fetch, offset) : [];
    logger.debug({ events: events.length, fetch, offset }, 'fetched events');
    writeFileSync(
      join(logDir, `${provider}-events.json`),
      JSON.stringify(events, null, 2)
    );
    const seen = new Set(existing.map((e) => e.id));
    const fresh = events.filter((e) => !seen.has(e.id));
    const all = nuke ? fresh : [...existing, ...fresh];
    writeFileSync(outFile, buildCalendar(all, "Europe/Jersey", provider));
    logger.info({ added: fresh.length, file: outFile }, 'calendar updated');
    console.log(`📅  added ${fresh.length} new events → ${outFile}`);
  } catch (error) {
    logger.error({ err: error }, 'failed to generate calendar');
    console.error(`❌ Failed to generate calendar: ${error}`);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}
