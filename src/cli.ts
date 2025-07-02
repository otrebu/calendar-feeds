#!/usr/bin/env node
import { Command } from "commander";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildCalendar, loadCalendar, coverageDays } from "./calendar";
import { loadProvider } from "./providers";
import { logger, logDir } from "./logger";

const program = new Command()
  .name("make-ics")
  .option("-p, --provider <name>", "event source", "dummy")
  .option("-o, --out <file>", "output path")
  .option("-d, --days <num>", "number of days", "10")
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

(async () => {
  try {
    logger.info({ provider, days: nDays, outFile }, 'start generation');
    const eventProvider = loadProvider(provider);
    const existingEvents = nuke ? [] : loadCalendar(outFile);
    logger.info(
      { existing: existingEvents.length },
      'loaded existing events'
    );
    const currentCoverage = coverageDays(existingEvents, 'Europe/Jersey');
    logger.debug({ currentCoverage }, 'existing coverage days');
    const MIN_COVERAGE = 14;
    const MAX_COVERAGE = 40;
    let fetchDays = nDays;
    if (currentCoverage < MIN_COVERAGE) {
      fetchDays = Math.max(fetchDays, MIN_COVERAGE);
    }
    fetchDays = Math.min(fetchDays, MAX_COVERAGE);
    const events = await eventProvider.getEvents(fetchDays);
    logger.info(
      { fetched: events.length, fetchDays },
      'fetched events'
    );
    writeFileSync(
      join(logDir, `${provider}-events.json`),
      JSON.stringify(events, null, 2)
    );
    const seen = new Set(existingEvents.map((e) => e.id));
    const fresh = events.filter((e) => !seen.has(e.id));
    const all = nuke ? fresh : [...existingEvents, ...fresh];
    const newCoverage = coverageDays(all, 'Europe/Jersey');
    writeFileSync(outFile, buildCalendar(all, "Europe/Jersey", provider));
    logger.info(
      {
        added: fresh.length,
        existing: existingEvents.length,
        fetched: events.length,
        total: all.length,
        coverage: newCoverage,
        file: outFile
      },
      fresh.length ? 'calendar updated' : 'calendar already up to date'
    );
    console.log(`📅  added ${fresh.length} new events → ${outFile}`);
  } catch (error) {
    logger.error({ err: error }, 'failed to generate calendar');
    console.error(`❌ Failed to generate calendar: ${error}`);
    process.exit(1);
  }
})();
