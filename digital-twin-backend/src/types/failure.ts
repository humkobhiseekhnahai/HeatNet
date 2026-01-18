export enum FailureType {
  CRAC = 'CRAC',
  PUMP = 'PUMP', 
  FAN = 'FAN',
  POWER = 'POWER',
  ENVIRONMENTAL = 'ENVIRONMENTAL'
}

export enum FailureSeverity {
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
  CRITICAL = 'CRITICAL'
}

export enum EquipmentType {
  CRAC_UNIT = 'CRAC_UNIT',
  PUMP = 'PUMP',
  FAN_ARRAY = 'FAN_ARRAY',
  PDU = 'PDU',
  SENSOR = 'SENSOR'
}

export enum OperationalStatus {
  NORMAL = 'NORMAL',
  DEGRADED = 'DEGRADED',
  FAILED = 'FAILED',
  MAINTENANCE = 'MAINTENANCE'
}

export interface FailureEvent {
  id: string;
  timestamp: number;
  failureType: FailureType;
  severity: FailureSeverity;
  equipmentId: string;
  equipmentType: EquipmentType;
  parameters?: any;
  isActive: boolean;
  resolvedAt?: number;
  cascadeChain: string[];
  description: string;
  expectedDurationMs?: number;
  impact: FailureImpact;
}

export interface FailureImpact {
  coolingEfficiencyLoss: number;    // 0.0 to 1.0
  powerReduction: number;           // kW
  temperatureIncrease: number;     // °C
  affectedRacks: string[];
  recoveryTimeMs?: number;         // Estimated recovery time
}

// Specific failure types
export interface CRACFailureParams {
  failureMode: 'PARTIAL' | 'COMPLETE' | 'DEGRADATION';
  capacityLoss: number;            // 0.0 to 1.0
  affectedZones: string[];
  compressorFailure: boolean;
  fanFailure: boolean;
}

export interface PumpFailureParams {
  failureMode: 'FLOW_REDUCTION' | 'COMPLETE' | 'PRESSURE_DROP';
  flowReduction: number;            // 0.0 to 1.0
  pressureDrop: number;            // PSI
  affectedLoops: string[];
  backupPumpAvailable: boolean;
}

export interface FanFailureParams {
  failureMode: 'INDIVIDUAL' | 'ARRAY' | 'CASCADING';
  failedUnits: number;
  totalUnits: number;
  affectedRacks: string[];
  rpmReduction: number;            // 0.0 to 1.0
}

export interface PowerFailureParams {
  failureMode: 'OUTAGE' | 'BROWNOUT' | 'FLUCTUATION';
  voltageDrop: number;             // Percentage
  frequency: number;               // Hz for fluctuations
  affectedZones: string[];
  durationMs: number;
}

export interface EnvironmentalFailureParams {
  type: 'HIGH_AMBIENT' | 'HUMIDITY' | 'EXTERNAL_HEAT';
  ambientTempRise: number;         // °C
  humidityChange?: number;          // Percentage
  durationMs: number;
  externalFactor?: string[];
}

export interface EquipmentState {
  id: string;
  equipmentId: string;
  equipmentType: EquipmentType;
  health: number;                   // 0.0 to 1.0
  mtbf?: number;                    // Hours
  lastMaintenance?: number;
  operationalStatus: OperationalStatus;
  location?: string;
  specifications?: any;
  age: number;                      // Equipment age in hours
  totalRuntime: number;             // Total runtime hours
  failureCount: number;
  lastFailure?: number;
}

// Failure Injection Request
export interface FailureInjectionRequest {
  type: FailureType;
  severity: FailureSeverity;
  equipmentId: string;
  equipmentType: EquipmentType;
  parameters: any;
  description: string;
  expectedDurationMs?: number;
  targetRacks?: string[];
}

// Failure Simulation State
export interface FailureSimulationState {
  activeFailures: Map<string, FailureEvent>;
  equipmentStates: Map<string, EquipmentState>;
  failureHistory: FailureEvent[];
  simulationEnabled: boolean;
  cascadeEnabled: boolean;
  mtbfEnabled: boolean;
  lastUpdateTime: number;
}