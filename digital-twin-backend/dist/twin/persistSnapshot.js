"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistSnapshot = persistSnapshot;
const prisma_1 = require("../db/prisma");
const twinState_1 = require("./twinState");
const snapshotBuffer_1 = require("./snapshotBuffer");
async function persistSnapshot() {
    const snapshot = {
        timestamp: new Date(twinState_1.twinState.timestamp),
        avgInletTemp: twinState_1.twinState.aggregates.avgInletTemp,
        maxInletTemp: twinState_1.twinState.aggregates.maxInletTemp,
        totalPowerKW: twinState_1.twinState.aggregates.totalPowerKW
    };
    try {
        await prisma_1.prisma.twinSnapshot.create({ data: snapshot });
    }
    catch (err) {
        console.warn("⚠️ DB unavailable, buffering snapshot");
        (0, snapshotBuffer_1.addToBuffer)(snapshot);
    }
}
