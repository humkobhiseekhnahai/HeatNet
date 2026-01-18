import { CoolingState, CoolingCommand } from "../types/cooling";

export const coolingState: CoolingState = {
  active: false,
  command: null,
  currentPowerKW: 0,
  totalCost: 0,
  efficiency: 0.8,
  lastUpdated: Date.now()
};

export function setCoolingCommand(command: CoolingCommand) {
  coolingState.command = command;
  coolingState.active = true;
  coolingState.lastUpdated = Date.now();
  
  // Calculate initial power requirements
  if (command.maxPowerKW) {
    coolingState.currentPowerKW = Math.min(command.maxPowerKW, calculateRequiredPower(command));
  } else {
    coolingState.currentPowerKW = calculateRequiredPower(command);
  }
}

export function disableCooling() {
  coolingState.active = false;
  coolingState.command = null;
  coolingState.currentPowerKW = 0;
  coolingState.lastUpdated = Date.now();
}

function calculateRequiredPower(command: CoolingCommand): number {
  const basePower = 50; // Base cooling power in kW
  
  switch (command.mode) {
    case "AGGRESSIVE":
      return basePower * 3 * (command.costMultiplier || 2);
    case "NORMAL":
      return basePower * 1.5 * (command.costMultiplier || 1);
    case "MINIMAL":
      return basePower * 0.5 * (command.costMultiplier || 0.5);
    case "OFF":
      return 0;
    case "CUSTOM":
      if (command.targetTemp) {
        // More power for lower temperatures
        const tempFactor = Math.max(0.1, (25 - command.targetTemp) / 10);
        return basePower * tempFactor * (command.costMultiplier || 1);
      }
      return basePower * (command.costMultiplier || 1);
    default:
      return basePower;
  }
}

export function updateCoolingCost(deltaTimeMs: number) {
  if (!coolingState.active || coolingState.currentPowerKW === 0) return;
  
  const deltaTimeHours = deltaTimeMs / (1000 * 60 * 60);
  const costPerKWh = 0.12; // $0.12 per kWh
  
  const energyConsumed = coolingState.currentPowerKW * deltaTimeHours;
  const cost = energyConsumed * costPerKWh;
  
  coolingState.totalCost += cost;
}