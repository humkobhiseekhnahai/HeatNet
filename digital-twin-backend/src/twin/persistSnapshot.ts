import { prisma } from "../db/prisma";
import { twinState } from "./twinState";
import { addToBuffer } from "./snapshotBuffer";

export async function persistSnapshot() {
  const snapshot = {
    timestamp: new Date(twinState.timestamp),
    avgInletTemp: twinState.aggregates.avgInletTemp,
    maxInletTemp: twinState.aggregates.maxInletTemp,
    totalPowerKW: twinState.aggregates.totalPowerKW
  };

  try {
    await prisma.twinSnapshot.create({ data: snapshot });
  } catch (err) {
    console.warn("⚠️ DB unavailable, buffering snapshot");
    addToBuffer(snapshot);
  }
}