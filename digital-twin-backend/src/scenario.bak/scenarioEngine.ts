import {
  Scenario,
  ScenarioExecution,
  ScenarioConfig,
  ScenarioStatus,
  ScenarioPreset,
  ScenarioState,
  ScenarioCategory,
  ScenarioDifficulty,
  ExpectedOutcomes,
  ValidationResult,
  ExecutionEvent
} from '../types/scenario';
import { v4 as uuidv4 } from 'uuid';
import { DigitalTwinState, RackState } from '../types/twin';
import { FailureEngine } from '../failure/failureEngine';

export class ScenarioEngine {
  private state: ScenarioState;
  private failureEngine: FailureEngine;
  private activeExecutions: Map<string, ScenarioExecutionTimer>;

  constructor(failureEngine: FailureEngine) {
    this.failureEngine = failureEngine;
    this.state = {
      activeScenarios: new Map(),
      presetScenarios: new Map(),
      executionHistory: [],
      scenarioTemplates: new Map(),
      lastUpdateTime: Date.now(),
      executionQueue: []
    };
    this.activeExecutions = new Map();
    
    this.initializePresetScenarios();
  }

  private initializePresetScenarios(): void {
    const presets = this.createPresetScenarios();
    for (const preset of presets) {
      this.state.presetScenarios.set(preset.id, preset);
    }
  }

