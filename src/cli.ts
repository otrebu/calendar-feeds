#!/usr/bin/env node
import { Command } from "commander";
import { writeFileSync } from "node:fs";
import { buildCalendar } from "./calendar";
import { loadProvider } from "./providers";

const program = new Command()
  .name("make-ics")
  .option("-p, --provider <name>", "event source", "dummy")
  .option("-d, --days <number>", "number of days", "30")
  .option("-o, --out <file>", "output path", "team.ics")
  .parse(process.argv);

const { provider, out, days } = program.opts() as { provider: string; out: string; days: string };

(async () => {
  const events = await loadProvider(provider).getEvents(parseInt(days, 10));
  const timezone = provider === "tides" ? "Europe/Jersey" : undefined;
  writeFileSync(out, buildCalendar(events, { timezone }));
  console.log(`\ud83d\udcc5  generated ${events.length} events \u2192 ${out}`);
})();
