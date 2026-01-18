import {
  Alert,
  AlertType,
  AlertSeverity,
  AlertStatus,
  AlertRule,
  AlertThreshold,
  RCAResult,
  AlertState,
  Evidence,
  FailureTreeNode,
  TrendPrediction,
  RiskScore
} from '../types/alerting';
import { v4 as uuidv4 } from 'uuid';
import { DigitalTwinState, RackState } from '../types/twin';
import { FailureEngine } from '../failure/failureEngine';

export class AlertEngine {
  private state: AlertState;
  private failureEngine: FailureEngine;
  
  // Default alert thresholds
  private defaultThresholds = {
    temperature: {
      warning: 27,
      critical: 32
    },
    power: {
      warning: 500,
      critical: 800
    },
    cost: {
      warning: 100,
      critical: 200
    },
    health: {
      warning: 0.7,
      critical: 0.4
    }
  };

  constructor(failureEngine: FailureEngine) {
    this.failureEngine = failureEngine;
    this.state = {
      activeAlerts: new Map(),
      alertHistory: [],
      rules: new Map(),
      config: {
        rules: [],
        globalSettings: {
          enableRCA: true,
          enablePredictive: true,
          retentionDays: 30,
          maxActiveAlerts: 1000,
          escalationEnabled: true
        }
      },
      lastRuleCheck: Date.now(),
      alertCounts: {
        total: 0,
        critical: 0,
        warning: 0,
        info: 0,
        acknowledged: 0
      }
    };
    
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Temperature alert rules
    this.createAlertRule({
      name: 'High Inlet Temperature',
      alertType: AlertType.TEMPERATURE,
      conditions: [
        { metric: 'inletTemp', operator: '>', value: this.defaultThresholds.temperature.warning, duration: 300000, severity: AlertSeverity.WARNING },
        { metric: 'inletTemp', operator: '>', value: this.defaultThresholds.temperature.critical, duration: 60000, severity: AlertSeverity.CRITICAL }
      ],
      severity: AlertSeverity.WARNING,
      description: 'Alert when rack inlet temperature exceeds thresholds',
      isActive: true,
      cooldownMs: 300000,
      enabled: true
    });

    // Power alert rules
    this.createAlertRule({
      name: 'High Power Consumption',
      alertType: AlertType.PERFORMANCE,
      conditions: [
        { metric: 'totalPower', operator: '>', value: this.defaultThresholds.power.warning, duration: 600000, severity: AlertSeverity.WARNING },
        { metric: 'totalPower', operator: '>', value: this.defaultThresholds.power.critical, duration: 300000, severity: AlertSeverity.CRITICAL }
      ],
      severity: AlertSeverity.WARNING,
      description: 'Alert when total power consumption exceeds thresholds',
      isActive: true,
      cooldownMs: 300000,
      enabled: true
    });

    // Cost alert rules
    this.createAlertRule({
      name: 'High Operating Cost',
      alertType: AlertType.COST,
      conditions: [
        { metric: 'hourlyCost', operator: '>', value: this.defaultThresholds.cost.warning, duration: 900000, severity: AlertSeverity.WARNING },
        { metric: 'hourlyCost', operator: '>', value: this.defaultThresholds.cost.critical, duration: 600000, severity: AlertSeverity.CRITICAL }
      ],
      severity: AlertSeverity.WARNING,
      description: 'Alert when operating cost exceeds thresholds',
      isActive: true,
      cooldownMs: 300000,
      enabled: true
    });

    // System health alert rules
    this.createAlertRule({
      name: 'Equipment Health Degradation',
      alertType: AlertType.SYSTEM_HEALTH,
      conditions: [
        { metric: 'healthScore', operator: '<', value: this.defaultThresholds.health.warning, duration: 600000, severity: AlertSeverity.WARNING },
        { metric: 'healthScore', operator: '<', value: this.defaultThresholds.health.critical, duration: 300000, severity: AlertSeverity.CRITICAL }
      ],
      severity: AlertSeverity.WARNING,
      description: 'Alert when equipment health score drops below thresholds',
      isActive: true,
      cooldownMs: 300000,
      enabled: true
    });
  }

