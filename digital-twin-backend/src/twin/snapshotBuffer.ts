import { TwinSnapshot } from "@prisma/client";

type BufferedSnapshot = {
  timestamp: Date;
  avgInletTemp: number;
  maxInletTemp: number;
  totalPowerKW: number;
};

const MAX_BUFFER_SIZE = 1000;

export const snapshotBuffer: BufferedSnapshot[] = [];

export function addToBuffer(snapshot: BufferedSnapshot) {
  snapshotBuffer.push(snapshot);

  // Prevent memory explosion
  if (snapshotBuffer.length > MAX_BUFFER_SIZE) {
    snapshotBuffer.shift(); // drop oldest
  }
}