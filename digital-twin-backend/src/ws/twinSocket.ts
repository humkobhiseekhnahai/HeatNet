import WebSocket from "ws";
import { twinState } from "../twin/twinState";

export function setupTwinSocket(wss: WebSocket.Server) {
  wss.on("connection", ws => {
    ws.send(JSON.stringify({
      type: "FULL_SNAPSHOT",
      timestamp: twinState.timestamp,
      payload: twinState
    }));
  });
}

export function broadcastUpdate(wss: WebSocket.Server) {
  const message = JSON.stringify({
    type: "PARTIAL_UPDATE",
    timestamp: twinState.timestamp,
    payload: {
      racks: twinState.racks,
      aggregates: twinState.aggregates
    }
  });

  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) c.send(message);
  });
}