import { dummyProvider } from "./dummy";
import { jerseyTideProvider } from "./jersey-tides";
import { EventProvider } from "./types";

const registry: Record<string, EventProvider> = {
  dummy: dummyProvider,
  tides: jerseyTideProvider
};

export function loadProvider(name: string): EventProvider {
  return registry[name] ?? registry["dummy"];
}
