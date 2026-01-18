import { 
  FailureEvent, 
  FailureType, 
  FailureSeverity, 
  EquipmentType,
  OperationalStatus,
  FailureImpact,
  CRACFailureParams,
  PumpFailureParams,
  FanFailureParams,
  PowerFailureParams,
  EnvironmentalFailureParams,
  FailureSimulationState
} from '../types/failure';
import { DigitalTwinState, RackState } from '../types/twin';
import { v4 as uuidv4 } from 'uuid';

export class FailureEngine {
  private state: FailureSimulationState;
  private thermalConstants = {
    COOLING_EFFICIENCY_BASE: 0.7,
    TEMP_RISE_PER_KW: 0.05,
    FAN_EFFICIENCY_FACTOR: 0.8,
    POWER_RECOVERY_RATE: 0.1
  };

  constructor() {
    this.state = {
      activeFailures: new Map(),
      equipmentStates: new Map(),
      failureHistory: [],
      simulationEnabled: true,
      cascadeEnabled: true,
      mtbfEnabled: true,
      lastUpdateTime: Date.now()
    };
    this.initializeEquipmentStates();
  }

  private initializeEquipmentStates(): void {
    // Initialize CRAC units
    for (let i = 1; i <= 4; i++) {
      const id = `CRAC_${i}`;
      this.state.equipmentStates.set(id, {
        id: uuidv4(),
        equipmentId: id,
        equipmentType: EquipmentType.CRAC_UNIT,
        health: 1.0,
        mtbf: 8760, // 1 year in hours
        operationalStatus: OperationalStatus.NORMAL,
        location: `Zone_${Math.ceil(i / 2)}`,
        specifications: {
          capacity: 200, // kW
          fans: 6,
          compressors: 2,
          efficiency: 0.85
        },
        age: 0,
        totalRuntime: 0,
        failureCount: 0
      });
    }

    // Initialize pumps
    for (let i = 1; i <= 6; i++) {
      const id = `PUMP_${i}`;
      this.state.equipmentStates.set(id, {
        id: uuidv4(),
        equipmentId: id,
        equipmentType: EquipmentType.PUMP,
        health: 1.0,
        mtbf: 17520, // 2 years
        operationalStatus: OperationalStatus.NORMAL,
        location: `Loop_${Math.ceil(i / 2)}`,
        specifications: {
          flowRate: 1000, // GPM
          pressure: 50, // PSI
          efficiency: 0.9
        },
        age: 0,
        totalRuntime: 0,
        failureCount: 0
      });
    }

    // Initialize fan arrays
    for (let i = 1; i <= 12; i++) {
      const id = `FAN_ARRAY_${i}`;
      this.state.equipmentStates.set(id, {
        id: uuidv4(),
        equipmentId: id,
        equipmentType: EquipmentType.FAN_ARRAY,
        health: 1.0,
        mtbf: 43800, // 5 years
        operationalStatus: OperationalStatus.NORMAL,
        location: `Rack_${((i - 1) % 10) + 1}`,
        specifications: {
          fans: 6,
          maxRPM: 3000,
          efficiency: 0.85,
          airflow: 5000 // CFM
        },
        age: 0,
        totalRuntime: 0,
        failureCount: 0
      });
    }
  }

  // CRAC Unit Failures
  simulateCRACFailure(equipmentId: string, params: CRACFailureParams): FailureEvent {
    const impact: FailureImpact = {
      coolingEfficiencyLoss: params.capacityLoss,
      powerReduction: params.compressorFailure ? 50 : 25,
      temperatureIncrease: params.capacityLoss * 5,
      affectedRacks: this.getAffectedRacksForCRAC(equipmentId),
      recoveryTimeMs: params.failureMode === 'COMPLETE' ? 3600000 : 1800000
    };

    const failure: FailureEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      failureType: FailureType.CRAC,
      severity: params.capacityLoss > 0.5 ? FailureSeverity.CRITICAL : 
                params.capacityLoss > 0.2 ? FailureSeverity.MAJOR : FailureSeverity.MINOR,
      equipmentId,
      equipmentType: EquipmentType.CRAC_UNIT,
      parameters: params,
      isActive: true,
      cascadeChain: [],
      description: `CRAC Unit ${equipmentId}: ${params.failureMode} failure - ${params.capacityLoss * 100}% capacity loss`,
      expectedDurationMs: impact.recoveryTimeMs,
      impact
    };

