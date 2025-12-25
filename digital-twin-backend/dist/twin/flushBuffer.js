"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flushSnapshotBuffer = flushSnapshotBuffer;
const prisma_1 = require("../db/prisma");
const snapshotBuffer_1 = require("./snapshotBuffer");
async function flushSnapshotBuffer() {
    if (snapshotBuffer_1.snapshotBuffer.length === 0)
        return;
    // Write oldest first (time order preserved)
    const snapshot = snapshotBuffer_1.snapshotBuffer.shift();
    try {
        if (snapshot) {
            await prisma_1.prisma.twinSnapshot.create({ data: snapshot });
            console.log("✅ Flushed buffered snapshot");
        }
    }
    catch {
        // DB still down → put snapshot back
        if (snapshot)
            snapshotBuffer_1.snapshotBuffer.unshift(snapshot);
    }
}
