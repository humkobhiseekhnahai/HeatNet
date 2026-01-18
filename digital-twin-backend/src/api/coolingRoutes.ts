import { Router } from "express";
import { coolingState, setCoolingCommand, disableCooling } from "../cooling/coolingController";
import { twinState } from "../twin/twinState";

export const coolingRouter = Router();

// Get current cooling status
coolingRouter.get("/status", (_req, res) => {
  res.json({
    ...coolingState,
    affectedRacks: coolingState.command?.affectedRacks || Object.keys(twinState.racks),
    timestamp: Date.now()
  });
});

// Set cooling mode
coolingRouter.post("/control", (req, res) => {
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
    disableCooling();
  } else {
    setCoolingCommand(command);
  }
  
  res.json({
    success: true,
    coolingState: {
      ...coolingState,
      affectedRacks: coolingState.command?.affectedRacks || Object.keys(twinState.racks)
    }
  });
});

// Get cooling metrics
coolingRouter.get("/metrics", (_req, res) => {
  const uptimePercentage = coolingState.active ? 
    ((Date.now() - coolingState.lastUpdated) / (1000 * 60 * 60)) : 0;
    
  res.json({
    totalPowerConsumed: coolingState.currentPowerKW,
    totalCost: coolingState.totalCost,
    averageEfficiency: coolingState.efficiency,
    uptimePercentage,
    currentHourlyCost: coolingState.currentPowerKW * 0.12, // $0.12 per kWh
    timestamp: Date.now()
  });
});

// Reset cooling cost counter
coolingRouter.post("/reset", (_req, res) => {
  coolingState.totalCost = 0;
  res.json({ success: true, message: "Cost counter reset" });
});

// Get available cooling modes
coolingRouter.get("/modes", (_req, res) => {
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