  private createPresetScenarios(): ScenarioPreset[] {
    const presets: ScenarioPreset[] = [];

    // 1. Thermal War Scenario
    presets.push({
      id: 'thermal-war',
      name: 'Thermal War',
      description: 'Maximum heating vs aggressive cooling stress test',
      category: ScenarioCategory.STRESS,
      difficulty: ScenarioDifficulty.HARD,
      tags: ['thermal', 'stress', 'extreme'],
      author: 'HeatNet Team',
      version: '1.0',
      scenario: {
        id: 'thermal-war',
        name: 'Thermal War',
        description: 'Maximum heating vs aggressive cooling stress test',
        category: ScenarioCategory.STRESS,
        isPreset: true,
        parameters: {
          heating: {
            mode: 'HIGH',
            cpuBoost: 40,
            gpuBoost: 60,
            costMultiplier: 5,
            duration: 300000 // 5 minutes
          },
          cooling: {
            mode: 'AGGRESSIVE',
            targetTemp: 16,
            costMultiplier: 5,
            duration: 300000
          },
          durationMs: 300000
        },
        expectedOutcomes: {
          temperatureRange: [20, 35],
          powerRange: [400, 800],
          costRange: [50, 150],
          alertCounts: {
            critical: 5,
            warning: 15,
            info: 0
          },
          failureEvents: 0,
          duration: 300000
        },
        durationMs: 300000,
        tags: ['thermal', 'stress', 'extreme'],
        difficulty: ScenarioDifficulty.HARD,
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      usage: {
        totalExecutions: 0,
        successRate: 0,
        avgScore: 0
      }
    });

    // 2. CRAC Unit Failure
    presets.push({
      id: 'crac-failure',
      name: 'CRAC Unit Failure',
      description: 'Simulate CRAC unit failure with 50% cooling loss',
      category: ScenarioCategory.FAILURE,
      difficulty: ScenarioDifficulty.MEDIUM,
      tags: ['failure', 'crac', 'cooling'],
      author: 'HeatNet Team',
      version: '1.0',
      scenario: {
        id: 'crac-failure',
        name: 'CRAC Unit Failure',
        description: 'Simulate CRAC unit failure with 50% cooling loss',
        category: ScenarioCategory.FAILURE,
        isPreset: true,
        parameters: {
          failures: [
            {
              type: 'CRAC',
              severity: 'MAJOR',
              equipmentId: 'CRAC_1',
              equipmentType: 'CRAC_UNIT',
              parameters: {
                failureMode: 'PARTIAL',
                capacityLoss: 0.5,
                affectedZones: ['Zone_1'],
                compressorFailure: false,
                fanFailure: true
              },
              description: 'CRAC Unit 1 partial failure - 50% capacity loss',
              triggerTime: 0,
              duration: 600000, // 10 minutes
              cascade: false
            }
          ],
          durationMs: 600000
        },
        expectedOutcomes: {
          temperatureRange: [25, 40],
          powerRange: [300, 600],
          costRange: [30, 100],
          alertCounts: {
            critical: 3,
            warning: 8,
            info: 2
          },
          failureEvents: 1,
          duration: 600000
        },
        durationMs: 600000,
        tags: ['failure', 'crac', 'cooling'],
        difficulty: ScenarioDifficulty.MEDIUM,
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      usage: {
        totalExecutions: 0,
        successRate: 0,
        avgScore: 0
      }
    });

    // 3. Pump System Failure
    presets.push({
      id: 'pump-failure',
      name: 'Pump System Failure',
      description: 'Complete pump failure with backup activation',
      category: ScenarioCategory.FAILURE,
      difficulty: ScenarioDifficulty.MEDIUM,
      tags: ['failure', 'pump', 'cooling'],
      author: 'HeatNet Team',
      version: '1.0',
      scenario: {
        id: 'pump-failure',
        name: 'Pump System Failure',
        description: 'Complete pump failure with backup activation',
        category: ScenarioCategory.FAILURE,
        isPreset: true,
        parameters: {
          failures: [
            {
              type: 'PUMP',
              severity: 'CRITICAL',
              equipmentId: 'PUMP_1',
              equipmentType: 'PUMP',
              parameters: {
                failureMode: 'COMPLETE',
                flowReduction: 1.0,
                pressureDrop: 50,
                affectedLoops: ['Loop_1'],
                backupPumpAvailable: false
              },
              description: 'Pump 1 complete failure - no backup available',
              triggerTime: 0,
              duration: 900000, // 15 minutes
              cascade: true
            }
          ],
          durationMs: 900000
        },
        expectedOutcomes: {
          temperatureRange: [28, 45],
          powerRange: [250, 500],
          costRange: [25, 80],
          alertCounts: {
            critical: 5,
            warning: 10,
            info: 3
          },
          failureEvents: 2,
          duration: 900000
        },
        durationMs: 900000,
        tags: ['failure', 'pump', 'cooling'],
        difficulty: ScenarioDifficulty.MEDIUM,
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      usage: {
        totalExecutions: 0,
        successRate: 0,
        avgScore: 0
      }
    });

    // 4. Extreme Heat Wave
    presets.push({
      id: 'heat-wave',
      name: 'Extreme Heat Wave',
      description: 'Environmental stress with extreme ambient temperatures',
      category: ScenarioCategory.FAILURE,
      difficulty: ScenarioDifficulty.HARD,
      tags: ['environmental', 'heat', 'stress'],
      author: 'HeatNet Team',
      version: '1.0',
      scenario: {
        id: 'heat-wave',
        name: 'Extreme Heat Wave',
        description: 'Environmental stress with extreme ambient temperatures',
        category: ScenarioCategory.FAILURE,
        isPreset: true,
        parameters: {
          environmental: {
            ambientTempRise: 15,
            humidityChange: 20,
            duration: 1800000, // 30 minutes
            externalFactors: ['Solar radiation', 'Urban heat island effect']
          },
          heating: {
            mode: 'HIGH',
            costMultiplier: 2,
            duration: 1800000
          },
          durationMs: 1800000
        },
        expectedOutcomes: {
          temperatureRange: [30, 50],
          powerRange: [400, 700],
          costRange: [60, 120],
          alertCounts: {
            critical: 8,
            warning: 20,
            info: 5
          },
          failureEvents: 1,
          duration: 1800000
        },
        durationMs: 1800000,
        tags: ['environmental', 'heat', 'stress'],
        difficulty: ScenarioDifficulty.HARD,
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      usage: {
        totalExecutions: 0,
        successRate: 0,
        avgScore: 0
      }
    });

    // 5. Fan Array Degradation
    presets.push({
      id: 'fan-degradation',
      name: 'Fan Array Degradation',
      description: 'Progressive fan failures across multiple racks',
      category: ScenarioCategory.FAILURE,
      difficulty: ScenarioDifficulty.MEDIUM,
      tags: ['failure', 'fans', 'progressive'],
      author: 'HeatNet Team',
      version: '1.0',
      scenario: {
        id: 'fan-degradation',
        name: 'Fan Array Degradation',
        description: 'Progressive fan failures across multiple racks',
        category: ScenarioCategory.FAILURE,
        isPreset: true,
        parameters: {
          failures: [
            {
              type: 'FAN',
              severity: 'MINOR',
              equipmentId: 'FAN_ARRAY_1',
              equipmentType: 'FAN_ARRAY',
              parameters: {
                failureMode: 'INDIVIDUAL',
                failedUnits: 1,
                totalUnits: 6,
                affectedRacks: ['R1'],
                rpmReduction: 0.2
              },
              description: 'Fan Array 1 - 1 unit failed',
              triggerTime: 0,
              duration: 1200000,
              cascade: false
            },
            {
              type: 'FAN',
              severity: 'MAJOR',
              equipmentId: 'FAN_ARRAY_3',
              equipmentType: 'FAN_ARRAY',
              parameters: {
                failureMode: 'ARRAY',
                failedUnits: 3,
                totalUnits: 6,
                affectedRacks: ['R3'],
                rpmReduction: 0.5
              },
              description: 'Fan Array 3 - 3 units failed',
              triggerTime: 300000, // 5 minutes after start
              duration: 900000,
              cascade: false
            }
          ],
          durationMs: 1200000
        },
        expectedOutcomes: {
          temperatureRange: [24, 38],
          powerRange: [350, 650],
          costRange: [40, 90],
          alertCounts: {
            critical: 2,
            warning: 8,
            info: 4
          },
          failureEvents: 2,
          duration: 1200000
        },
        durationMs: 1200000,
        tags: ['failure', 'fans', 'progressive'],
        difficulty: ScenarioDifficulty.MEDIUM,
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      usage: {
        totalExecutions: 0,
        successRate: 0,
        avgScore: 0
      }
    });

    // 6. Summer Peak Load
    presets.push({
      id: 'summer-peak',
      name: 'Summer Peak Load',
      description: 'High workload with environmental stress',
      category: ScenarioCategory.STRESS,
      difficulty: ScenarioDifficulty.MEDIUM,
      tags: ['workload', 'summer', 'peak'],
      author: 'HeatNet Team',
      version: '1.0',
      scenario: {
        id: 'summer-peak',
        name: 'Summer Peak Load',
        description: 'High workload with environmental stress',
        category: ScenarioCategory.STRESS,
        isPreset: true,
        parameters: {
          heating: {
            mode: 'HIGH',
            cpuBoost: 30,
            gpuBoost: 50,
            costMultiplier: 3,
            duration: 2400000 // 40 minutes
          },
          environmental: {
            ambientTempRise: 8,
            humidityChange: 10,
            duration: 2400000,
            externalFactors: ['Summer conditions']
          },
          durationMs: 2400000
        },
        expectedOutcomes: {
          temperatureRange: [22, 32],
          powerRange: [450, 750],
          costRange: [45, 110],
          alertCounts: {
            critical: 1,
            warning: 6,
            info: 2
          },
          failureEvents: 0,
          duration: 2400000
        },
        durationMs: 2400000,
        tags: ['workload', 'summer', 'peak'],
        difficulty: ScenarioDifficulty.MEDIUM,
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      usage: {
        totalExecutions: 0,
        successRate: 0,
        avgScore: 0
      }
    });

    // 7. Maintenance Window
    presets.push({
      id: 'maintenance-window',
      name: 'Maintenance Window',
      description: 'Planned equipment maintenance with reduced capacity',
      category: ScenarioCategory.MAINTENANCE,
      difficulty: ScenarioDifficulty.EASY,
      tags: ['maintenance', 'planned', 'capacity'],
      author: 'HeatNet Team',
      version: '1.0',
      scenario: {
        id: 'maintenance-window',
        name: 'Maintenance Window',
        description: 'Planned equipment maintenance with reduced capacity',
        category: ScenarioCategory.MAINTENANCE,
        isPreset: true,
        parameters: {
          cooling: {
            mode: 'MINIMAL',
            targetTemp: 20,
            costMultiplier: 0.5,
            duration: 1800000 // 30 minutes
          },
          heating: {
            mode: 'LOW',
            costMultiplier: 0.5,
            duration: 1800000
          },
          durationMs: 1800000
        },
        expectedOutcomes: {
          temperatureRange: [20, 26],
          powerRange: [200, 400],
          costRange: [20, 50],
          alertCounts: {
            critical: 0,
            warning: 2,
            info: 3
          },
          failureEvents: 0,
          duration: 1800000
        },
        durationMs: 1800000,
        tags: ['maintenance', 'planned', 'capacity'],
        difficulty: ScenarioDifficulty.EASY,
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      usage: {
        totalExecutions: 0,
        successRate: 0,
        avgScore: 0
      }
    });

    // 8. Power Brownout
    presets.push({
      id: 'power-brownout',
      name: 'Power Brownout',
      description: 'Extended power fluctuation event',
      category: ScenarioCategory.FAILURE,
      difficulty: ScenarioDifficulty.MEDIUM,
      tags: ['power', 'brownout', 'fluctuation'],
      author: 'HeatNet Team',
      version: '1.0',
      scenario: {
        id: 'power-brownout',
        name: 'Power Brownout',
        description: 'Extended power fluctuation event',
        category: ScenarioCategory.FAILURE,
        isPreset: true,
        parameters: {
          failures: [
            {
              type: 'POWER',
              severity: 'MAJOR',
              equipmentId: 'GRID',
              equipmentType: 'PDU',
              parameters: {
                failureMode: 'BROWNOUT',
                voltageDrop: 0.3,
                frequency: 55,
                affectedZones: ['Zone_1', 'Zone_2'],
                durationMs: 1200000 // 20 minutes
              },
              description: 'Power brownout - 30% voltage drop',
              triggerTime: 0,
              duration: 1200000,
              cascade: false
            }
          ],
          durationMs: 1200000
        },
        expectedOutcomes: {
          temperatureRange: [24, 36],
          powerRange: [250, 450],
          costRange: [30, 70],
          alertCounts: {
            critical: 2,
            warning: 5,
            info: 3
          },
          failureEvents: 1,
          duration: 1200000
        },
        durationMs: 1200000,
        tags: ['power', 'brownout', 'fluctuation'],
        difficulty: ScenarioDifficulty.MEDIUM,
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      usage: {
        totalExecutions: 0,
        successRate: 0,
        avgScore: 0
      }
    });

    // 9. Cascading Failures
    presets.push({
      id: 'cascading-failures',
      name: 'Cascading Failures',
      description: 'Multiple equipment failures with domino effect',
      category: ScenarioCategory.FAILURE,
      difficulty: ScenarioDifficulty.HARD,
      tags: ['cascade', 'multiple', 'critical'],
      author: 'HeatNet Team',
      version: '1.0',
      scenario: {
        id: 'cascading-failures',
        name: 'Cascading Failures',
        description: 'Multiple equipment failures with domino effect',
        category: ScenarioCategory.FAILURE,
        isPreset: true,
        parameters: {
          failures: [
            {
              type: 'CRAC',
              severity: 'CRITICAL',
              equipmentId: 'CRAC_2',
              equipmentType: 'CRAC_UNIT',
              parameters: {
                failureMode: 'COMPLETE',
                capacityLoss: 1.0,
                affectedZones: ['Zone_2'],
                compressorFailure: true,
                fanFailure: true
              },
              description: 'CRAC Unit 2 complete failure',
              triggerTime: 0,
              duration: 1800000,
              cascade: true
            },
            {
              type: 'PUMP',
              severity: 'MAJOR',
              equipmentId: 'PUMP_3',
              equipmentType: 'PUMP',
              parameters: {
                failureMode: 'FLOW_REDUCTION',
                flowReduction: 0.7,
                pressureDrop: 30,
                affectedLoops: ['Loop_2'],
                backupPumpAvailable: false
              },
              description: 'Pump 3 flow reduction due to thermal stress',
              triggerTime: 180000, // 3 minutes after CRAC failure
              duration: 1440000,
              cascade: false
            }
          ],
          durationMs: 1800000
        },
        expectedOutcomes: {
          temperatureRange: [30, 50],
          powerRange: [300, 550],
          costRange: [40, 100],
          alertCounts: {
            critical: 8,
            warning: 15,
            info: 5
          },
          failureEvents: 3,
          duration: 1800000
        },
        durationMs: 1800000,
        tags: ['cascade', 'multiple', 'critical'],
        difficulty: ScenarioDifficulty.HARD,
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      usage: {
        totalExecutions: 0,
        successRate: 0,
        avgScore: 0
      }
    });

    // 10. Optimize for Efficiency
    presets.push({
      id: 'optimize-efficiency',
      name: 'Optimize for Efficiency',
      description: 'Test optimal cooling and heating settings for maximum efficiency',
      category: ScenarioCategory.OPTIMIZATION,
      difficulty: ScenarioDifficulty.EASY,
      tags: ['optimization', 'efficiency', 'balance'],
      author: 'HeatNet Team',
      version: '1.0',
      scenario: {
        id: 'optimize-efficiency',
        name: 'Optimize for Efficiency',
        description: 'Test optimal cooling and heating settings for maximum efficiency',
        category: ScenarioCategory.OPTIMIZATION,
        isPreset: true,
        parameters: {
          cooling: {
            mode: 'NORMAL',
            targetTemp: 22,
            costMultiplier: 1,
            duration: 1800000
          },
          heating: {
            mode: 'LOW',
            costMultiplier: 1,
            duration: 1800000
          },
          durationMs: 1800000
        },
        expectedOutcomes: {
          temperatureRange: [20, 24],
          powerRange: [250, 400],
          costRange: [25, 45],
          alertCounts: {
            critical: 0,
            warning: 0,
            info: 2
          },
          failureEvents: 0,
          duration: 1800000
        },
        durationMs: 1800000,
        tags: ['optimization', 'efficiency', 'balance'],
        difficulty: ScenarioDifficulty.EASY,
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      usage: {
        totalExecutions: 0,
        successRate: 0,
        avgScore: 0
      }
    });

    // 11. Gradual Workload Increase
    presets.push({
      id: 'gradual-workload',
      name: 'Gradual Workload Increase',
      description: 'Slowly increase workload over time to test system response',
      category: ScenarioCategory.TESTING,
      difficulty: ScenarioDifficulty.MEDIUM,
      tags: ['workload', 'gradual', 'testing'],
      author: 'HeatNet Team',
      version: '1.0',
      scenario: {
        id: 'gradual-workload',
        name: 'Gradual Workload Increase',
        description: 'Slowly increase workload over time to test system response',
        category: ScenarioCategory.TESTING,
        isPreset: true,
        parameters: {
          workload: {
            pattern: 'RAMP_UP',
            intensity: 0.8,
            duration: 3600000, // 1 hour
            parameters: {
              rampDuration: 1800000, // 30 minutes to peak
              startIntensity: 0.1,
              peakIntensity: 0.8
            }
          },
          cooling: {
            mode: 'NORMAL',
            costMultiplier: 1.5,
            duration: 3600000
          },
          durationMs: 3600000
        },
        expectedOutcomes: {
          temperatureRange: [20, 28],
          powerRange: [200, 600],
          costRange: [20, 80],
          alertCounts: {
            critical: 0,
            warning: 3,
            info: 5
          },
          failureEvents: 0,
          duration: 3600000
        },
        durationMs: 3600000,
        tags: ['workload', 'gradual', 'testing'],
        difficulty: ScenarioDifficulty.MEDIUM,
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      usage: {
        totalExecutions: 0,
        successRate: 0,
        avgScore: 0
      }
    });

    // 12. Random Stress Test
    presets.push({
      id: 'random-stress',
      name: 'Random Stress Test',
      description: 'Random failure injection and workload changes',
      category: ScenarioCategory.STRESS,
      difficulty: ScenarioDifficulty.HARD,
      tags: ['random', 'stress', 'chaos'],
      author: 'HeatNet Team',
      version: '1.0',
      scenario: {
        id: 'random-stress',
        name: 'Random Stress Test',
        description: 'Random failure injection and workload changes',
        category: ScenarioCategory.STRESS,
        isPreset: true,
        parameters: {
          failures: [
            {
              type: 'FAN',
              severity: 'MINOR',
              equipmentId: 'FAN_ARRAY_5',
              equipmentType: 'FAN_ARRAY',
              parameters: {
                failureMode: 'INDIVIDUAL',
                failedUnits: 2,
                totalUnits: 6,
                affectedRacks: ['R5'],
                rpmReduction: 0.3
              },
              description: 'Random fan array failure',
              triggerTime: Math.random() * 600000, // Random within first 10 minutes
              duration: 900000,
              cascade: false
            }
          ],
          workload: {
            pattern: 'RANDOM',
            intensity: 0.7,
            duration: 2700000, // 45 minutes
            parameters: {
              minInterval: 30000, // 30 seconds
              maxInterval: 300000, // 5 minutes
              minIntensity: 0.2,
              maxIntensity: 0.9
            }
          },
          durationMs: 2700000
        },
        expectedOutcomes: {
          temperatureRange: [18, 35],
          powerRange: [180, 700],
          costRange: [20, 100],
          alertCounts: {
            critical: 2,
            warning: 8,
            info: 6
          },
          failureEvents: 3,
          duration: 2700000
        },
        durationMs: 2700000,
        tags: ['random', 'stress', 'chaos'],
        difficulty: ScenarioDifficulty.HARD,
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      usage: {
        totalExecutions: 0,
        successRate: 0,
        avgScore: 0
      }
    });

    return presets;
  }

  // Execute a scenario
  async executeScenario(scenarioId: string, triggeredBy?: string): Promise<ScenarioExecution> {
    const preset = this.state.presetScenarios.get(scenarioId);
    if (!preset) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    // Check if scenario is already running
    if (this.state.activeScenarios.has(scenarioId)) {
      throw new Error(`Scenario ${scenarioId} is already running`);
    }

    const execution: ScenarioExecution = {
      id: uuidv4(),
      scenarioId,
      startTime: Date.now(),
      status: ScenarioStatus.RUNNING,
      progress: 0,
      events: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      triggeredBy
    };

    // Add start event
    execution.events.push({
      timestamp: Date.now(),
      type: 'ACTION',
      description: `Scenario ${preset.scenario.name} started`,
      severity: 'INFO'
    });

    this.state.activeScenarios.set(scenarioId, execution);
    this.state.executionHistory.push(execution);

    // Start scenario execution timer
    this.startScenarioTimer(scenarioId, preset.scenario);

    // Update preset usage
    preset.usage.totalExecutions++;

    return execution;
  }

  private startScenarioTimer(scenarioId: string, scenario: Scenario): void {
    const execution = this.state.activeScenarios.get(scenarioId);
    if (!execution) return;

    const timer = new ScenarioExecutionTimer(scenarioId, scenario, this.failureEngine);
    this.activeExecutions.set(scenarioId, timer);

    timer.on('progress', (progress: number) => {
      execution.progress = progress;
      execution.updatedAt = Date.now();
    });

    timer.on('event', (event: ExecutionEvent) => {
      execution.events.push(event);
      execution.updatedAt = Date.now();
    });

    timer.on('completed', (actualOutcomes: any) => {
      execution.endTime = Date.now();
      execution.status = ScenarioStatus.COMPLETED;
      execution.actualOutcomes = actualOutcomes;
      execution.progress = 1;
      execution.updatedAt = Date.now();

      // Perform validation if expected outcomes exist
      if (scenario.expectedOutcomes) {
        execution.validationResults = this.validateExecution(execution, scenario.expectedOutcomes);
      }

      // Update preset usage stats
      const preset = this.state.presetScenarios.get(scenarioId);
      if (preset) {
        const score = execution.validationResults?.overallScore || 0;
        preset.usage.avgScore = (preset.usage.avgScore * (preset.usage.totalExecutions - 1) + score) / preset.usage.totalExecutions;
        if (execution.validationResults?.overallScore > 0.7) {
          preset.usage.successRate = (preset.usage.successRate * (preset.usage.totalExecutions - 1) + 1) / preset.usage.totalExecutions;
        }
      }

      this.state.activeScenarios.delete(scenarioId);
      this.activeExecutions.delete(scenarioId);
    });

    timer.on('failed', (error: Error) => {
      execution.endTime = Date.now();
      execution.status = ScenarioStatus.FAILED;
      execution.events.push({
        timestamp: Date.now(),
        type: 'SYSTEM',
        description: `Scenario failed: ${error.message}`,
        severity: 'ERROR'
      });
      execution.updatedAt = Date.now();

      this.state.activeScenarios.delete(scenarioId);
      this.activeExecutions.delete(scenarioId);
    });

    timer.start();
  }

  private validateExecution(execution: ScenarioExecution, expectedOutcomes: ExpectedOutcomes): ValidationResult {
    const actual = execution.actualOutcomes;
    const validation: ValidationResult = {
      temperatureMatch: false,
      powerMatch: false,
      costMatch: false,
      alertMatch: false,
      failureMatch: false,
      durationMatch: false,
      overallScore: 0,
      discrepancies: [],
      recommendations: []
    };

    if (!actual) {
      validation.discrepancies.push('No actual outcomes recorded');
      return validation;
    }

    // Temperature validation
    const avgTemp = actual.temperatureData?.reduce((a: number, b: number) => a + b, 0) / actual.temperatureData?.length || 0;
    const peakTemp = actual.peakTemperature || 0;
    const tempInRange = peakTemp >= expectedOutcomes.temperatureRange[0] && 
                       peakTemp <= expectedOutcomes.temperatureRange[1];
    validation.temperatureMatch = tempInRange;
    if (!tempInRange) {
      validation.discrepancies.push(`Peak temperature ${peakTemp.toFixed(1)}°C outside expected range ${expectedOutcomes.temperatureRange}`);
    }

    // Power validation
    const avgPower = actual.powerData?.reduce((a: number, b: number) => a + b, 0) / actual.powerData?.length || 0;
    const peakPower = actual.peakPower || 0;
    const powerInRange = peakPower >= expectedOutcomes.powerRange[0] && 
                         peakPower <= expectedOutcomes.powerRange[1];
    validation.powerMatch = powerInRange;
    if (!powerInRange) {
      validation.discrepancies.push(`Peak power ${peakPower.toFixed(1)}kW outside expected range ${expectedOutcomes.powerRange}`);
    }

    // Cost validation
    const totalCost = actual.totalCost || 0;
    const costInRange = totalCost >= expectedOutcomes.costRange[0] && 
                       totalCost <= expectedOutcomes.costRange[1];
    validation.costMatch = costInRange;
    if (!costInRange) {
      validation.discrepancies.push(`Total cost $${totalCost.toFixed(2)} outside expected range $${expectedOutcomes.costRange}`);
    }

    // Alert validation
    const actualAlerts = actual.alertCounts;
    if (actualAlerts && expectedOutcomes.alertCounts) {
      validation.alertMatch = 
        Math.abs(actualAlerts.critical - expectedOutcomes.alertCounts.critical) <= 2 &&
        Math.abs(actualAlerts.warning - expectedOutcomes.alertCounts.warning) <= 3;
      
      if (!validation.alertMatch) {
        validation.discrepancies.push(`Alert counts don't match expectations`);
      }
    }

    // Failure validation
    const actualFailures = actual.failureEvents || 0;
    validation.failureMatch = Math.abs(actualFailures - (expectedOutcomes.failureEvents || 0)) <= 1;
    if (!validation.failureMatch) {
      validation.discrepancies.push(`Failure count ${actualFailures} doesn't match expected ${expectedOutcomes.failureEvents}`);
    }

    // Duration validation
    const actualDuration = execution.endTime! - execution.startTime;
    const durationMatch = Math.abs(actualDuration - expectedOutcomes.duration) / expectedOutcomes.duration <= 0.1;
    validation.durationMatch = durationMatch;
    if (!durationMatch) {
      validation.discrepancies.push(`Duration ${(actualDuration/1000/60).toFixed(1)}min doesn't match expected ${(expectedOutcomes.duration/1000/60).toFixed(1)}min`);
    }

    // Calculate overall score
    const matches = [
      validation.temperatureMatch,
      validation.powerMatch,
      validation.costMatch,
      validation.alertMatch,
      validation.failureMatch,
      validation.durationMatch
    ];
    validation.overallScore = matches.filter(Boolean).length / matches.length;

    // Generate recommendations
    if (validation.overallScore < 0.8) {
      validation.recommendations.push('Review scenario parameters for better alignment');
    }
    if (!validation.temperatureMatch) {
      validation.recommendations.push('Adjust cooling settings or environmental conditions');
    }
    if (!validation.powerMatch) {
      validation.recommendations.push('Modify workload patterns or heating settings');
    }

    return validation;
  }

  // Stop a running scenario
  stopScenario(scenarioId: string): boolean {
    const execution = this.state.activeScenarios.get(scenarioId);
    if (!execution) return false;

    const timer = this.activeExecutions.get(scenarioId);
    if (timer) {
      timer.stop();
    }

    execution.endTime = Date.now();
    execution.status = ScenarioStatus.CANCELLED;
    execution.events.push({
      timestamp: Date.now(),
      type: 'SYSTEM',
      description: 'Scenario cancelled by user',
      severity: 'INFO'
    });

    this.state.activeScenarios.delete(scenarioId);
    this.activeExecutions.delete(scenarioId);

    return true;
  }

  // Get all preset scenarios
  getPresetScenarios(): ScenarioPreset[] {
    return Array.from(this.state.presetScenarios.values());
  }

  // Get specific preset scenario
  getPresetScenario(scenarioId: string): ScenarioPreset | undefined {
    return this.state.presetScenarios.get(scenarioId);
  }

  // Get active scenarios
  getActiveScenarios(): ScenarioExecution[] {
    return Array.from(this.state.activeScenarios.values());
  }

  // Get execution history
  getExecutionHistory(limit: number = 50): ScenarioExecution[] {
    return this.state.executionHistory.slice(-limit);
  }

  // Get scenario state
  getState(): ScenarioState {
    return { ...this.state };
  }
}

// Helper class for scenario execution timing
class ScenarioExecutionTimer extends EventEmitter {
  private scenarioId: string;
  private scenario: Scenario;
  private failureEngine: FailureEngine;
  private isRunning = false;
  private startTime = 0;
  private intervalId?: NodeJS.Timeout;

  constructor(scenarioId: string, scenario: Scenario, failureEngine: FailureEngine) {
    super();
    this.scenarioId = scenarioId;
    this.scenario = scenario;
    this.failureEngine = failureEngine;
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = Date.now();

    // Apply initial scenario parameters
    this.applyScenarioParameters();

    // Start progress tracking
    this.intervalId = setInterval(() => {
      if (!this.isRunning) return;

      const elapsed = Date.now() - this.startTime;
      const progress = Math.min(1, elapsed / (this.scenario.durationMs || 300000));
      
      this.emit('progress', progress);

      if (progress >= 1) {
        this.complete();
      }
    }, 1000);
  }

  stop(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private applyScenarioParameters(): void {
    const params = this.scenario.parameters;

    // Apply heating/cooling settings
    if (params.heating) {
      // This would integrate with heating controller
      this.emit('event', {
        timestamp: Date.now(),
        type: 'ACTION',
        description: `Heating set to ${params.heating.mode} mode`,
        severity: 'INFO'
      });
    }

    if (params.cooling) {
      // This would integrate with cooling controller
      this.emit('event', {
        timestamp: Date.now(),
        type: 'ACTION',
        description: `Cooling set to ${params.cooling.mode} mode`,
        severity: 'INFO'
      });
    }

    // Apply failures
    if (params.failures) {
      for (const failureConfig of params.failures) {
        setTimeout(() => {
          if (!this.isRunning) return;

          try {
            switch (failureConfig.type) {
              case 'CRAC':
                this.failureEngine.simulateCRACFailure(failureConfig.equipmentId, failureConfig.parameters);
                break;
              case 'PUMP':
                this.failureEngine.simulatePumpFailure(failureConfig.equipmentId, failureConfig.parameters);
                break;
              case 'FAN':
                this.failureEngine.simulateFanFailure(failureConfig.equipmentId, failureConfig.parameters);
                break;
              case 'POWER':
                this.failureEngine.simulatePowerEvent(failureConfig.parameters);
                break;
            }

            this.emit('event', {
              timestamp: Date.now(),
              type: 'FAILURE',
              description: failureConfig.description,
              severity: failureConfig.severity === 'CRITICAL' ? 'ERROR' : 'WARNING'
            });
          } catch (error) {
            this.emit('failed', error);
          }
        }, failureConfig.triggerTime);
      }
    }
  }

  private complete(): void {
    this.stop();
    
    // Collect actual outcomes (this would integrate with actual system metrics)
    const actualOutcomes = {
      temperatureData: [], // Would collect from twin state
      powerData: [],       // Would collect from twin state
      costData: [],        // Would collect from cost tracking
      alertCounts: {
        critical: 0,
        warning: 0,
        info: 0
      },
      failureEvents: 0,
      duration: Date.now() - this.startTime,
      peakTemperature: 0,
      peakPower: 0,
      totalCost: 0
    };

    this.emit('completed', actualOutcomes);
  }
}

import { EventEmitter } from 'events';