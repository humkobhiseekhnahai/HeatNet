export interface CoolingCommand {
  mode: "AGGRESSIVE" | "NORMAL" | "MINIMAL" | "OFF" | "CUSTOM";
  targetTemp?: number; // Celsius
  maxPowerKW?: number; // Maximum cooling power to consume
  affectedRacks?: string[]; // Specific rack IDs, empty = all
  costMultiplier?: number; // 1.0 = normal, higher = more expensive but effective
  duration?: number; // milliseconds, undefined = until changed
}

export interface CoolingState {
  active: boolean;
  command: CoolingCommand | null;
  currentPowerKW: number;
  totalCost: number;
  efficiency: number; // 0-1, higher = better cooling per power
  lastUpdated: number;
}

export interface CoolingMetrics {
  totalPowerConsumed: number; // kWh
  totalCost: number; // dollars
  averageEfficiency: number;
  uptimePercentage: number;
}