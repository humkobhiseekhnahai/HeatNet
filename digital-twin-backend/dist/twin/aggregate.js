"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeAggregates = computeAggregates;
function computeAggregates(state) {
    const racks = Object.values(state.racks);
    state.aggregates = {
        avgInletTemp: Number((racks.reduce((s, r) => s + r.inletTemp, 0) / racks.length).toFixed(2)),
        maxInletTemp: Math.max(...racks.map(r => r.inletTemp)),
        totalPowerKW: Number(racks.reduce((s, r) => s + r.powerKW, 0).toFixed(2))
    };
}
