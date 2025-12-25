"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateTick = simulateTick;
const twinState_1 = require("./twinState");
const aggregate_1 = require("./aggregate");
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
function simulateTick() {
    twinState_1.twinState.timestamp = Date.now();
    const BASE_INLET_TEMP = 22;
    const MAX_OUTLET_RISE = 22;
    const COOLING_PULL = 0.07;
    const THERMAL_RESPONSE = 0.08;
    for (const rack of Object.values(twinState_1.twinState.racks)) {
        // CPU (minor effect)
        rack.cpuUtil = clamp(rack.cpuUtil + Math.random() * 4 - 2, 0, 100);
        // GPU workload
        rack.gpuUtil += Math.random() * 4 - 2;
        if (Math.random() < 0.02) {
            rack.gpuUtil += 30 + Math.random() * 30;
        }
        rack.gpuUtil = clamp(rack.gpuUtil, 0, 100);
        // Power
        rack.powerKW = 5 + rack.gpuUtil * 0.05;
        // --- THERMAL MODEL (STABLE) ---
        const targetOutletTemp = BASE_INLET_TEMP +
            Math.min(MAX_OUTLET_RISE, rack.gpuUtil * 0.18);
        rack.outletTemp +=
            (targetOutletTemp - rack.outletTemp) * THERMAL_RESPONSE;
        const efficiency = rack.coolingEfficiency ?? 1;
        rack.inletTemp +=
            (rack.outletTemp - rack.inletTemp) * 0.08 -
                (rack.inletTemp - BASE_INLET_TEMP) * COOLING_PULL * efficiency;
        // Rare airflow issues
        if (Math.random() < 0.01) {
            rack.coolingEfficiency = Math.max(0.6, (rack.coolingEfficiency ?? 1) - 0.15);
        }
        // Gradual recovery
        rack.coolingEfficiency = Math.min(1, (rack.coolingEfficiency ?? 1) + 0.002);
        // Fan response
        rack.fanRPM = clamp(1800 + rack.inletTemp * 30, 1800, 3000);
        // Status
        if (rack.inletTemp > 32)
            rack.status = "HOT";
        else if (rack.inletTemp > 27)
            rack.status = "WARM";
        else
            rack.status = "OK";
        if (rack.coolingEfficiency < 0.7) {
            console.log("⚠️ Poor cooling rack", rack);
        }
    }
    (0, aggregate_1.computeAggregates)(twinState_1.twinState);
    const counts = { OK: 0, WARM: 0, HOT: 0 };
    for (const r of Object.values(twinState_1.twinState.racks)) {
        counts[r.status]++;
    }
    console.log("Status distribution:", counts);
}
