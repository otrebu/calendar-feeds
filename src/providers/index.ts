import { dummyProvider } from "./dummy";
import { jerseyTideProvider } from "./jersey-tides";
import { EventProvider } from "./types";

const registry: Record<string, EventProvider> = {
  dummy: dummyProvider,
  tides: jerseyTideProvider
};

/**
 * Retrieve an event provider by name.
 *
 * @param name Name of the provider (e.g. "tides")
 * @returns The matching provider or the dummy provider if unknown
 */
export function loadProvider(name: string): EventProvider {
  return registry[name] ?? registry["dummy"];
}
