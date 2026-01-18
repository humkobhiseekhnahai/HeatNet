import { 
  EquipmentState, 
  EquipmentType, 
  OperationalStatus,
  FailureSimulationState
} from '../types/failure';
import { v4 as uuidv4 } from 'uuid';

export class HealthTracker {
  private failureSimulationState: FailureSimulationState;
  
  // MTBF constants for different equipment types (in hours)
  private readonly MTBF_CONSTANTS = {
    [EquipmentType.CRAC_UNIT]: 8760,      // 1 year
    [EquipmentType.PUMP]: 17520,           // 2 years  
    [EquipmentType.FAN_ARRAY]: 43800,      // 5 years
    [EquipmentType.PDU]: 26280,            // 3 years
    [EquipmentType.SENSOR]: 6570           // 9 months
  };

  // Aging rates (health decrease per 1000 operating hours)
  private readonly AGING_RATES = {
    [EquipmentType.CRAC_UNIT]: 0.02,
    [EquipmentType.PUMP]: 0.015,
    [EquipmentType.FAN_ARRAY]: 0.01,
    [EquipmentType.PDU]: 0.025,
    [EquipmentType.SENSOR]: 0.03
  };

  // Maintenance intervals (in hours)
  private readonly MAINTENANCE_INTERVALS = {
    [EquipmentType.CRAC_UNIT]: 2160,      // 3 months
    [EquipmentType.PUMP]: 4320,           // 6 months
    [EquipmentType.FAN_ARRAY]: 8760,      // 1 year
    [EquipmentType.PDU]: 2160,            // 3 months
    [EquipmentType.SENSOR]: 1080          // 6 weeks
  };

  constructor(failureSimulationState: FailureSimulationState) {
    this.failureSimulationState = failureSimulationState;
  }

  // Update equipment health based on runtime and age
  updateEquipmentHealth(deltaTimeMs: number): void {
    const deltaTimeHours = deltaTimeMs / (1000 * 60 * 60);
    
    for (const equipmentState of this.failureSimulationState.equipmentStates.values()) {
      // Update runtime
      if (equipmentState.operationalStatus === OperationalStatus.NORMAL) {
        equipmentState.totalRuntime += deltaTimeHours;
        equipmentState.age += deltaTimeHours;
      }

      // Apply aging
      const agingRate = this.AGING_RATES[equipmentState.equipmentType];
      const ageInThousands = equipmentState.totalRuntime / 1000;
      equipmentState.health = Math.max(0.1, 
        equipmentState.health - (agingRate * ageInThousands * deltaTimeHours / 1000));

      // Check for maintenance needs
      this.checkMaintenanceNeeds(equipmentState);

      // Check for potential failures based on MTBF
      if (this.failureSimulationState.mtbfEnabled) {
        this.checkForMTBFFailure(equipmentState);
      }

      // Update operational status based on health
      this.updateOperationalStatus(equipmentState);
    }
  }

  private checkMaintenanceNeeds(equipmentState: EquipmentState): void {
    const interval = this.MAINTENANCE_INTERVALS[equipmentState.equipmentType];
    const lastMaintenance = equipmentState.lastMaintenance || 0;
    const timeSinceMaintenance = equipmentState.totalRuntime - lastMaintenance;

    if (timeSinceMaintenance >= interval) {
      // Schedule maintenance - temporarily degrade performance
      equipmentState.operationalStatus = OperationalStatus.MAINTENANCE;
      
      // In a real system, this would trigger maintenance workflow
      // For simulation, we'll complete maintenance after a delay
      setTimeout(() => {
        this.completeMaintenance(equipmentState.equipmentId);
      }, 300000); // 5 minutes maintenance time
    }
  }

  private completeMaintenance(equipmentId: string): void {
    const equipmentState = this.failureSimulationState.equipmentStates.get(equipmentId);
    if (equipmentState) {
      equipmentState.operationalStatus = OperationalStatus.NORMAL;
      equipmentState.lastMaintenance = equipmentState.totalRuntime;
      
      // Maintenance improves health
      const healthImprovement = Math.min(0.2, 1.0 - equipmentState.health);
      equipmentState.health = Math.min(1.0, equipmentState.health + healthImprovement);
    }
  }

