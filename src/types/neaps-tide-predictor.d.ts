declare module '@neaps/tide-predictor' {
  export interface TideConstituent {
    name: string;
    amplitude: number;
    phase_GMT?: number;
    phase_local?: number;
    speed: number;
  }

  export interface TidePredictionOptions {
    phaseKey?: string;
    offset?: number;
  }

  export interface TideExtreme {
    time: Date;
    level: number;
    high: boolean;
    low: boolean;
    label: string;
  }

  export interface ExtremesPredictionOptions {
    start: Date;
    end: Date;
    labels?: {
      high?: string;
      low?: string;
    };
    offset?: {
      height_offset?: {
        high?: number;
        low?: number;
      };
      time_offset?: {
        high?: number;
        low?: number;
      };
    };
    timeFidelity?: number;
  }

  export interface TidePrediction {
    getExtremesPrediction(options: ExtremesPredictionOptions): TideExtreme[];
    getWaterLevelAtTime(options: { time: Date }): TideExtreme;
  }

  export default function tidePrediction(
    constituents: TideConstituent[],
    options?: TidePredictionOptions
  ): TidePrediction;
}