  // Main alert checking function - called every simulation tick
  checkAlertConditions(twinState: DigitalTwinState): Alert[] {
    const newAlerts: Alert[] = [];
    const currentTime = Date.now();

    // Check temperature alerts
    newAlerts.push(...this.checkTemperatureAlerts(twinState));
    
    // Check performance alerts
    newAlerts.push(...this.checkPerformanceAlerts(twinState));
    
    // Check cost alerts (if cost data is available)
    newAlerts.push(...this.checkCostAlerts(twinState));
    
    // Check system health alerts
    newAlerts.push(...this.checkSystemHealthAlerts());

    // Update existing alerts
    this.updateExistingAlerts();

    return newAlerts;
  }

  private checkTemperatureAlerts(twinState: DigitalTwinState): Alert[] {
    const alerts: Alert[] = [];
    
    for (const [rackId, rack] of Object.entries(twinState.racks)) {
      if (rack.inletTemp > this.defaultThresholds.temperature.warning) {
        const severity = rack.inletTemp > this.defaultThresholds.temperature.critical ? 
          AlertSeverity.CRITICAL : AlertSeverity.WARNING;
        
        const alertId = `temp_${rackId}`;
        
        // Check if alert already exists
        if (!this.state.activeAlerts.has(alertId)) {
          const alert: Alert = {
            id: alertId,
            timestamp: Date.now(),
            alertType: AlertType.TEMPERATURE,
            severity,
            title: `High Temperature: ${rackId}`,
            description: `Rack ${rackId} inlet temperature is ${rack.inletTemp.toFixed(1)}°C`,
            affectedRacks: [rackId],
            metrics: {
              currentTemp: rack.inletTemp,
              thresholdTemp: severity === AlertSeverity.CRITICAL ? 
                this.defaultThresholds.temperature.critical : 
                this.defaultThresholds.temperature.warning,
              rackId,
              trend: this.calculateTemperatureTrend(rackId, rack.inletTemp),
              duration: 0
            },
            status: AlertStatus.ACTIVE,
            source: rackId,
            escalationLevel: 0
          };

          alerts.push(alert);
          
          // Perform RCA if enabled
          if (this.state.config.globalSettings.enableRCA) {
            alert.rootCauseAnalysis = this.performRCA(alert, twinState);
          }
        }
      }
    }
    
    return alerts;
  }

  private checkPerformanceAlerts(twinState: DigitalTwinState): Alert[] {
    const alerts: Alert[] = [];
    const totalPower = twinState.aggregates.totalPowerKW;
    
    if (totalPower > this.defaultThresholds.power.warning) {
      const severity = totalPower > this.defaultThresholds.power.critical ? 
        AlertSeverity.CRITICAL : AlertSeverity.WARNING;
      
      const alertId = `power_total`;
      
      if (!this.state.activeAlerts.has(alertId)) {
        const alert: Alert = {
          id: alertId,
          timestamp: Date.now(),
          alertType: AlertType.PERFORMANCE,
          severity,
          title: 'High Power Consumption',
          description: `Total power consumption is ${totalPower.toFixed(1)} kW`,
          affectedRacks: Object.keys(twinState.racks),
          metrics: {
            metricType: 'POWER',
            currentValue: totalPower,
            thresholdValue: severity === AlertSeverity.CRITICAL ? 
              this.defaultThresholds.power.critical : 
              this.defaultThresholds.power.warning,
            affectedEquipment: ['ALL'],
            deviation: totalPower - (severity === AlertSeverity.CRITICAL ? 
              this.defaultThresholds.power.critical : 
              this.defaultThresholds.power.warning)
          },
          status: AlertStatus.ACTIVE,
          source: 'SYSTEM',
          escalationLevel: 0
        };

        alerts.push(alert);
        
        if (this.state.config.globalSettings.enableRCA) {
          alert.rootCauseAnalysis = this.performRCA(alert, twinState);
        }
      }
    }
    
    return alerts;
  }

  private checkCostAlerts(twinState: DigitalTwinState): Alert[] {
    // This would integrate with cost tracking from cooling/heating systems
    // For now, return empty array - can be enhanced later
    return [];
  }

