import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import pino from 'pino';

/** Directory where log files are written. */
export const logDir = join(process.cwd(), 'logs');
if (!existsSync(logDir)) {
  mkdirSync(logDir);
}

/** Logger instance writing to {@link logDir}. */
export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? 'info'
  },
  pino.destination(join(logDir, 'app.log'))
);
