#!/usr/bin/env node
const { execSync } = require('node:child_process');

function getArg(name, defaultValue) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  const envName = name.toUpperCase();
  if (process.env[envName]) return process.env[envName];
  return defaultValue;
}

const provider = getArg('provider', 'dummy');
const days = getArg('days', '7');

execSync('pnpm test:coverage', { stdio: 'inherit' });
execSync('pnpm build', { stdio: 'inherit' });
execSync(`node dist/cli.js --provider ${provider} --days ${days}`, { stdio: 'inherit' });
