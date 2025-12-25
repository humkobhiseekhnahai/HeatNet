import { Router } from "express";
import { twinState } from "../twin/twinState";

export const twinRouter = Router();

twinRouter.get("/state", (_req, res) => {
  res.json({
    ...twinState,
    heartbeat: {
      tickIntervalMs: 1000,
      lastUpdate: twinState.timestamp,
      mode: "SIMULATION"
    }
  });
});