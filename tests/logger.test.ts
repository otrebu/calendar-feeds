import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { join } from "node:path";

// Mock fs before importing logger
vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn()
}));

// Mock pino
vi.mock("pino", () => {
  const mockLogger = {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
  };
  const mockPino = vi.fn(() => mockLogger);
  mockPino.destination = vi.fn();
  return { default: mockPino };
});

import { existsSync, mkdirSync } from "node:fs";
import pino from "pino";

const mockExistsSync = existsSync as any;
const mockMkdirSync = mkdirSync as any;
const mockPino = pino as any;
const mockDestination = (pino as any).destination;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.resetAllMocks();
});

test("logger creates log directory if it doesn't exist", async () => {
  mockExistsSync.mockReturnValue(false);
  
  // Import logger after mocking
  await import("../src/logger");
  
  expect(mockExistsSync).toHaveBeenCalledWith(join(process.cwd(), "logs"));
  expect(mockMkdirSync).toHaveBeenCalledWith(join(process.cwd(), "logs"));
});

test("logger doesn't create log directory if it exists", async () => {
  mockExistsSync.mockReturnValue(true);
  
  // Clear module cache and re-import
  vi.resetModules();
  await import("../src/logger");
  
  expect(mockExistsSync).toHaveBeenCalledWith(join(process.cwd(), "logs"));
  expect(mockMkdirSync).not.toHaveBeenCalled();
});

test("logger configures pino with correct options", async () => {
  process.env.LOG_LEVEL = "debug";
  
  vi.resetModules();
  await import("../src/logger");
  
  const pinoCall = mockPino.mock.calls[0];
  expect(pinoCall[0]).toEqual({ level: "debug" });
  expect(mockDestination).toHaveBeenCalledWith(
    join(process.cwd(), "logs", "app.log")
  );
  
  delete process.env.LOG_LEVEL;
});

test("logger uses default log level when not specified", async () => {
  delete process.env.LOG_LEVEL;
  
  vi.resetModules();
  await import("../src/logger");
  
  const pinoCall = mockPino.mock.calls[0];
  expect(pinoCall[0]).toEqual({ level: "info" });
});

test("logDir exports correct path", async () => {
  const { logDir } = await import("../src/logger");
  expect(logDir).toBe(join(process.cwd(), "logs"));
});