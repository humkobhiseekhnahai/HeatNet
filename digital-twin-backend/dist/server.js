"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const ws_1 = __importDefault(require("ws"));
const twinRoutes_1 = require("./api/twinRoutes");
const coolingRoutes_1 = require("./api/coolingRoutes");
const heatingRoutes_1 = require("./api/heatingRoutes");
// Temporarily disabled advanced systems
// import { failureRouter } from "./api/failureRoutes";
// import { alertingRouter } from "./api/alertingRoutes";
// import { scenarioRouter } from "./api/scenarioRoutes";
const simulator_1 = require("./twin/simulator");
const twinSocket_1 = require("./ws/twinSocket");
const persistSnapshot_1 = require("./twin/persistSnapshot");
const flushBuffer_1 = require("./twin/flushBuffer");
function startServer() {
    const app = (0, express_1.default)();
    const server = http_1.default.createServer(app);
    // REST
    app.use(express_1.default.json());
    app.use("/twin", twinRoutes_1.twinRouter);
    app.use("/cooling", coolingRoutes_1.coolingRouter);
    app.use("/heating", heatingRoutes_1.heatingRouter);
    // Temporarily disabled advanced systems
    // app.use("/failures", failureRouter);
    // app.use("/alerts", alertingRouter);
    // app.use("/scenarios", scenarioRouter);
    // WebSocket
    const wss = new ws_1.default.Server({
        server,
        path: "/ws/twin"
    });
    (0, twinSocket_1.setupTwinSocket)(wss);
    /**
     * 1️⃣ MAIN SIMULATION LOOP (never blocks)
     */
    let tick = 0;
    setInterval(() => {
        // Main simulation tick with enhanced logging
        const twinState = (0, simulator_1.simulateTick)();
        // Broadcast update
        (0, twinSocket_1.broadcastUpdate)(wss);
        tick++;
        if (tick % 5 === 0) {
            // Fire-and-forget persistence
            (0, persistSnapshot_1.persistSnapshot)();
        }
    }, 1000);
    /**
     * 2️⃣ BACKGROUND BUFFER FLUSH LOOP
     */
    setInterval(() => {
        (0, flushBuffer_1.flushSnapshotBuffer)();
    }, 2000);
    /**
     * 3️⃣ START SERVER
     */
    server.listen(3000, () => {
        console.log("🚀 Digital Twin Backend running on port 3000");
    });
}
