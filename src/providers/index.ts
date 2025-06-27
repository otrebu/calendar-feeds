import { dummyProvider } from "./dummy";
import { jerseyTidesProvider } from "./jerseyTides";
import { EventProvider } from "./types";

const registry: Record<string, EventProvider> = {
  dummy: dummyProvider,
  tides: jerseyTidesProvider
};

export function loadProvider(name: string): EventProvider {
  return registry[name] ?? registry["dummy"];
}
