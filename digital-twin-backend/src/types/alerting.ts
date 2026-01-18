export enum AlertType {
  TEMPERATURE = 'TEMPERATURE',
  PERFORMANCE = 'PERFORMANCE',
  COST = 'COST',
  SYSTEM_HEALTH = 'SYSTEM_HEALTH'
}

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED'
}

export interface Alert {
  id: string;
  timestamp: number;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  affectedRacks: string[];
  metrics?: Record<string, number>;
  rootCauseAnalysis?: RCAResult;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  resolvedAt?: number;
  correlationId?: string;
  source?: string;
  threshold?: AlertThreshold;
  escalationLevel: number;
  metadata?: Record<string, any>;
}

export interface AlertThreshold {
  metric: string;
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: number;
  duration: number;               // ms
  severity: AlertSeverity;
}

export interface AlertRule {
  id: string;
  name: string;
  alertType: AlertType;
  conditions: AlertThreshold[];
  severity: AlertSeverity;
  isActive: boolean;
  cooldownMs: number;
  description?: string;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

// Root Cause Analysis Types
export interface RCAResult {
  primaryCause: string;
  confidence: number;             // 0.0 to 1.0
  contributingFactors: string[];
  evidence: Evidence[];
  failureTree?: FailureTreeNode;
  recommendations: string[];
  correlationScore: number;
  analysisTime: number;
}

export interface Evidence {
  type: 'METRIC' | 'EVENT' | 'STATE' | 'CORRELATION';
  source: string;
  value: any;
  timestamp: number;
  weight: number;                // 0.0 to 1.0
  description: string;
}

export interface FailureTreeNode {
  id: string;
  description: string;
  type: 'ROOT' | 'INTERMEDIATE' | 'LEAF';
  probability: number;
  children: FailureTreeNode[];
  evidence: Evidence[];
}

export interface RCAChain {
  steps: RCAStep[];
  confidence: number;
  timeToComplete: number;
}

export interface RCAStep {
  step: number;
  analysis: string;
  result: string;
  confidence: number;
  timestamp: number;
}

// Specific Alert Types
export interface TemperatureAlert extends Alert {
  alertType: AlertType.TEMPERATURE;
  metrics: Record<string, number>;
}

export interface PerformanceAlert extends Alert {
  alertType: AlertType.PERFORMANCE;
  metrics: Record<string, number>;
}

export interface CostAlert extends Alert {
  alertType: AlertType.COST;
  metrics: Record<string, number>;
}

export interface SystemHealthAlert extends Alert {
  alertType: AlertType.SYSTEM_HEALTH;
  metrics: Record<string, number>;
}

// Alert Management
export interface AlertConfig {
  rules: AlertRule[];
  globalSettings: {
    enableRCA: boolean;
    enablePredictive: boolean;
    retentionDays: number;
    maxActiveAlerts: number;
    escalationEnabled: boolean;
  };
}

// Predictive Analytics
export interface TrendPrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  timeHorizon: number;           // ms
  confidence: number;             // 0.0 to 1.0
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  accuracy: number;               // Historical accuracy
}

export interface RiskScore {
  equipmentId: string;
  overallRisk: number;            // 0.0 to 1.0
  riskFactors: RiskFactor[];
  recommendedActions: string[];
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface RiskFactor {
  type: 'AGE' | 'HEALTH' | 'MAINTENANCE' | 'ENVIRONMENTAL' | 'WORKLOAD';
  severity: number;               // 0.0 to 1.0
  description: string;
  mitigation?: string;
}

// Alert State Management
export interface AlertState {
  activeAlerts: Map<string, Alert>;
  alertHistory: Alert[];
  rules: Map<string, AlertRule>;
  config: AlertConfig;
  lastRuleCheck: number;
  alertCounts: {
    total: number;
    critical: number;
    warning: number;
    info: number;
    acknowledged: number;
  };
}

// Notification System
export interface NotificationConfig {
  email: {
    enabled: boolean;
    recipients: string[];
    thresholds: AlertSeverity[];
  };
  webhook: {
    enabled: boolean;
    url: string;
    events: string[];
  };
  escalation: {
    enabled: boolean;
    levels: EscalationLevel[];
  };
}

export interface EscalationLevel {
  level: number;
  delayMs: number;
  severity: AlertSeverity;
  recipients: string[];
  actions: string[];
}