  private checkSystemHealthAlerts(): Alert[] {
    const alerts: Alert[] = [];
    const failureState = this.failureEngine.getState();
    
    for (const [equipmentId, equipmentState] of failureState.equipmentStates) {
      if (equipmentState.health < this.defaultThresholds.health.warning) {
        const severity = equipmentState.health < this.defaultThresholds.health.critical ? 
          AlertSeverity.CRITICAL : AlertSeverity.WARNING;
        
        const alertId = `health_${equipmentId}`;
        
        if (!this.state.activeAlerts.has(alertId)) {
          const alert: Alert = {
            id: alertId,
            timestamp: Date.now(),
            alertType: AlertType.SYSTEM_HEALTH,
            severity,
            title: `Equipment Health Degradation: ${equipmentId}`,
            description: `Equipment ${equipmentId} health is ${(equipmentState.health * 100).toFixed(1)}%`,
            affectedRacks: [], // Equipment-level alert
            metrics: {
              healthScore: equipmentState.health,
              equipmentType: equipmentState.equipmentType,
              failureCount: equipmentState.failureCount,
              lastMaintenance: equipmentState.lastMaintenance,
              mtbfRemaining: equipmentState.mtbf ? equipmentState.mtbf * 0.5 : undefined
            },
            status: AlertStatus.ACTIVE,
            source: equipmentId,
            escalationLevel: 0
          };

          alerts.push(alert);
        }
      }
    }
    
    return alerts;
  }

  private calculateTemperatureTrend(rackId: string, currentTemp: number): 'RISING' | 'FALLING' | 'STABLE' {
    // This would use historical temperature data
    // For now, return stable as default
    return 'STABLE';
  }

  private updateExistingAlerts(): void {
    const alertsToResolve: string[] = [];
    
    for (const [alertId, alert] of this.state.activeAlerts) {
      // Check if alert conditions still exist
      if (this.shouldResolveAlert(alert)) {
        alertsToResolve.push(alertId);
      } else {
        // Update alert duration and escalate if needed
        const duration = Date.now() - alert.timestamp;
        alert.metrics = {
          ...alert.metrics,
          duration
        };
        
        // Check for escalation
        if (this.state.config.globalSettings.escalationEnabled) {
          this.checkEscalation(alert);
        }
      }
    }
    
    // Resolve alerts that no longer meet conditions
    for (const alertId of alertsToResolve) {
      this.resolveAlert(alertId);
    }
  }

  private shouldResolveAlert(alert: Alert): boolean {
    // This would check current conditions against alert thresholds
    // For now, implement basic logic
    const maxAlertDuration = 3600000; // 1 hour
    
    if (Date.now() - alert.timestamp > maxAlertDuration) {
      return false; // Don't auto-resolve based on time alone
    }
    
    // Check if conditions are still met (simplified)
    return false; // Keep alerts active for demo purposes
  }

  private checkEscalation(alert: Alert): void {
    const escalationIntervals = [600000, 1800000, 3600000]; // 10min, 30min, 1hr
    const duration = Date.now() - alert.timestamp;
    
    for (let i = 0; i < escalationIntervals.length; i++) {
      if (duration > escalationIntervals[i] && alert.escalationLevel <= i) {
        alert.escalationLevel = i + 1;
        break;
      }
    }
  }

  // Root Cause Analysis
  performRCA(alert: Alert, twinState: DigitalTwinState): RCAResult {
    const startTime = Date.now();
    
    // Gather evidence
    const evidence = this.gatherEvidence(alert, twinState);
    
    // Analyze evidence to determine root cause
    const primaryCause = this.identifyPrimaryCause(alert, evidence);
    const confidence = this.calculateConfidence(evidence, primaryCause);
    
    // Build failure tree
    const failureTree = this.buildFailureTree(primaryCause, evidence);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(primaryCause, evidence);
    
    const rcaResult: RCAResult = {
      primaryCause,
      confidence,
      contributingFactors: this.identifyContributingFactors(evidence),
      evidence,
      failureTree,
      recommendations,
      correlationScore: this.calculateCorrelationScore(evidence),
      analysisTime: Date.now() - startTime
    };
    
    return rcaResult;
  }

