"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.heatingState = void 0;
exports.setHeatingCommand = setHeatingCommand;
exports.disableHeating = disableHeating;
exports.updateHeatingCost = updateHeatingCost;
exports.getWorkloadBoost = getWorkloadBoost;
exports.heatingState = {
    active: false,
    command: null,
    currentPowerKW: 0,
    totalCost: 0,
    efficiency: 0.9,
    lastUpdated: Date.now()
};
function setHeatingCommand(command) {
    exports.heatingState.command = command;
    exports.heatingState.active = true;
    exports.heatingState.lastUpdated = Date.now();
    // Calculate initial power requirements
    if (command.maxPowerKW) {
        exports.heatingState.currentPowerKW = Math.min(command.maxPowerKW, calculateRequiredPower(command));
    }
    else {
        exports.heatingState.currentPowerKW = calculateRequiredPower(command);
    }
}
function disableHeating() {
    exports.heatingState.active = false;
    exports.heatingState.command = null;
    exports.heatingState.currentPowerKW = 0;
    exports.heatingState.lastUpdated = Date.now();
}
function calculateRequiredPower(command) {
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
function updateHeatingCost(deltaTimeMs) {
    if (!exports.heatingState.active || exports.heatingState.currentPowerKW === 0)
        return;
    const deltaTimeHours = deltaTimeMs / (1000 * 60 * 60);
    const costPerKWh = 0.15; // $0.15 per kWh for heating (slightly higher than cooling)
    const energyConsumed = exports.heatingState.currentPowerKW * deltaTimeHours;
    const cost = energyConsumed * costPerKWh;
    exports.heatingState.totalCost += cost;
}
function getWorkloadBoost() {
    if (!exports.heatingState.active || !exports.heatingState.command) {
        return { cpuBoost: 0, gpuBoost: 0 };
    }
    const command = exports.heatingState.command;
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
