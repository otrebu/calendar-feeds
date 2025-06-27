import { EventProvider } from "./types";
import { utcToZonedTime } from "date-fns-tz";

const LAT = 49.1844;
const LNG = -2.1090;
const TZ = "Europe/Jersey";

interface Extreme {
  time: string;
  type: string;
  height: number;
}

export const jerseyTidesProvider: EventProvider = {
  async getEvents(days = 30) {
    const token = process.env.STORM_TOKEN;
    if (!token) {
      throw new Error("STORM_TOKEN env var required");
    }
    const start = new Date();
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    const url =
      `https://api.stormglass.io/v2/tide/extremes/point?lat=${LAT}&lng=${LNG}` +
      `&start=${start.toISOString()}&end=${end.toISOString()}`;

    const res = await fetch(url, { headers: { Authorization: token } });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`StormGlass error ${res.status}: ${text}`);
    }
    const json = (await res.json()) as { data: Extreme[] };
    return json.data.map(ext => {
      const utc = new Date(ext.time);
      const zoned = utcToZonedTime(utc, TZ);
      const endDate = new Date(zoned.getTime() + 60 * 1000);
      return {
        id: `tide-${ext.time}`,
        summary: `${ext.type} tide`,
        start: zoned,
        end: endDate,
        timezone: TZ,
      };
    });
  }
};
