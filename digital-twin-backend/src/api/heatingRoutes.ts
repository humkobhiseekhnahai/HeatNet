import { Router } from "express";
import { heatingState, setHeatingCommand, disableHeating } from "../heating/heatingController";
import { twinState } from "../twin/twinState";

export const heatingRouter = Router();

// Get current heating status
heatingRouter.get("/status", (_req, res) => {
  res.json({
    ...heatingState,
    affectedRacks: heatingState.command?.affectedRacks || Object.keys(twinState.racks),
    timestamp: Date.now()
  });
});

// Set heating mode
heatingRouter.post("/control", (req, res) => {
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
    disableHeating();
  } else {
    setHeatingCommand(command);
  }
  
  res.json({
    success: true,
    heatingState: {
      ...heatingState,
      affectedRacks: heatingState.command?.affectedRacks || Object.keys(twinState.racks)
    }
  });
});

// Get heating metrics
heatingRouter.get("/metrics", (_req, res) => {
  const uptimePercentage = heatingState.active ? 
    ((Date.now() - heatingState.lastUpdated) / (1000 * 60 * 60)) : 0;
    
  res.json({
    totalPowerConsumed: heatingState.currentPowerKW,
    totalCost: heatingState.totalCost,
    averageEfficiency: heatingState.efficiency,
    uptimePercentage,
    currentHourlyCost: heatingState.currentPowerKW * 0.15, // $0.15 per kWh for heating
    timestamp: Date.now()
  });
});

// Reset heating cost counter
heatingRouter.post("/reset", (_req, res) => {
  heatingState.totalCost = 0;
  res.json({ success: true, message: "Heating cost counter reset" });
});

// Get available heating modes
heatingRouter.get("/modes", (_req, res) => {
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
heatingRouter.get("/battle-status", (_req, res) => {
  res.json({
    heating: {
      active: heatingState.active,
      powerKW: heatingState.currentPowerKW,
      costPerHour: heatingState.currentPowerKW * 0.15
    },
    cooling: {
      // Import dynamically to avoid circular dependencies
      active: require("../cooling/coolingController").coolingState?.active || false,
      powerKW: require("../cooling/coolingController").coolingState?.currentPowerKW || 0,
      costPerHour: (require("../cooling/coolingController").coolingState?.currentPowerKW || 0) * 0.12
    },
    netPowerKW: (heatingState.currentPowerKW || 0) + (require("../cooling/coolingController").coolingState?.currentPowerKW || 0),
    netCostPerHour: (heatingState.currentPowerKW * 0.15) + ((require("../cooling/coolingController").coolingState?.currentPowerKW || 0) * 0.12),
    timestamp: Date.now()
  });
});