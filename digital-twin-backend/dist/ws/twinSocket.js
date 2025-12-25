"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTwinSocket = setupTwinSocket;
exports.broadcastUpdate = broadcastUpdate;
const ws_1 = __importDefault(require("ws"));
const twinState_1 = require("../twin/twinState");
function setupTwinSocket(wss) {
    wss.on("connection", ws => {
        ws.send(JSON.stringify({
            type: "FULL_SNAPSHOT",
            timestamp: twinState_1.twinState.timestamp,
            payload: twinState_1.twinState
        }));
    });
}
function broadcastUpdate(wss) {
    const message = JSON.stringify({
        type: "PARTIAL_UPDATE",
        timestamp: twinState_1.twinState.timestamp,
        payload: {
            racks: twinState_1.twinState.racks,
            aggregates: twinState_1.twinState.aggregates
        }
    });
    wss.clients.forEach(c => {
        if (c.readyState === ws_1.default.OPEN)
            c.send(message);
    });
}
