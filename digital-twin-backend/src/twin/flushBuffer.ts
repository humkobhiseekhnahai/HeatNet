import { prisma } from "../db/prisma";
import { snapshotBuffer } from "./snapshotBuffer";

export async function flushSnapshotBuffer() {
    if (snapshotBuffer.length === 0) return;
    // Write oldest first (time order preserved)
    const snapshot = snapshotBuffer.shift();

    try {
        if (snapshot) {
            await prisma.twinSnapshot.create({ data: snapshot });
            console.log("✅ Flushed buffered snapshot");
        }
    } catch {
        // DB still down → put snapshot back
        if (snapshot) snapshotBuffer.unshift(snapshot);
    }
}