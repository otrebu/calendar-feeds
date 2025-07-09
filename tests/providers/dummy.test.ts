import { expect, test } from "vitest";
import { dummyProvider } from "../../src/providers/dummy";

test("dummy provider returns one event", async () => {
  const events = await dummyProvider.getEvents();
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({
    id: "dummy-001",
    summary: "Dummy Match",
    location: "Dream Stadium"
  });
});

test("dummy provider returns same event regardless of days parameter", async () => {
  const events1 = await dummyProvider.getEvents();
  const events7 = await dummyProvider.getEvents(7);
  const events30 = await dummyProvider.getEvents(30);
  
  expect(events1).toEqual(events7);
  expect(events1).toEqual(events30);
});

test("dummy provider returns event with correct date structure", async () => {
  const events = await dummyProvider.getEvents();
  const event = events[0];
  
  expect(event.start).toBeInstanceOf(Date);
  expect(event.end).toBeInstanceOf(Date);
  expect(event.start).toEqual(new Date("2025-07-05T14:00:00Z"));
  expect(event.end).toEqual(new Date("2025-07-05T16:00:00Z"));
});

test("dummy provider handles undefined days parameter", async () => {
  const events = await dummyProvider.getEvents(undefined);
  expect(events).toHaveLength(1);
  expect(events[0].id).toBe("dummy-001");
});

test("dummy provider returns valid event properties", async () => {
  const events = await dummyProvider.getEvents();
  const event = events[0];
  
  expect(event.id).toBe("dummy-001");
  expect(event.summary).toBe("Dummy Match");
  expect(event.location).toBe("Dream Stadium");
  expect(event.start).toBeDefined();
  expect(event.end).toBeDefined();
  expect(event.end! > event.start).toBe(true);
});