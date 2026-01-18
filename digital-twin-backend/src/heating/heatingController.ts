import { HeatingState, HeatingCommand } from "../types/heating";

export const heatingState: HeatingState = {
  active: false,
  command: null,
  currentPowerKW: 0,
  totalCost: 0,
  efficiency: 0.9,
  lastUpdated: Date.now()
};

export function setHeatingCommand(command: HeatingCommand) {
  heatingState.command = command;
  heatingState.active = true;
  heatingState.lastUpdated = Date.now();
  
  // Calculate initial power requirements
  if (command.maxPowerKW) {
    heatingState.currentPowerKW = Math.min(command.maxPowerKW, calculateRequiredPower(command));
  } else {
    heatingState.currentPowerKW = calculateRequiredPower(command);
  }
}

export function disableHeating() {
  heatingState.active = false;
  heatingState.command = null;
  heatingState.currentPowerKW = 0;
  heatingState.lastUpdated = Date.now();
}

function calculateRequiredPower(command: HeatingCommand): number {
  const basePower = 30; // Base heating power in kW
  
  switch (command.mode) {
    case "HIGH":
      return basePower * 2.5 * (command.costMultiplier || 2);
    case "MEDIUM":
      return basePower * 1.8 * (command.costMultiplier || 1.5);
    case "LOW":
      return basePower * 1.2 * (command.costMultiplier || 1);
    case "OFF":
      return 0;
    case "CUSTOM":
      if (command.targetTemp) {
        // More power for higher temperatures
        const tempFactor = Math.max(0.5, (command.targetTemp - 22) / 15);
        return basePower * tempFactor * (command.costMultiplier || 1);
      }
      if (command.cpuBoost || command.gpuBoost) {
        const workloadFactor = ((command.cpuBoost || 0) + (command.gpuBoost || 0)) / 200;
        return basePower * (0.5 + workloadFactor) * (command.costMultiplier || 1);
      }
      return basePower * (command.costMultiplier || 1);
    default:
      return basePower;
  }
}

export function updateHeatingCost(deltaTimeMs: number) {
  if (!heatingState.active || heatingState.currentPowerKW === 0) return;
  
  const deltaTimeHours = deltaTimeMs / (1000 * 60 * 60);
  const costPerKWh = 0.15; // $0.15 per kWh for heating (slightly higher than cooling)
  
  const energyConsumed = heatingState.currentPowerKW * deltaTimeHours;
  const cost = energyConsumed * costPerKWh;
  
  heatingState.totalCost += cost;
}

export function getWorkloadBoost(): { cpuBoost: number; gpuBoost: number } {
  if (!heatingState.active || !heatingState.command) {
    return { cpuBoost: 0, gpuBoost: 0 };
  }
  
  const command = heatingState.command;
  
  switch (command.mode) {
    case "HIGH":
      return { cpuBoost: 40, gpuBoost: 60 };
    case "MEDIUM":
      return { cpuBoost: 25, gpuBoost: 35 };
    case "LOW":
      return { cpuBoost: 15, gpuBoost: 20 };
    case "CUSTOM":
      return {
        cpuBoost: command.cpuBoost || 0,
        gpuBoost: command.gpuBoost || 0
      };
    case "OFF":
      return { cpuBoost: 0, gpuBoost: 0 };
    default:
      return { cpuBoost: 0, gpuBoost: 0 };
  }
}