  private gatherEvidence(alert: Alert, twinState: DigitalTwinState): Evidence[] {
    const evidence: Evidence[] = [];
    const failureState = this.failureEngine.getState();
    
    // System metrics evidence
    if (alert.alertType === AlertType.TEMPERATURE && alert.metrics?.rackId) {
      const rackId = alert.metrics.rackId as string;
      const rack = twinState.racks[rackId];
      
      if (rack) {
        evidence.push({
          type: 'METRIC',
          source: rackId,
          value: rack.inletTemp,
          timestamp: Date.now(),
          weight: 0.8,
          description: `High inlet temperature: ${rack.inletTemp.toFixed(1)}°C`
        });
        
        evidence.push({
          type: 'METRIC',
          source: rackId,
          value: rack.coolingEfficiency || 1.0,
          timestamp: Date.now(),
          weight: 0.6,
          description: `Cooling efficiency: ${((rack.coolingEfficiency || 1.0) * 100).toFixed(1)}%`
        });
      }
    }
    
    // Failure events evidence
    for (const failure of failureState.activeFailures.values()) {
      if (failure.isActive && this.isFailureRelevantToAlert(failure, alert)) {
        evidence.push({
          type: 'EVENT',
          source: failure.equipmentId,
          value: failure,
          timestamp: failure.timestamp,
          weight: 0.9,
          description: `Active failure: ${failure.description}`
        });
      }
    }
    
    // Equipment state evidence
    for (const [equipmentId, equipmentState] of failureState.equipmentStates) {
      if (equipmentState.health < 0.7) {
        evidence.push({
          type: 'STATE',
          source: equipmentId,
          value: equipmentState.health,
          timestamp: Date.now(),
          weight: 0.5,
          description: `Equipment health degradation: ${(equipmentState.health * 100).toFixed(1)}%`
        });
      }
    }
    
    return evidence.sort((a, b) => b.weight - a.weight);
  }

  private isFailureRelevantToAlert(failure: any, alert: Alert): boolean {
    // Check if failure affects the same equipment/racks as the alert
    if (alert.alertType === AlertType.TEMPERATURE && alert.affectedRacks) {
      return failure.impact.affectedRacks.some((rackId: string) => 
        alert.affectedRacks.includes(rackId)
      );
    }
    
    return false;
  }

  private identifyPrimaryCause(alert: Alert, evidence: Evidence[]): string {
    // Sort evidence by weight and find the highest-weight relevant evidence
    const relevantEvidence = evidence.filter(e => e.weight > 0.7);
    
    if (relevantEvidence.length === 0) {
      return 'Unknown - insufficient evidence';
    }
    
    const topEvidence = relevantEvidence[0];
    
    if (topEvidence.type === 'EVENT') {
      return `Equipment failure: ${topEvidence.source}`;
    } else if (topEvidence.type === 'METRIC' && alert.alertType === AlertType.TEMPERATURE) {
      return 'Cooling system insufficiency';
    } else if (topEvidence.type === 'STATE') {
      return `Equipment degradation: ${topEvidence.source}`;
    }
    
    return 'System anomaly detected';
  }

  private calculateConfidence(evidence: Evidence[], primaryCause: string): number {
    let totalWeight = 0;
    let supportingWeight = 0;
    
    for (const ev of evidence) {
      totalWeight += ev.weight;
      
      // Check if evidence supports the primary cause
      if (ev.description.toLowerCase().includes('failure') && 
          primaryCause.toLowerCase().includes('failure')) {
        supportingWeight += ev.weight;
      }
    }
    
    return totalWeight > 0 ? supportingWeight / totalWeight : 0.1;
  }

