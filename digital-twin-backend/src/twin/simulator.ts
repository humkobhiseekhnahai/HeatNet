import { twinState } from "./twinState";
import { computeAggregates } from "./aggregate";
import { coolingState } from "../cooling/coolingController";
import { updateCoolingCost } from "../cooling/coolingController";
import { heatingState, updateHeatingCost, getWorkloadBoost } from "../heating/heatingController";

const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

import { DigitalTwinState } from "../types/twin";

export function simulateTick(): DigitalTwinState {
    twinState.timestamp = Date.now();

    const BASE_INLET_TEMP = 22;
    const MAX_OUTLET_RISE = 22;
    const COOLING_PULL = 0.03; // Slower cooling response
    const THERMAL_RESPONSE = 0.02; // Much slower thermal response for realistic gradual changes
    
    // Apply cooling override if active
    let coolingOverride = {
        targetInletTemp: BASE_INLET_TEMP,
        coolingForce: 0
    };
    
    if (coolingState.active && coolingState.command) {
        const command = coolingState.command;
        
        switch (command.mode) {
            case "AGGRESSIVE":
                coolingOverride.targetInletTemp = 18;
                coolingOverride.coolingForce = 0.08; // Reduced for more gradual effect
                break;
            case "NORMAL":
                coolingOverride.targetInletTemp = 20;
                coolingOverride.coolingForce = 0.05; // Reduced for more gradual effect
                break;
            case "MINIMAL":
                coolingOverride.targetInletTemp = 24;
                coolingOverride.coolingForce = 0.02; // Reduced for more gradual effect
                break;
            case "CUSTOM":
                const targetTemp = command.targetTemp || BASE_INLET_TEMP;
                coolingOverride.targetInletTemp = targetTemp;
                // Custom cooling force based on how far from current temps
                const tempDifference = Math.abs(targetTemp - BASE_INLET_TEMP);
                coolingOverride.coolingForce = Math.min(0.1, tempDifference * 0.01) * (command.costMultiplier || 1);
                break;
            case "OFF":
                coolingOverride.coolingForce = 0;
                break;
        }
        
        // Apply cost multiplier to cooling effectiveness
        coolingOverride.coolingForce *= (command.costMultiplier || 1);
    }
    
    // Apply heating workload boost if active
    const workloadBoost = getWorkloadBoost();

    for (const rack of Object.values(twinState.racks)) {
        // Check if this rack is affected by heating
        const isAffectedByHeating = !heatingState.active || !heatingState.command?.affectedRacks ||
            heatingState.command.affectedRacks.includes(`R${Object.keys(twinState.racks).indexOf(rack as any) + 1}`);
        
        // Apply heating workload boost
        const appliedCpuBoost = isAffectedByHeating ? workloadBoost.cpuBoost : 0;
        const appliedGpuBoost = isAffectedByHeating ? workloadBoost.gpuBoost : 0;
        
        // Add time-based workload patterns
        const currentTime = Date.now() / 1000;
        const dailyLoadCycle = Math.sin(currentTime / 300) * 10; // 5-minute cycles
        
        // CPU (minor effect + heating boost + daily cycles)
        rack.cpuUtil = clamp(rack.cpuUtil + Math.random() * 2 - 1 + appliedCpuBoost + dailyLoadCycle * 0.1, 0, 100);

        // GPU workload (with heating boost + spike patterns)
        rack.gpuUtil += Math.random() * 2 - 1 + appliedGpuBoost;

        // More frequent and varied workload spikes
        if (Math.random() < 0.03) {
            rack.gpuUtil += 20 + Math.random() * 25; // Can create more heat
        }
        
        // Occasional massive spikes requiring aggressive cooling
        if (Math.random() < 0.005) {
            rack.gpuUtil += 40 + Math.random() * 30; // Heavy computational loads
        }

        rack.gpuUtil = clamp(rack.gpuUtil, 0, 100);

        // Power (increased by heating workload)
        rack.powerKW = 5 + rack.gpuUtil * 0.05;
        
        // Add heating power consumption
        if (isAffectedByHeating && heatingState.active) {
            rack.powerKW += (appliedCpuBoost + appliedGpuBoost) * 0.02; // Additional power for heating
        }

        // --- THERMAL MODEL (STABLE) ---

        const targetOutletTemp =
            BASE_INLET_TEMP +
            Math.min(MAX_OUTLET_RISE, rack.gpuUtil * 0.22 + rack.cpuUtil * 0.08); // More realistic heat generation

        rack.outletTemp +=
            (targetOutletTemp - rack.outletTemp) * THERMAL_RESPONSE;

        const efficiency = rack.coolingEfficiency ?? 1;
        
        // Check if this rack is affected by cooling
        const isAffectedByCooling = !coolingState.active || !coolingState.command?.affectedRacks ||
            coolingState.command.affectedRacks.includes(`R${Object.keys(twinState.racks).indexOf(rack as any) + 1}`);
        
        let additionalCooling = 0;
        if (isAffectedByCooling && coolingOverride.coolingForce > 0) {
            additionalCooling = (rack.inletTemp - coolingOverride.targetInletTemp) * coolingOverride.coolingForce;
        }

        // Gradual temperature changes with thermal inertia
        const heatFromOutlet = (rack.outletTemp - rack.inletTemp) * THERMAL_RESPONSE;
        const ambientCooling = (rack.inletTemp - BASE_INLET_TEMP) * COOLING_PULL * efficiency;
        const activeCooling = additionalCooling * 0.3; // Dampen immediate cooling effect
        
        rack.inletTemp += heatFromOutlet - ambientCooling - activeCooling;
        
        // Apply gradual temperature smoothing to prevent instant changes
        if (rack.previousInletTemp !== undefined) {
            rack.inletTemp = rack.inletTemp * 0.7 + rack.previousInletTemp * 0.3;
        }
        rack.previousInletTemp = rack.inletTemp;

        // Rare airflow issues
        if (Math.random() < 0.01) {
            rack.coolingEfficiency = Math.max(
                0.6,
                (rack.coolingEfficiency ?? 1) - 0.15
            );
        }

        // Gradual recovery
        rack.coolingEfficiency = Math.min(
            1,
            (rack.coolingEfficiency ?? 1) + 0.002
        );

        // Fan response
        rack.fanRPM = clamp(1800 + rack.inletTemp * 30, 1800, 3000);

        // Status - more challenging thresholds
        if (rack.inletTemp > 30) rack.status = "HOT"; // Lowered from 32
        else if (rack.inletTemp > 25) rack.status = "WARM"; // Lowered from 27
        else rack.status = "OK";
    }

    computeAggregates(twinState);

    // Update cooling and heating costs based on power consumption
    updateCoolingCost(1000); // 1 second tick
    updateHeatingCost(1000); // 1 second tick

const counts = { OK: 0, WARM: 0, HOT: 0 };
    const rackDetails = [];
    
    for (const [rackId, r] of Object.entries(twinState.racks)) {
        counts[r.status]++;
        
        // Collect detailed rack information
        rackDetails.push({
            rack: rackId,
            inletTemp: r.inletTemp.toFixed(1),
            outletTemp: r.outletTemp.toFixed(1),
            cpuUtil: r.cpuUtil.toFixed(1),
            gpuUtil: r.gpuUtil.toFixed(1),
            fanRPM: r.fanRPM,
            powerKW: r.powerKW.toFixed(2),
            status: r.status,
            coolingEfficiency: ((r.coolingEfficiency || 1) * 100).toFixed(1) + '%',
            explanation: r.explanation || ''
        });
    }

    console.log("\n=== HEATNET RACK STATUS DETAILED ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Total Racks: ${rackDetails.length}`);
    console.log(`Cooling: ${coolingState.active ? 'ACTIVE' : 'OFF'} | Heating: ${heatingState.active ? 'ACTIVE' : 'OFF'}`);
    console.log(`Status Summary: OK:${counts.OK} | WARM:${counts.WARM} | HOT:${counts.HOT}`);
    
    // Show hot/warm racks first (most important)
    const problematicRacks = rackDetails.filter(r => r.status !== 'OK');
    if (problematicRacks.length > 0) {
        console.log("\n🚨 PROBLEMATIC RACKS (HOT/WARM):");
        console.table(problematicRacks);
    }
    
    // Show top 10 hottest racks
    const hottestRacks = [...rackDetails]
        .sort((a, b) => parseFloat(b.inletTemp) - parseFloat(a.inletTemp))
        .slice(0, 10);
    
    console.log("\n🌡️  TOP 10 HOTTEST RACKS:");
    console.table(hottestRacks);
    
    // Show top 10 highest power consuming racks
    const highestPowerRacks = [...rackDetails]
        .sort((a, b) => parseFloat(b.powerKW) - parseFloat(a.powerKW))
        .slice(0, 10);
    
    console.log("\n⚡ TOP 10 HIGHEST POWER RACKS:");
    console.table(highestPowerRacks);
    
    // Show summary statistics
    const avgTemp = rackDetails.reduce((sum, r) => sum + parseFloat(r.inletTemp), 0) / rackDetails.length;
    const maxTemp = Math.max(...rackDetails.map(r => parseFloat(r.inletTemp)));
    const minTemp = Math.min(...rackDetails.map(r => parseFloat(r.inletTemp)));
    const totalPower = rackDetails.reduce((sum, r) => sum + parseFloat(r.powerKW), 0);
    const avgPower = totalPower / rackDetails.length;
    
    console.log("\n📊 SYSTEM STATISTICS:");
    console.log(`Average Temperature: ${avgTemp.toFixed(2)}°C`);
    console.log(`Temperature Range: ${minTemp.toFixed(1)}°C - ${maxTemp.toFixed(1)}°C`);
    console.log(`Total Power: ${totalPower.toFixed(2)} kW | Average: ${avgPower.toFixed(2)} kW/rack`);
    console.log(`Critical Racks (>32°C): ${rackDetails.filter(r => parseFloat(r.inletTemp) > 32).length}`);
    console.log(`Warm Racks (27-32°C): ${rackDetails.filter(r => parseFloat(r.inletTemp) > 27 && parseFloat(r.inletTemp) <= 32).length}`);
    
    // Show cooling/heating status if active
    if (coolingState.active) {
        console.log(`\n❄️  COOLING STATUS: Mode=${coolingState.command?.mode || 'UNKNOWN'} | Power=${coolingState.currentPowerKW.toFixed(2)}kW | Cost=$${coolingState.totalCost.toFixed(2)}`);
    }
    if (heatingState.active) {
        console.log(`\n🔥 HEATING STATUS: Mode=${heatingState.command?.mode || 'UNKNOWN'} | Power=${heatingState.currentPowerKW.toFixed(2)}kW | Cost=$${heatingState.totalCost.toFixed(2)}`);
    }
    
    console.log("=" .repeat(80));
    
    // Keep original simple log for compatibility
    console.log("Status distribution:", counts, "Cooling:", coolingState.active ? "YES" : "NO", "Heating:", heatingState.active ? "YES" : "NO");
    
    return twinState;
}