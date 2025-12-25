"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twinRouter = void 0;
const express_1 = require("express");
const twinState_1 = require("../twin/twinState");
exports.twinRouter = (0, express_1.Router)();
exports.twinRouter.get("/state", (_req, res) => {
    res.json({
        ...twinState_1.twinState,
        heartbeat: {
            tickIntervalMs: 1000,
            lastUpdate: twinState_1.twinState.timestamp,
            mode: "SIMULATION"
        }
    });
});
