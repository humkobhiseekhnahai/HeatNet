export type RackStatus = "OK" | "WARM" | "HOT";

export interface RackState {
  cpuUtil: number;
  gpuUtil: number;
  inletTemp: number;
  outletTemp: number;
  fanRPM: number;
  powerKW: number;
  status: RackStatus;
  explanation?: string;
  coolingEfficiency?: number; // 0.6 – 1.0
}

export interface Zone {
  zoneId: string;
  aisleType: "HOT" | "COLD";
  racks: string[];
}

export interface Aggregates {
  avgInletTemp: number;
  maxInletTemp: number;
  totalPowerKW: number;
}

export interface DigitalTwinState {
  timestamp: number;
  zones: Zone[];
  racks: Record<string, RackState>;
  aggregates: Aggregates;
}