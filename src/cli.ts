#!/usr/bin/env node
import { Command } from "commander";
import { writeFileSync } from "node:fs";
import { buildCalendar, loadCalendar } from "./calendar";
import { loadProvider } from "./providers";

const program = new Command()
  .name("make-ics")
  .option("-p, --provider <name>", "event source", "dummy")
  .option("-o, --out <file>", "output path")
  .option("-d, --days <num>", "number of days", "7")
  .parse(process.argv);

const { provider, out, days } = program.opts() as {
  provider: string;
  out?: string;
  days: string;
};
const nDays = parseInt(days, 10);
const outFile = out ?? `${provider}.ics`;

(async () => {
  try {
    const eventProvider = loadProvider(provider);
    const existing = loadCalendar(outFile);
    const events = await eventProvider.getEvents(nDays);
    const seen = new Set(existing.map((e) => e.id));
    const fresh = events.filter((e) => !seen.has(e.id));
    const all = [...existing, ...fresh];
    writeFileSync(outFile, buildCalendar(all, "Europe/Jersey", provider));
    console.log(`📅  added ${fresh.length} new events → ${outFile}`);
  } catch (error) {
    console.error(`❌ Failed to generate calendar: ${error}`);
    process.exit(1);
  }
})();
