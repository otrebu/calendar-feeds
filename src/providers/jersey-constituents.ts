export interface JerseyTideConstituent {
  name: string;
  amplitude: number;
  phase_GMT: number;
  speed: number;
}

// Harmonic constituents for St Helier derived from public-domain HRET14 tidal
// constants and tuned against recent local tide observations. These
// constituents describe the astronomical tide relative to local chart datum.
export const jerseyConstituents: JerseyTideConstituent[] = [
  { name: 'M2', amplitude: 3.1973, phase_GMT: 179.2, speed: 28.9841042 },
  { name: 'S2', amplitude: 1.3061, phase_GMT: 244.51, speed: 30 },
  { name: 'N2', amplitude: 0.6188, phase_GMT: 248.4, speed: 28.4397295 },
  { name: 'K1', amplitude: 0.0936, phase_GMT: 163.75, speed: 15.0410686 },
  { name: 'O1', amplitude: 0.0889, phase_GMT: 119.22, speed: 13.9430356 },
  { name: 'P1', amplitude: 0.0292, phase_GMT: 144.36, speed: 14.9589314 },
  { name: 'K2', amplitude: 0.4327, phase_GMT: 116.74, speed: 30.0821373 },
  { name: 'Q1', amplitude: 0.0278, phase_GMT: 201.95, speed: 13.3986609 },
  { name: 'M4', amplitude: 0.1932, phase_GMT: 32.18, speed: 57.9682084 },
  { name: 'MS4', amplitude: 0.101, phase_GMT: 85.12, speed: 58.9841042 }
];

// Mean water level relative to chart datum (metres).
export const jerseyMeanSeaLevel = 6.01437;
