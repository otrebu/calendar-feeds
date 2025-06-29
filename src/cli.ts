#!/usr/bin/env node
import { Command } from "commander";
import { writeFileSync } from "node:fs";
import { buildCalendar } from "./calendar";
import { loadProvider } from "./providers";

const program = new Command()
  .name("make-ics")
  .option("-p, --provider <name>", "event source", "dummy")
  .option("-o, --out <file>", "output path", "team.ics")
  .parse(process.argv);

const { provider, out } = program.opts() as { provider: string; out: string };

(async () => {
  try {
    const eventProvider = loadProvider(provider);
    const events = await eventProvider.getEvents();
    writeFileSync(out, buildCalendar(events));
    console.log(`📅  generated ${events.length} events → ${out}`);
  } catch (error) {
    console.error(`❌ Failed to generate calendar: ${error}`);
    process.exit(1);
  }
})();