  private buildFailureTree(primaryCause: string, evidence: Evidence[]): FailureTreeNode {
    const root: FailureTreeNode = {
      id: uuidv4(),
      description: primaryCause,
      type: 'ROOT',
      probability: 0.8,
      children: [],
      evidence: evidence.filter(e => e.weight > 0.7)
    };
    
    // Add intermediate causes based on evidence
    for (const ev of evidence.slice(0, 3)) { // Top 3 pieces of evidence
      const child: FailureTreeNode = {
        id: uuidv4(),
        description: ev.description,
        type: 'INTERMEDIATE',
        probability: ev.weight,
        children: [],
        evidence: [ev]
      };
      root.children.push(child);
    }
    
    return root;
  }

  private identifyContributingFactors(evidence: Evidence[]): string[] {
    return evidence
      .filter(e => e.weight > 0.5 && e.weight < 0.8)
      .map(e => e.description)
      .slice(0, 5);
  }

  private calculateCorrelationScore(evidence: Evidence[]): number {
    if (evidence.length === 0) return 0.1;
    
    const averageWeight = evidence.reduce((sum, e) => sum + e.weight, 0) / evidence.length;
    return Math.min(1.0, averageWeight);
  }

  private generateRecommendations(primaryCause: string, evidence: Evidence[]): string[] {
    const recommendations: string[] = [];
    
    if (primaryCause.toLowerCase().includes('failure')) {
      recommendations.push('Inspect and repair failed equipment immediately');
      recommendations.push('Check backup systems and activate if available');
      recommendations.push('Review maintenance schedule for preventive measures');
    }
    
    if (evidence.some(e => e.description.toLowerCase().includes('cooling'))) {
      recommendations.push('Verify cooling system operation');
      recommendations.push('Check airflow and ventilation');
      recommendations.push('Review temperature setpoints');
    }
    
    if (evidence.some(e => e.description.toLowerCase().includes('health'))) {
      recommendations.push('Schedule maintenance for degraded equipment');
      recommendations.push('Monitor equipment performance closely');
      recommendations.push('Consider equipment replacement if health continues to decline');
    }
    
    recommendations.push('Document incident for future analysis');
    
    return recommendations;
  }

  // Alert management methods
  createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'status' | 'escalationLevel'>): Alert {
    const newAlert: Alert = {
      ...alert,
      id: uuidv4(),
      timestamp: Date.now(),
      status: AlertStatus.ACTIVE,
      escalationLevel: 0
    };
    
    this.state.activeAlerts.set(newAlert.id, newAlert);
    this.state.alertHistory.push(newAlert);
    
    // Update counts
    this.updateAlertCounts();
    
    return newAlert;
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.state.activeAlerts.get(alertId);
    if (alert) {
      alert.status = AlertStatus.ACKNOWLEDGED;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = Date.now();
      
      this.updateAlertCounts();
      return true;
    }
    return false;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.state.activeAlerts.get(alertId);
    if (alert) {
      alert.status = AlertStatus.RESOLVED;
      alert.resolvedAt = Date.now();
      
      this.state.activeAlerts.delete(alertId);
      this.updateAlertCounts();
      return true;
    }
    return false;
  }

  private updateAlertCounts(): void {
    this.state.alertCounts = {
      total: this.state.activeAlerts.size,
      critical: Array.from(this.state.activeAlerts.values()).filter(a => a.severity === AlertSeverity.CRITICAL).length,
      warning: Array.from(this.state.activeAlerts.values()).filter(a => a.severity === AlertSeverity.WARNING).length,
      info: Array.from(this.state.activeAlerts.values()).filter(a => a.severity === AlertSeverity.INFO).length,
      acknowledged: Array.from(this.state.activeAlerts.values()).filter(a => a.status === AlertStatus.ACKNOWLEDGED).length
    };
  }

  // Alert rule management
  createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): AlertRule {
    const newRule: AlertRule = {
      ...rule,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.state.rules.set(newRule.id, newRule);
    return newRule;
  }

  // Get methods
  getActiveAlerts(): Alert[] {
    return Array.from(this.state.activeAlerts.values());
  }

  getAlertHistory(limit: number = 100): Alert[] {
    return this.state.alertHistory.slice(-limit);
  }

  getAlertCounts(): any {
    return this.state.alertCounts;
  }

  getState(): AlertState {
    return { ...this.state };
  }
}