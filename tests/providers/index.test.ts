import { expect, test } from "vitest";
import { loadProvider } from "../../src/providers/index";
import { dummyProvider } from "../../src/providers/dummy";
import { jerseyTideProvider } from "../../src/providers/jersey-tides";

test("loadProvider returns dummy provider for 'dummy' name", () => {
  const provider = loadProvider("dummy");
  expect(provider).toBe(dummyProvider);
});

test("loadProvider returns jersey tide provider for 'tides' name", () => {
  const provider = loadProvider("tides");
  expect(provider).toBe(jerseyTideProvider);
});

test("loadProvider returns dummy provider as fallback for unknown provider", () => {
  const provider = loadProvider("unknown");
  expect(provider).toBe(dummyProvider);
});

test("loadProvider returns dummy provider as fallback for empty string", () => {
  const provider = loadProvider("");
  expect(provider).toBe(dummyProvider);
});

test("loadProvider returns dummy provider as fallback for null/undefined", () => {
  const provider = loadProvider(null as any);
  expect(provider).toBe(dummyProvider);
  
  const provider2 = loadProvider(undefined as any);
  expect(provider2).toBe(dummyProvider);
});