export interface HeatingCommand {
  mode: "LOW" | "MEDIUM" | "HIGH" | "CUSTOM" | "OFF";
  cpuBoost?: number; // Additional CPU utilization percentage (0-100)
  gpuBoost?: number; // Additional GPU utilization percentage (0-100)
  targetTemp?: number; // Target temperature in Celsius
  maxPowerKW?: number; // Maximum heating power to consume
  affectedRacks?: string[]; // Specific rack IDs, empty = all
  costMultiplier?: number; // 1.0 = normal, higher = more expensive heating
  duration?: number; // milliseconds, undefined = until changed
}

export interface HeatingState {
  active: boolean;
  command: HeatingCommand | null;
  currentPowerKW: number;
  totalCost: number;
  efficiency: number; // 0-1, higher = better heating per power
  lastUpdated: number;
}

export interface HeatingMetrics {
  totalPowerConsumed: number; // kWh
  totalCost: number; // dollars
  averageEfficiency: number;
  uptimePercentage: number;
  currentHourlyCost: number;
}