  private checkForMTBFFailure(equipmentState: EquipmentState): void {
    const mtbf = this.MTBF_CONSTANTS[equipmentState.equipmentType];
    
    // Calculate failure probability based on health and age
    const healthFactor = 1 - equipmentState.health; // Poor health increases probability
    const ageFactor = Math.min(1.0, equipmentState.totalRuntime / mtbf);
    
    // Adjust MTBF based on current condition
    const adjustedMTBF = mtbf * (1 + healthFactor * 2) / (1 + ageFactor);
    
    // Exponential failure probability
    const failureProbability = 1 - Math.exp(-deltaTime / adjustedMTBF);
    
    // Add random component for realism
    const randomFactor = 0.5 + Math.random();
    const adjustedProbability = failureProbability * randomFactor * 0.001; // Scale down for simulation
    
    if (Math.random() < adjustedProbability) {
      // This would trigger a failure in the FailureEngine
      this.triggerRandomFailure(equipmentState);
    }
  }

  private triggerRandomFailure(equipmentState: EquipmentState): void {
    // This would integrate with the FailureEngine to inject a random failure
    // For now, just mark as degraded
    equipmentState.operationalStatus = OperationalStatus.DEGRADED;
    equipmentState.health = Math.max(0.1, equipmentState.health - 0.2);
  }

  private updateOperationalStatus(equipmentState: EquipmentState): void {
    if (equipmentState.operationalStatus === OperationalStatus.MAINTENANCE) {
      return; // Don't override maintenance status
    }

    // Update status based on health
    if (equipmentState.health >= 0.9) {
      equipmentState.operationalStatus = OperationalStatus.NORMAL;
    } else if (equipmentState.health >= 0.6) {
      equipmentState.operationalStatus = OperationalStatus.DEGRADED;
    } else if (equipmentState.health >= 0.3) {
      equipmentState.operationalStatus = OperationalStatus.DEGRADED;
    } else {
      equipmentState.operationalStatus = OperationalStatus.FAILED;
    }
  }

  // Get equipment health summary
  getHealthSummary(): HealthSummary {
    const summary: HealthSummary = {
      totalEquipment: 0,
      equipmentByType: {},
      averageHealth: 0,
      criticalEquipment: [],
      maintenanceNeeded: [],
      failurePredictions: []
    };

    let totalHealth = 0;
    
    for (const equipmentState of this.failureSimulationState.equipmentStates.values()) {
      summary.totalEquipment++;
      totalHealth += equipmentState.health;

      // Group by type
      const type = equipmentState.equipmentType;
      if (!summary.equipmentByType[type]) {
        summary.equipmentByType[type] = {
          total: 0,
          averageHealth: 0,
          critical: 0,
          degraded: 0,
          normal: 0
        };
      }
      
      summary.equipmentByType[type].total++;
      summary.equipmentByType[type].averageHealth += equipmentState.health;

      // Categorize by status
      if (equipmentState.operationalStatus === OperationalStatus.FAILED) {
        summary.criticalEquipment.push(equipmentState.equipmentId);
        summary.equipmentByType[type].critical++;
      } else if (equipmentState.operationalStatus === OperationalStatus.DEGRADED) {
        summary.equipmentByType[type].degraded++;
      } else if (equipmentState.operationalStatus === OperationalStatus.MAINTENANCE) {
        summary.maintenanceNeeded.push(equipmentState.equipmentId);
      } else {
        summary.equipmentByType[type].normal++;
      }

      // Predict failures for critical health equipment
      if (equipmentState.health < 0.4) {
        summary.failurePredictions.push({
          equipmentId: equipmentState.equipmentId,
          type: equipmentState.equipmentType,
          health: equipmentState.health,
          predictedFailureTime: this.predictFailureTime(equipmentState),
          confidence: this.calculateFailureConfidence(equipmentState)
        });
      }
    }

    // Calculate averages
    summary.averageHealth = totalHealth / summary.totalEquipment;
    
    for (const type in summary.equipmentByType) {
      const typeInfo = summary.equipmentByType[type];
      typeInfo.averageHealth = typeInfo.averageHealth / typeInfo.total;
    }

    return summary;
  }

