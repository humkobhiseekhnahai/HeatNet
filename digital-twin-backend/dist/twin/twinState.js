"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twinState = void 0;
const RACK_COUNT = 120;
function generateRacks() {
    const racks = {};
    for (let i = 1; i <= RACK_COUNT; i++) {
        const id = `R${i}`;
        racks[id] = {
            cpuUtil: Math.random() * 40,
            gpuUtil: Math.random() * 50,
            inletTemp: 22 + Math.random() * 2,
            outletTemp: 28 + Math.random() * 3,
            fanRPM: 1800 + Math.random() * 400,
            powerKW: 4 + Math.random() * 3,
            coolingEfficiency: 0.85 + Math.random() * 0.15, // 🔑 THIS
            status: "OK"
        };
    }
    return racks;
}
exports.twinState = {
    timestamp: Date.now(),
    zones: [
        {
            zoneId: "ZONE_1",
            aisleType: "COLD",
            racks: Array.from({ length: RACK_COUNT }, (_, i) => `R${i + 1}`)
        }
    ],
    racks: generateRacks(),
    aggregates: {
        avgInletTemp: 0,
        maxInletTemp: 0,
        totalPowerKW: 0
    }
};
