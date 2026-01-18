"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coolingState = void 0;
exports.setCoolingCommand = setCoolingCommand;
exports.disableCooling = disableCooling;
exports.updateCoolingCost = updateCoolingCost;
exports.coolingState = {
    active: false,
    command: null,
    currentPowerKW: 0,
    totalCost: 0,
    efficiency: 0.8,
    lastUpdated: Date.now()
};
function setCoolingCommand(command) {
    exports.coolingState.command = command;
    exports.coolingState.active = true;
    exports.coolingState.lastUpdated = Date.now();
    // Calculate initial power requirements
    if (command.maxPowerKW) {
        exports.coolingState.currentPowerKW = Math.min(command.maxPowerKW, calculateRequiredPower(command));
    }
    else {
        exports.coolingState.currentPowerKW = calculateRequiredPower(command);
    }
}
function disableCooling() {
    exports.coolingState.active = false;
    exports.coolingState.command = null;
    exports.coolingState.currentPowerKW = 0;
    exports.coolingState.lastUpdated = Date.now();
}
function calculateRequiredPower(command) {
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
function updateCoolingCost(deltaTimeMs) {
    if (!exports.coolingState.active || exports.coolingState.currentPowerKW === 0)
        return;
    const deltaTimeHours = deltaTimeMs / (1000 * 60 * 60);
    const costPerKWh = 0.12; // $0.12 per kWh
    const energyConsumed = exports.coolingState.currentPowerKW * deltaTimeHours;
    const cost = energyConsumed * costPerKWh;
    exports.coolingState.totalCost += cost;
}
