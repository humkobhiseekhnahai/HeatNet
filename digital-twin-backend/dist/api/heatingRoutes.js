"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.heatingRouter = void 0;
const express_1 = require("express");
const heatingController_1 = require("../heating/heatingController");
const twinState_1 = require("../twin/twinState");
exports.heatingRouter = (0, express_1.Router)();
// Get current heating status
exports.heatingRouter.get("/status", (_req, res) => {
    res.json({
        ...heatingController_1.heatingState,
        affectedRacks: heatingController_1.heatingState.command?.affectedRacks || Object.keys(twinState_1.twinState.racks),
        timestamp: Date.now()
    });
});
// Set heating mode
exports.heatingRouter.post("/control", (req, res) => {
    const command = req.body;
    // Validate command
    if (!command.mode || !["LOW", "MEDIUM", "HIGH", "CUSTOM", "OFF"].includes(command.mode)) {
        return res.status(400).json({ error: "Invalid heating mode" });
    }
    if (command.targetTemp && (command.targetTemp < 15 || command.targetTemp > 60)) {
        return res.status(400).json({ error: "Target temperature must be between 15°C and 60°C" });
    }
    if (command.cpuBoost && (command.cpuBoost < 0 || command.cpuBoost > 100)) {
        return res.status(400).json({ error: "CPU boost must be between 0 and 100" });
    }
    if (command.gpuBoost && (command.gpuBoost < 0 || command.gpuBoost > 100)) {
        return res.status(400).json({ error: "GPU boost must be between 0 and 100" });
    }
    if (command.maxPowerKW && command.maxPowerKW < 0) {
        return res.status(400).json({ error: "Max power must be positive" });
    }
    if (command.mode === "OFF") {
        (0, heatingController_1.disableHeating)();
    }
    else {
        (0, heatingController_1.setHeatingCommand)(command);
    }
    res.json({
        success: true,
        heatingState: {
            ...heatingController_1.heatingState,
            affectedRacks: heatingController_1.heatingState.command?.affectedRacks || Object.keys(twinState_1.twinState.racks)
        }
    });
});
// Get heating metrics
exports.heatingRouter.get("/metrics", (_req, res) => {
    const uptimePercentage = heatingController_1.heatingState.active ?
        ((Date.now() - heatingController_1.heatingState.lastUpdated) / (1000 * 60 * 60)) : 0;
    res.json({
        totalPowerConsumed: heatingController_1.heatingState.currentPowerKW,
        totalCost: heatingController_1.heatingState.totalCost,
        averageEfficiency: heatingController_1.heatingState.efficiency,
        uptimePercentage,
        currentHourlyCost: heatingController_1.heatingState.currentPowerKW * 0.15, // $0.15 per kWh for heating
        timestamp: Date.now()
    });
});
// Reset heating cost counter
exports.heatingRouter.post("/reset", (_req, res) => {
    heatingController_1.heatingState.totalCost = 0;
    res.json({ success: true, message: "Heating cost counter reset" });
});
// Get available heating modes
exports.heatingRouter.get("/modes", (_req, res) => {
    res.json({
        modes: [
            { mode: "HIGH", description: "Maximum heating with high workload boost", powerMultiplier: 2.5, cpuBoost: 40, gpuBoost: 60 },
            { mode: "MEDIUM", description: "Moderate heating with medium workload boost", powerMultiplier: 1.8, cpuBoost: 25, gpuBoost: 35 },
            { mode: "LOW", description: "Light heating with low workload boost", powerMultiplier: 1.2, cpuBoost: 15, gpuBoost: 20 },
            { mode: "OFF", description: "No artificial heating", powerMultiplier: 0, cpuBoost: 0, gpuBoost: 0 },
            { mode: "CUSTOM", description: "Custom workload and temperature settings", powerMultiplier: "variable" }
        ]
    });
});
// Get heating vs cooling battle status
exports.heatingRouter.get("/battle-status", (_req, res) => {
    res.json({
        heating: {
            active: heatingController_1.heatingState.active,
            powerKW: heatingController_1.heatingState.currentPowerKW,
            costPerHour: heatingController_1.heatingState.currentPowerKW * 0.15
        },
        cooling: {
            // Import dynamically to avoid circular dependencies
            active: require("../cooling/coolingController").coolingState?.active || false,
            powerKW: require("../cooling/coolingController").coolingState?.currentPowerKW || 0,
            costPerHour: (require("../cooling/coolingController").coolingState?.currentPowerKW || 0) * 0.12
        },
        netPowerKW: (heatingController_1.heatingState.currentPowerKW || 0) + (require("../cooling/coolingController").coolingState?.currentPowerKW || 0),
        netCostPerHour: (heatingController_1.heatingState.currentPowerKW * 0.15) + ((require("../cooling/coolingController").coolingState?.currentPowerKW || 0) * 0.12),
        timestamp: Date.now()
    });
});
