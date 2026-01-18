"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.failureRouter = void 0;
const express_1 = require("express");
const failureEngine_1 = require("../failure/failureEngine");
const healthTracker_1 = require("../failure/healthTracker");
const router = (0, express_1.Router)();
exports.failureRouter = router;
const failureEngine = new failureEngine_1.FailureEngine();
const healthTracker = new healthTracker_1.HealthTracker(failureEngine.getState());
// CRAC Failure Injection
router.post('/inject/crac', (req, res) => {
    try {
        const { equipmentId, failureMode, capacityLoss, affectedZones, compressorFailure, fanFailure } = req.body;
        const params = {
            failureMode,
            capacityLoss,
            affectedZones,
            compressorFailure: compressorFailure || false,
            fanFailure: fanFailure || false
        };
        const failure = failureEngine.simulateCRACFailure(equipmentId, params);
        res.status(201).json({
            success: true,
            data: failure,
            message: `CRAC failure injected for ${equipmentId}`
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Pump Failure Injection
router.post('/inject/pump', (req, res) => {
    try {
        const { equipmentId, failureMode, flowReduction, pressureDrop, affectedLoops, backupPumpAvailable } = req.body;
        const params = {
            failureMode,
            flowReduction,
            pressureDrop,
            affectedLoops,
            backupPumpAvailable: backupPumpAvailable || false
        };
        const failure = failureEngine.simulatePumpFailure(equipmentId, params);
        res.status(201).json({
            success: true,
            data: failure,
            message: `Pump failure injected for ${equipmentId}`
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Fan Failure Injection
router.post('/inject/fan', (req, res) => {
    try {
        const { equipmentId, failureMode, failedUnits, totalUnits, affectedRacks, rpmReduction } = req.body;
        const params = {
            failureMode,
            failedUnits,
            totalUnits,
            affectedRacks,
            rpmReduction
        };
        const failure = failureEngine.simulateFanFailure(equipmentId, params);
        res.status(201).json({
            success: true,
            data: failure,
            message: `Fan failure injected for ${equipmentId}`
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Power Event Injection
router.post('/inject/power', (req, res) => {
    try {
        const { failureMode, voltageDrop, frequency, affectedZones, durationMs } = req.body;
        const params = {
            failureMode,
            voltageDrop,
            frequency,
            affectedZones,
            durationMs
        };
        const failure = failureEngine.simulatePowerEvent(params);
        res.status(201).json({
            success: true,
            data: failure,
            message: `Power event injected`
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Environmental Failure Injection
router.post('/inject/environmental', (req, res) => {
    try {
        const { type, ambientTempRise, humidityChange, durationMs, externalFactor } = req.body;
        const params = {
            type,
            ambientTempRise,
            humidityChange,
            durationMs,
            externalFactors
        };
        const failure = failureEngine.simulateEnvironmentalFailure(params);
        res.status(201).json({
            success: true,
            data: failure,
            message: `Environmental failure injected: ${type}`
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get Active Failures
router.get('/active', (req, res) => {
    try {
        const state = failureEngine.getState();
        const activeFailures = Array.from(state.activeFailures.values());
        res.json({
            success: true,
            data: activeFailures,
            count: activeFailures.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get Failure History
router.get('/history', (req, res) => {
    try {
        const state = failureEngine.getState();
        const { limit = 50, offset = 0, type, severity } = req.query;
        let history = [...state.failureHistory].reverse(); // Most recent first
        // Apply filters
        if (type) {
            history = history.filter(f => f.failureType === type);
        }
        if (severity) {
            history = history.filter(f => f.severity === severity);
        }
        // Apply pagination
        const paginatedHistory = history.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        res.json({
            success: true,
            data: paginatedHistory,
            total: history.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get Equipment States
router.get('/equipment', (req, res) => {
    try {
        const state = failureEngine.getState();
        const equipmentStates = Array.from(state.equipmentStates.values());
        res.json({
            success: true,
            data: equipmentStates,
            count: equipmentStates.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get Equipment State by ID
router.get('/equipment/:equipmentId', (req, res) => {
    try {
        const { equipmentId } = req.params;
        const equipmentState = failureEngine.getEquipmentState(equipmentId);
        if (!equipmentState) {
            return res.status(404).json({
                success: false,
                error: `Equipment ${equipmentId} not found`
            });
        }
        res.json({
            success: true,
            data: equipmentState
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get Health Summary
router.get('/health/summary', (req, res) => {
    try {
        const healthSummary = healthTracker.getHealthSummary();
        res.json({
            success: true,
            data: healthSummary
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get Maintenance Schedule
router.get('/maintenance/schedule', (req, res) => {
    try {
        const { hoursAhead = 720 } = req.query;
        const schedule = healthTracker.getMaintenanceSchedule(parseInt(hoursAhead));
        res.json({
            success: true,
            data: schedule,
            count: schedule.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Clear All Failures
router.post('/clear', (req, res) => {
    try {
        failureEngine.clearAllFailures();
        res.json({
            success: true,
            message: 'All active failures cleared'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Clear Specific Failure
router.post('/clear/:failureId', (req, res) => {
    try {
        const { failureId } = req.params;
        const success = failureEngine.clearFailure(failureId);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: `Failure ${failureId} not found`
            });
        }
        res.json({
            success: true,
            message: `Failure ${failureId} cleared`
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get Failure Statistics
router.get('/stats', (req, res) => {
    try {
        const state = failureEngine.getState();
        const activeFailures = Array.from(state.activeFailures.values());
        const stats = {
            activeFailures: activeFailures.length,
            totalEquipment: state.equipmentStates.size,
            failuresByType: {},
            failuresBySeverity: {},
            equipmentByStatus: {},
            averageHealth: 0,
            criticalEquipment: 0
        };
        // Calculate statistics
        let totalHealth = 0;
        // Failure statistics
        for (const failure of activeFailures) {
            stats.failuresByType[failure.failureType] = (stats.failuresByType[failure.failureType] || 0) + 1;
            stats.failuresBySeverity[failure.severity] = (stats.failuresBySeverity[failure.severity] || 0) + 1;
        }
        // Equipment statistics
        for (const equipment of state.equipmentStates.values()) {
            totalHealth += equipment.health;
            stats.equipmentByStatus[equipment.operationalStatus] = (stats.equipmentByStatus[equipment.operationalStatus] || 0) + 1;
            if (equipment.operationalStatus === 'FAILED') {
                stats.criticalEquipment++;
            }
        }
        stats.averageHealth = totalHealth / state.equipmentStates.size;
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
