#!/usr/bin/env node
import { Command } from "commander";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildCalendar, loadCalendar } from "./calendar";
import { loadProvider } from "./providers";
import { logger, logDir } from "./logger";

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

(async () => {
  try {
    logger.info({ provider, days: nDays, outFile }, 'start generation');
    const eventProvider = loadProvider(provider);
    const existing = nuke ? [] : loadCalendar(outFile);
    logger.debug({ existing: existing.length }, 'loaded existing events');
    const events = await eventProvider.getEvents(nDays);
    logger.debug({ events: events.length }, 'fetched events');
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
})();