    this.injectFailure(failure);
    
    // Check for cascading failures
    if (this.state.cascadeEnabled && params.capacityLoss > 0.7) {
      this.checkForCascadeFailure(failure);
    }

    return failure;
  }

  // Pump Failures
  simulatePumpFailure(equipmentId: string, params: PumpFailureParams): FailureEvent {
    const impact: FailureImpact = {
      coolingEfficiencyLoss: params.flowReduction * 0.8,
      powerReduction: params.flowReduction * 30,
      temperatureIncrease: params.flowReduction * 3,
      affectedRacks: this.getAffectedRacksForPump(equipmentId),
      recoveryTimeMs: params.failureMode === 'COMPLETE' ? 7200000 : 3600000
    };

    const failure: FailureEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      failureType: FailureType.PUMP,
      severity: params.flowReduction > 0.7 ? FailureSeverity.CRITICAL :
                params.flowReduction > 0.3 ? FailureSeverity.MAJOR : FailureSeverity.MINOR,
      equipmentId,
      equipmentType: EquipmentType.PUMP,
      parameters: params,
      isActive: true,
      cascadeChain: [],
      description: `Pump ${equipmentId}: ${params.failureMode} - ${params.flowReduction * 100}% flow reduction`,
      expectedDurationMs: impact.recoveryTimeMs,
      impact
    };

    this.injectFailure(failure);
    return failure;
  }

  // Fan Failures
  simulateFanFailure(equipmentId: string, params: FanFailureParams): FailureEvent {
    const efficiencyLoss = (params.failedUnits / params.totalUnits) * 0.7;
    const impact: FailureImpact = {
      coolingEfficiencyLoss: efficiencyLoss,
      powerReduction: params.failedUnits * 2,
      temperatureIncrease: (params.failedUnits / params.totalUnits) * 2,
      affectedRacks: this.getAffectedRacksForFan(equipmentId),
      recoveryTimeMs: params.failureMode === 'ARRAY' ? 1800000 : 900000
    };

    const failure: FailureEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      failureType: FailureType.FAN,
      severity: (params.failedUnits / params.totalUnits) > 0.5 ? FailureSeverity.CRITICAL :
                (params.failedUnits / params.totalUnits) > 0.2 ? FailureSeverity.MAJOR : FailureSeverity.MINOR,
      equipmentId,
      equipmentType: EquipmentType.FAN_ARRAY,
      parameters: params,
      isActive: true,
      cascadeChain: [],
      description: `Fan Array ${equipmentId}: ${params.failedUnits}/${params.totalUnits} units failed`,
      expectedDurationMs: impact.recoveryTimeMs,
      impact
    };

    this.injectFailure(failure);
    return failure;
  }

  // Power Events
  simulatePowerEvent(params: PowerFailureParams): FailureEvent {
    const impact: FailureImpact = {
      coolingEfficiencyLoss: 0.3,
      powerReduction: params.voltageDrop * 100,
      temperatureIncrease: params.voltageDrop * 2,
      affectedRacks: this.getAffectedRacksForPower(params.affectedZones),
      recoveryTimeMs: params.durationMs
    };

    const failure: FailureEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      failureType: FailureType.POWER,
      severity: params.voltageDrop > 0.5 ? FailureSeverity.CRITICAL :
                params.voltageDrop > 0.2 ? FailureSeverity.MAJOR : FailureSeverity.MINOR,
      equipmentId: 'GRID',
      equipmentType: EquipmentType.PDU,
      parameters: params,
      isActive: true,
      cascadeChain: [],
      description: `Power Event: ${params.failureMode} - ${params.voltageDrop * 100}% voltage drop`,
      expectedDurationMs: params.durationMs,
      impact
    };

    this.injectFailure(failure);
    return failure;
  }

  // Environmental Failures
  simulateEnvironmentalFailure(params: EnvironmentalFailureParams): FailureEvent {
    const impact: FailureImpact = {
      coolingEfficiencyLoss: 0.4,
      powerReduction: 0,
      temperatureIncrease: params.ambientTempRise,
      affectedRacks: [], // Affects all racks
      recoveryTimeMs: params.durationMs
    };

    const failure: FailureEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      failureType: FailureType.ENVIRONMENTAL,
      severity: params.ambientTempRise > 10 ? FailureSeverity.CRITICAL :
                params.ambientTempRise > 5 ? FailureSeverity.MAJOR : FailureSeverity.MINOR,
      equipmentId: 'ENVIRONMENT',
      equipmentType: EquipmentType.SENSOR,
      parameters: params,
      isActive: true,
      cascadeChain: [],
      description: `Environmental: ${params.type} - +${params.ambientTempRise}°C ambient temperature`,
      expectedDurationMs: params.durationMs,
      impact
    };

    this.injectFailure(failure);
    return failure;
  }

  private injectFailure(failure: FailureEvent): void {
    // Add to active failures
    this.state.activeFailures.set(failure.id, failure);
    this.state.failureHistory.push(failure);

    // Update equipment state
    const equipmentState = this.state.equipmentStates.get(failure.equipmentId);
    if (equipmentState) {
      equipmentState.operationalStatus = OperationalStatus.DEGRADED;
      equipmentState.health = Math.max(0.1, equipmentState.health - failure.impact.coolingEfficiencyLoss);
      equipmentState.failureCount++;
      equipmentState.lastFailure = failure.timestamp;
    }

    this.state.lastUpdateTime = Date.now();
  }

  private checkForCascadeFailure(initialFailure: FailureEvent): void {
    // Check if nearby equipment should also fail
    const equipmentState = this.state.equipmentStates.get(initialFailure.equipmentId);
    if (!equipmentState || !equipmentState.location) return;

    // Find equipment in same location
    const nearbyEquipment = Array.from(this.state.equipmentStates.values())
      .filter(eq => eq.location === equipmentState.location && eq.equipmentId !== initialFailure.equipmentId);

    for (const equipment of nearbyEquipment) {
      // Cascade probability based on health and initial failure severity
      const cascadeProbability = (1 - equipment.health) * 
        (initialFailure.severity === FailureSeverity.CRITICAL ? 0.3 : 
         initialFailure.severity === FailureSeverity.MAJOR ? 0.15 : 0.05);

      if (Math.random() < cascadeProbability) {
        // Create cascading failure
        const cascadeFailure: FailureEvent = {
          id: uuidv4(),
          timestamp: Date.now() + Math.random() * 300000, // Random delay up to 5 minutes
          failureType: initialFailure.failureType,
          severity: FailureSeverity.MAJOR,
          equipmentId: equipment.equipmentId,
          equipmentType: equipment.equipmentType,
          parameters: { cascadedFrom: initialFailure.id },
          isActive: false, // Will activate when time comes
          cascadeChain: [initialFailure.id, ...initialFailure.cascadeChain],
          description: `Cascade failure from ${initialFailure.equipmentId}`,
          impact: {
            coolingEfficiencyLoss: 0.3,
            powerReduction: 20,
            temperatureIncrease: 2,
            affectedRacks: []
          }
        };

        this.state.activeFailures.set(cascadeFailure.id, cascadeFailure);
      }
    }
  }

  private getAffectedRacksForCRAC(cracId: string): string[] {
    const cracNum = parseInt(cracId.split('_')[1]);
    const zone = Math.ceil(cracNum / 2);
    
    // Each zone serves 30 racks
    const startRack = (zone - 1) * 30 + 1;
    const endRack = Math.min(startRack + 29, 120);
    
    return Array.from({ length: endRack - startRack + 1 }, (_, i) => 
      `R${startRack + i}`
    );
  }

  private getAffectedRacksForPump(pumpId: string): string[] {
    const pumpNum = parseInt(pumpId.split('_')[1]);
    const loop = Math.ceil(pumpNum / 2);
    
    // Each loop serves 40 racks
    const startRack = (loop - 1) * 40 + 1;
    const endRack = Math.min(startRack + 39, 120);
    
    return Array.from({ length: endRack - startRack + 1 }, (_, i) => 
      `R${startRack + i}`
    );
  }

  private getAffectedRacksForFan(fanId: string): string[] {
    // Each fan array serves one rack
    const rackNum = parseInt(fanId.split('_')[2]);
    return [`R${rackNum}`];
  }

  private getAffectedRacksForPower(zones: string[]): string[] {
    // Map zones to rack ranges
    const affectedRacks: string[] = [];
    for (const zone of zones) {
      const zoneNum = parseInt(zone.split('_')[1]);
      const startRack = (zoneNum - 1) * 30 + 1;
      const endRack = Math.min(startRack + 29, 120);
      
      for (let i = startRack; i <= endRack; i++) {
        affectedRacks.push(`R${i}`);
      }
    }
    return affectedRacks;
  }

  // Apply failure effects to twin state
  applyFailureEffects(twinState: DigitalTwinState): DigitalTwinState {
    const updatedState = JSON.parse(JSON.stringify(twinState));
    
    // Process each active failure
    for (const failure of this.state.activeFailures.values()) {
      if (!failure.isActive) continue;
      
      // Apply temperature increases
      for (const rackId of failure.impact.affectedRacks) {
        if (updatedState.racks[rackId]) {
          // Increase inlet temperature
          updatedState.racks[rackId].inletTemp += failure.impact.temperatureIncrease * 0.1;
          
          // Reduce cooling efficiency
          const currentEfficiency = updatedState.racks[rackId].coolingEfficiency || 1.0;
          updatedState.racks[rackId].coolingEfficiency = 
            Math.max(0.1, currentEfficiency * (1 - failure.impact.coolingEfficiencyLoss));
        }
      }
    }
    
    return updatedState;
  }

  // Update failure states (check for resolved failures, cascading triggers)
  updateFailureStates(): void {
    const currentTime = Date.now();
    const resolvedFailures: string[] = [];
    
    for (const [id, failure] of this.state.activeFailures) {
      // Check if failure should activate (for cascading failures)
      if (!failure.isActive && currentTime >= failure.timestamp) {
        failure.isActive = true;
        this.injectFailure(failure);
        continue;
      }
      
      // Check if failure should resolve
      if (failure.isActive && failure.expectedDurationMs) {
        const elapsed = currentTime - failure.timestamp;
        if (elapsed >= failure.expectedDurationMs) {
          resolvedFailures.push(id);
        }
      }
    }
    
    // Resolve completed failures
    for (const failureId of resolvedFailures) {
      const failure = this.state.activeFailures.get(failureId);
      if (failure) {
        failure.isActive = false;
        failure.resolvedAt = currentTime;
        
        // Update equipment state
        const equipmentState = this.state.equipmentStates.get(failure.equipmentId);
        if (equipmentState) {
          equipmentState.operationalStatus = OperationalStatus.NORMAL;
          // Gradual health recovery
          equipmentState.health = Math.min(1.0, equipmentState.health + 0.1);
        }
        
        // Remove from active failures but keep in history
        this.state.activeFailures.delete(failureId);
      }
    }
    
    this.state.lastUpdateTime = currentTime;
  }

  // Get current failure state
  getState(): FailureSimulationState {
    return { ...this.state };
  }

  // Get active failures for specific equipment
  getActiveFailuresForEquipment(equipmentId: string): FailureEvent[] {
    return Array.from(this.state.activeFailures.values())
      .filter(f => f.equipmentId === equipmentId && f.isActive);
  }

  // Get equipment state
  getEquipmentState(equipmentId: string): any {
    return this.state.equipmentStates.get(equipmentId);
  }

  // Clear all active failures
  clearAllFailures(): void {
    for (const failure of this.state.activeFailures.values()) {
      failure.isActive = false;
      failure.resolvedAt = Date.now();
      
      // Reset equipment states
      const equipmentState = this.state.equipmentStates.get(failure.equipmentId);
      if (equipmentState) {
        equipmentState.operationalStatus = OperationalStatus.NORMAL;
      }
    }
    
    this.state.activeFailures.clear();
  }

  // Clear specific failure
  clearFailure(failureId: string): boolean {
    const failure = this.state.activeFailures.get(failureId);
    if (failure) {
      failure.isActive = false;
      failure.resolvedAt = Date.now();
      
      const equipmentState = this.state.equipmentStates.get(failure.equipmentId);
      if (equipmentState) {
        equipmentState.operationalStatus = OperationalStatus.NORMAL;
      }
      
      this.state.activeFailures.delete(failureId);
      return true;
    }
    return false;
  }
}