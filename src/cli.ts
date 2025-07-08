#!/usr/bin/env node
import { Command } from "commander";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { differenceInCalendarDays } from "date-fns";
import { ICalEventData } from "ical-generator";
import { buildCalendar, loadCalendar } from "./calendar";
import { loadProvider } from "./providers";
import { logger, logDir } from "./logger";

export const MIN_COVERAGE = 14;
export const MAX_COVERAGE = 40;

export function calculateFetchDays(
  nDays: number,
  existing: ICalEventData[],
): { coverage: number; target: number; fetch: number } {
  const now = new Date();
  const last = existing.reduce(
    (max, ev) => {
      const end = ev.end ?? ev.start;
      return end > max ? end : max;
    },
    now
  );
  const coverage = Math.max(0, differenceInCalendarDays(last, now));
  const target = Math.min(coverage + MIN_COVERAGE, MAX_COVERAGE);
  const fetch = Math.max(nDays, target);
  return { coverage, target, fetch };
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
    const { coverage, target, fetch } = calculateFetchDays(nDays, existing);
    logger.debug(
      { existing: existing.length, coverage, target, fetch },
      'loaded existing events'
    );
    const events = await eventProvider.getEvents(fetch);
    logger.debug({ events: events.length, fetch }, 'fetched events');
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run();
}
