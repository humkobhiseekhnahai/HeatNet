export enum ScenarioCategory {
  TESTING = 'TESTING',
  STRESS = 'STRESS',
  OPTIMIZATION = 'OPTIMIZATION',
  FAILURE = 'FAILURE',
  MAINTENANCE = 'MAINTENANCE'
}

export enum ScenarioDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum ScenarioStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  PAUSED = 'PAUSED'
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  category: ScenarioCategory;
  isPreset: boolean;
  parameters: ScenarioConfig;
  expectedOutcomes?: ExpectedOutcomes;
  durationMs?: number;
  tags: string[];
  difficulty: ScenarioDifficulty;
  author?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ScenarioConfig {
  heating?: HeatingCommand;
  cooling?: CoolingCommand;
  failures?: FailureEventConfig[];
  environmental?: EnvironmentalConditions;
  workload?: WorkloadPattern;
  timeline?: ScenarioTimeline;
  durationMs?: number;
}

export interface HeatingCommand {
  mode: string;
  cpuBoost?: number;
  gpuBoost?: number;
  targetTemp?: number;
  maxPowerKW?: number;
  affectedRacks?: string[];
  costMultiplier?: number;
  duration?: number;
}

export interface CoolingCommand {
  mode: string;
  targetTemp?: number;
  maxPowerKW?: number;
  affectedRacks?: string[];
  costMultiplier?: number;
  duration?: number;
}

export interface FailureEventConfig {
  type: string;
  severity: string;
  equipmentId: string;
  equipmentType: string;
  parameters: any;
  description: string;
  triggerTime: number;            // Relative to scenario start (ms)
  duration?: number;
  cascade?: boolean;
}

export interface EnvironmentalConditions {
  ambientTempRise: number;         // °C
  humidityChange?: number;         // Percentage
  externalFactors?: string[];
  duration: number;
}

export interface WorkloadPattern {
  pattern: 'CONSTANT' | 'RAMP_UP' | 'SPIKE' | 'WAVE' | 'RANDOM';
  intensity: number;               // 0.0 to 1.0
  affectedRacks?: string[];
  duration: number;
  parameters?: any;
}

export interface ScenarioTimeline {
  phases: ScenarioPhase[];
  transitions: ScenarioTransition[];
}

export interface ScenarioPhase {
  id: string;
  name: string;
  startTime: number;              // Relative to scenario start (ms)
  duration: number;
  actions: ScenarioAction[];
}

export interface ScenarioAction {
  type: 'HEATING' | 'COOLING' | 'FAILURE' | 'WORKLOAD' | 'ENVIRONMENTAL';
  action: any;
  target?: string[];
  delay?: number;
}

export interface ScenarioTransition {
  fromPhase: string;
  toPhase: string;
  condition: string;
  actions?: ScenarioAction[];
}

export interface ExpectedOutcomes {
  temperatureRange: [number, number];
  powerRange: [number, number];
  costRange: [number, number];
  alertCounts?: {
    critical: number;
    warning: number;
    info: number;
  };
  failureEvents?: number;
  duration: number;
}

export interface ScenarioExecution {
  id: string;
  scenarioId: string;
  startTime: number;
  endTime?: number;
  status: ScenarioStatus;
  actualOutcomes?: ActualOutcomes;
  validationResults?: ValidationResult;
  notes?: string;
  triggeredBy?: string;
  progress: number;               // 0.0 to 1.0
  currentPhase?: string;
  events: ExecutionEvent[];
  createdAt: number;
  updatedAt: number;
}

export interface ActualOutcomes {
  temperatureData: number[];
  powerData: number[];
  costData: number[];
  alertCounts: {
    critical: number;
    warning: number;
    info: number;
  };
  failureEvents: number;
  duration: number;
  peakTemperature: number;
  peakPower: number;
  totalCost: number;
}

export interface ValidationResult {
  temperatureMatch: boolean;
  powerMatch: boolean;
  costMatch: boolean;
  alertMatch: boolean;
  failureMatch: boolean;
  durationMatch: boolean;
  overallScore: number;           // 0.0 to 1.0
  discrepancies: string[];
  recommendations: string[];
}

export interface ExecutionEvent {
  timestamp: number;
  type: 'PHASE_START' | 'PHASE_END' | 'ACTION' | 'ALERT' | 'FAILURE' | 'SYSTEM';
  description: string;
  data?: any;
  severity?: 'INFO' | 'WARNING' | 'ERROR';
}

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  tags: string[];
  author: string;
  version: string;
  scenario: Scenario;
  usage: {
    totalExecutions: number;
    successRate: number;
    avgScore: number;
    lastExecuted?: number;
  };
}

// Scenario Creation Request
export interface CreateScenarioRequest {
  name: string;
  description: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  tags?: string[];
  config: ScenarioConfig;
  expectedOutcomes?: ExpectedOutcomes;
  durationMs?: number;
}

// Scenario Execution Request
export interface ExecuteScenarioRequest {
  scenarioId: string;
  parameters?: Partial<ScenarioConfig>;  // Override preset parameters
  notes?: string;
  validation?: boolean;                  // Enable validation
  realTime?: boolean;                   // Real-time progress updates
}

// Scenario State Management
export interface ScenarioState {
  activeScenarios: Map<string, ScenarioExecution>;
  presetScenarios: Map<string, ScenarioPreset>;
  executionHistory: ScenarioExecution[];
  scenarioTemplates: Map<string, Scenario>;
  lastUpdateTime: number;
  executionQueue: ScenarioExecution[];
}