  private predictFailureTime(equipmentState: EquipmentState): number {
    const mtbf = this.MTBF_CONSTANTS[equipmentState.equipmentType];
    const healthFactor = equipmentState.health;
    
    // Estimate remaining time before failure
    const remainingRuntime = mtbf * healthFactor * 0.5; // Conservative estimate
    return Date.now() + (remainingRuntime * 60 * 60 * 1000); // Convert to milliseconds
  }

  private calculateFailureConfidence(equipmentState: EquipmentState): number {
    const ageFactor = Math.min(1.0, equipmentState.totalRuntime / this.MTBF_CONSTANTS[equipmentState.equipmentType]);
    const healthFactor = 1 - equipmentState.health;
    const failureHistoryFactor = Math.min(1.0, equipmentState.failureCount / 5);
    
    return Math.min(1.0, (healthFactor * 0.5 + ageFactor * 0.3 + failureHistoryFactor * 0.2));
  }

  // Get maintenance schedule
  getMaintenanceSchedule(hoursAhead: number = 720): MaintenanceItem[] {
    const schedule: MaintenanceItem[] = [];
    const currentTime = Date.now();
    const futureTime = currentTime + (hoursAhead * 60 * 60 * 1000);

    for (const equipmentState of this.failureSimulationState.equipmentStates.values()) {
      const interval = this.MAINTENANCE_INTERVALS[equipmentState.equipmentType];
      const lastMaintenance = equipmentState.lastMaintenance || 0;
      
      // Calculate next maintenance time
      const nextMaintenanceRuntime = lastMaintenance + interval;
      const timeUntilMaintenance = nextMaintenanceRuntime - equipmentState.totalRuntime;
      
      if (timeUntilMaintenance > 0 && timeUntilMaintenance <= hoursAhead) {
        schedule.push({
          equipmentId: equipmentState.equipmentId,
          equipmentType: equipmentState.equipmentType,
          scheduledTime: currentTime + (timeUntilMaintenance * 60 * 60 * 1000),
          estimatedDuration: this.getMaintenanceDuration(equipmentState.equipmentType),
          priority: this.getMaintenancePriority(equipmentState),
          description: `Routine maintenance for ${equipmentState.equipmentType} ${equipmentState.equipmentId}`
        });
      }
    }

    return schedule.sort((a, b) => a.scheduledTime - b.scheduledTime);
  }

  private getMaintenanceDuration(equipmentType: EquipmentType): number {
    // Return duration in minutes
    switch (equipmentType) {
      case EquipmentType.CRAC_UNIT: return 240; // 4 hours
      case EquipmentType.PUMP: return 180;      // 3 hours
      case EquipmentType.FAN_ARRAY: return 120; // 2 hours
      case EquipmentType.PDU: return 60;         // 1 hour
      case EquipmentType.SENSOR: return 30;     // 30 minutes
      default: return 120;
    }
  }

  private getMaintenancePriority(equipmentState: EquipmentState): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (equipmentState.health < 0.3) return 'CRITICAL';
    if (equipmentState.health < 0.5) return 'HIGH';
    if (equipmentState.health < 0.7) return 'MEDIUM';
    return 'LOW';
  }
}

// Supporting interfaces
export interface HealthSummary {
  totalEquipment: number;
  equipmentByType: Record<string, {
    total: number;
    averageHealth: number;
    critical: number;
    degraded: number;
    normal: number;
  }>;
  averageHealth: number;
  criticalEquipment: string[];
  maintenanceNeeded: string[];
  failurePredictions: FailurePrediction[];
}

export interface FailurePrediction {
  equipmentId: string;
  type: EquipmentType;
  health: number;
  predictedFailureTime: number;
  confidence: number;
}

export interface MaintenanceItem {
  equipmentId: string;
  equipmentType: EquipmentType;
  scheduledTime: number;
  estimatedDuration: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}