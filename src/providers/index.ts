import { dummyProvider } from "./dummy";
import { EventProvider } from "./types";

const registry: Record<string, EventProvider> = {
  dummy: dummyProvider
};

export function loadProvider(name: string): EventProvider {
  return registry[name] ?? registry["dummy"];
}
