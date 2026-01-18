import express from "express";
import http from "http";
import WebSocket from "ws";

import { twinRouter } from "./api/twinRoutes";
import { coolingRouter } from "./api/coolingRoutes";
import { heatingRouter } from "./api/heatingRoutes";
// Temporarily disabled advanced systems
// import { failureRouter } from "./api/failureRoutes";
// import { alertingRouter } from "./api/alertingRoutes";
// import { scenarioRouter } from "./api/scenarioRoutes";

import { simulateTick } from "./twin/simulator";
import { broadcastUpdate, setupTwinSocket } from "./ws/twinSocket";
import { persistSnapshot } from "./twin/persistSnapshot";
import { flushSnapshotBuffer } from "./twin/flushBuffer";

export function startServer() {
  const app = express();
  const server = http.createServer(app);

  // REST
  app.use(express.json());
  app.use("/twin", twinRouter);
  app.use("/cooling", coolingRouter);
  app.use("/heating", heatingRouter);
  // Temporarily disabled advanced systems
  // app.use("/failures", failureRouter);
  // app.use("/alerts", alertingRouter);
  // app.use("/scenarios", scenarioRouter);

  // WebSocket
  const wss = new WebSocket.Server({
    server,
    path: "/ws/twin"
  });

  setupTwinSocket(wss);

  /**
   * 1️⃣ MAIN SIMULATION LOOP (never blocks)
   */
  let tick = 0;

  setInterval(() => {
    // Main simulation tick with enhanced logging
    const twinState = simulateTick();
    
    // Broadcast update
    broadcastUpdate(wss);

    tick++;
    if (tick % 5 === 0) {
      // Fire-and-forget persistence
      persistSnapshot();
    }
  }, 1000);

  /**
   * 2️⃣ BACKGROUND BUFFER FLUSH LOOP
   */
  setInterval(() => {
    flushSnapshotBuffer();
  }, 2000);

  /**
   * 3️⃣ START SERVER
   */
  server.listen(3000, () => {
    console.log("🚀 Digital Twin Backend running on port 3000");
  });
}