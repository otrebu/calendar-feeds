# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript CLI application that generates ICS calendar files from various data providers. It's designed to be run periodically via GitHub Actions to keep calendar feeds up-to-date.

## Development Commands

- `pnpm dev` - Run the CLI in development mode with ts-node
- `pnpm build` - Build the project using tsup (outputs to `dist/`)
- `pnpm generate` - Run the built CLI (same as `node dist/cli.js`)
- `pnpm test` - Run tests with vitest

## CLI Usage

The main CLI command supports these options:
- `-p, --provider <name>` - Event source (default: "dummy")
- `-o, --out <file>` - Output path (default: `<provider>.ics`)
- `-d, --days <num>` - Number of days to fetch (default: 7)
- `-n, --nuke` - Ignore existing calendar and recreate from scratch

Examples:
```bash
# Generate tides calendar for 14 days
node dist/cli.js --provider tides --days 14

# Recreate calendar from scratch
node dist/cli.js --provider tides --nuke
```

## Architecture

### Provider System
The application uses a plugin-based provider system located in `src/providers/`:
- **EventProvider interface** (`types.ts`): Defines the contract for event providers
- **Provider registry** (`index.ts`): Maps provider names to implementations
- **Built-in providers**: `dummy.ts`, `jersey-tides.ts`

### Core Components
- **CLI** (`cli.ts`): Main entry point with command-line argument parsing and orchestration
- **Calendar utilities** (`calendar.ts`): Functions for building ICS files and loading existing calendars
- **Logger** (`logger.ts`): Structured logging with pino

### Smart Event Management
The CLI implements intelligent event fetching to avoid redundant API calls:
- Calculates coverage based on existing events in the calendar
- Maintains minimum coverage of 14 days, maximum of 40 days
- Only fetches new events beyond existing coverage
- Merges new events with existing ones (unless `--nuke` is used)

### GitHub Actions Integration
The project includes automated calendar generation via `.github/workflows/ics.yml`:
- Runs daily at 3 AM UTC
- Builds project, runs tests, and generates tides calendar
- Commits updated calendar and logs back to the repository
- Uses `STORM_TOKEN` secret for Storm Glass API access

## Key Dependencies

- **ical-generator**: Creates ICS calendar files
- **node-ical**: Parses existing ICS files
- **commander**: CLI argument parsing
- **pino**: Structured logging
- **date-fns**: Date manipulation utilities
- **node-fetch**: HTTP client for API calls

## Environment Variables

- `STORM_TOKEN`: Required for Storm Glass API access (tides provider)
- `STORM_DATUM`: Optional datum parameter for tide height calculations (defaults to MSL)

## Testing

Tests are run with vitest. The project uses TypeScript with strict mode enabled.