"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coolingRouter = void 0;
const express_1 = require("express");
const coolingController_1 = require("../cooling/coolingController");
const twinState_1 = require("../twin/twinState");
exports.coolingRouter = (0, express_1.Router)();
// Get current cooling status
exports.coolingRouter.get("/status", (_req, res) => {
    res.json({
        ...coolingController_1.coolingState,
        affectedRacks: coolingController_1.coolingState.command?.affectedRacks || Object.keys(twinState_1.twinState.racks),
        timestamp: Date.now()
    });
});
// Set cooling mode
exports.coolingRouter.post("/control", (req, res) => {
    const command = req.body;
    // Validate command
    if (!command.mode || !["AGGRESSIVE", "NORMAL", "MINIMAL", "OFF", "CUSTOM"].includes(command.mode)) {
        return res.status(400).json({ error: "Invalid cooling mode" });
    }
    if (command.mode === "CUSTOM" && command.targetTemp && (command.targetTemp < 10 || command.targetTemp > 40)) {
        return res.status(400).json({ error: "Target temperature must be between 10°C and 40°C" });
    }
    if (command.maxPowerKW && command.maxPowerKW < 0) {
        return res.status(400).json({ error: "Max power must be positive" });
    }
    if (command.mode === "OFF") {
        (0, coolingController_1.disableCooling)();
    }
    else {
        (0, coolingController_1.setCoolingCommand)(command);
    }
    res.json({
        success: true,
        coolingState: {
            ...coolingController_1.coolingState,
            affectedRacks: coolingController_1.coolingState.command?.affectedRacks || Object.keys(twinState_1.twinState.racks)
        }
    });
});
// Get cooling metrics
exports.coolingRouter.get("/metrics", (_req, res) => {
    const uptimePercentage = coolingController_1.coolingState.active ?
        ((Date.now() - coolingController_1.coolingState.lastUpdated) / (1000 * 60 * 60)) : 0;
    res.json({
        totalPowerConsumed: coolingController_1.coolingState.currentPowerKW,
        totalCost: coolingController_1.coolingState.totalCost,
        averageEfficiency: coolingController_1.coolingState.efficiency,
        uptimePercentage,
        currentHourlyCost: coolingController_1.coolingState.currentPowerKW * 0.12, // $0.12 per kWh
        timestamp: Date.now()
    });
});
// Reset cooling cost counter
exports.coolingRouter.post("/reset", (_req, res) => {
    coolingController_1.coolingState.totalCost = 0;
    res.json({ success: true, message: "Cost counter reset" });
});
// Get available cooling modes
exports.coolingRouter.get("/modes", (_req, res) => {
    res.json({
        modes: [
            { mode: "AGGRESSIVE", description: "Maximum cooling at high cost", powerMultiplier: 3 },
            { mode: "NORMAL", description: "Balanced cooling at normal cost", powerMultiplier: 1.5 },
            { mode: "MINIMAL", description: "Basic cooling at low cost", powerMultiplier: 0.5 },
            { mode: "OFF", description: "No cooling, lowest cost", powerMultiplier: 0 },
            { mode: "CUSTOM", description: "Custom temperature and power settings", powerMultiplier: "variable" }
        ]
    });
});
