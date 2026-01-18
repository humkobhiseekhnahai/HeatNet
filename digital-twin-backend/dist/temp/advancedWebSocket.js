"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedWebSocketManager = void 0;
const ws_1 = __importDefault(require("ws"));
class AdvancedWebSocketManager {
    constructor(wss, alertEngine, failureEngine, scenarioEngine) {
        this.updateInterval = null;
        this.wss = wss;
        this.alertEngine = alertEngine;
        this.failureEngine = failureEngine;
        this.scenarioEngine = scenarioEngine;
        this.setupWebSocketHandlers();
        this.startPeriodicUpdates();
    }
    setupWebSocketHandlers() {
        this.wss.on('connection', (ws) => {
            console.log('🔗 Advanced WebSocket client connected');
            // Send initial state
            this.sendInitialState(ws);
            // Handle client subscriptions
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleClientMessage(ws, message);
                }
                catch (error) {
                    console.error('WebSocket message error:', error);
                    this.sendError(ws, 'Invalid message format');
                }
            });
            ws.on('close', () => {
                console.log('🔌 Advanced WebSocket client disconnected');
            });
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });
    }
    sendInitialState(ws) {
        const initialState = {
            type: 'INITIAL_STATE',
            timestamp: Date.now(),
            payload: {
                alerts: {
                    active: this.alertEngine.getActiveAlerts(),
                    counts: this.alertEngine.getAlertCounts()
                },
                failures: {
                    active: Array.from(this.failureEngine.getState().activeFailures.values()),
                    equipment: Array.from(this.failureEngine.getState().equipmentStates.values())
                },
                scenarios: {
                    active: this.scenarioEngine.getActiveScenarios(),
                    presets: this.scenarioEngine.getPresetScenarios()
                },
                health: this.failureEngine.getState()
            }
        };
        ws.send(JSON.stringify(initialState));
    }
    handleClientMessage(ws, message) {
        switch (message.type) {
            case 'SUBSCRIBE':
                this.handleSubscription(ws, message.data);
                break;
            case 'UNSUBSCRIBE':
                this.handleUnsubscription(ws, message.data);
                break;
            case 'REQUEST_STATE':
                this.sendInitialState(ws);
                break;
            default:
                this.sendError(ws, `Unknown message type: ${message.type}`);
        }
    }
    handleSubscription(ws, data) {
        // Store subscription preferences on WebSocket connection
        const subscriptionData = data.types || ['TWIN_STATE', 'ALERT', 'FAILURE', 'SCENARIO', 'HEALTH'];
        ws.subscriptions = subscriptionData;
        ws.send(JSON.stringify({
            type: 'SUBSCRIPTION_CONFIRMED',
            timestamp: Date.now(),
            payload: { subscriptions: subscriptionData }
        }));
    }
    handleUnsubscription(ws, data) {
        const currentSubscriptions = ws.subscriptions || ['TWIN_STATE', 'ALERT', 'FAILURE', 'SCENARIO', 'HEALTH'];
        const newSubscriptions = currentSubscriptions.filter((sub) => !data.types.includes(sub));
        ws.subscriptions = newSubscriptions;
        ws.send(JSON.stringify({
            type: 'UNSUBSCRIPTION_CONFIRMED',
            timestamp: Date.now(),
            payload: { subscriptions: newSubscriptions }
        }));
    }
    handleUnsubscription(ws, data) {
        const subscriptions = ws.subscriptions || [];
        ws.subscriptions = subscriptions.filter((sub) => !data.types.includes(sub));
        ws.send(JSON.stringify({
            type: 'UNSUBSCRIPTION_CONFIRMED',
            timestamp: Date.now(),
            payload: { subscriptions: ws.subscriptions }
        }));
    }
    startPeriodicUpdates() {
        // Send periodic updates for clients who need them
        this.updateInterval = setInterval(() => {
            this.broadcastSystemUpdates();
        }, 5000); // Every 5 seconds
    }
    broadcastSystemUpdates() {
        const updates = this.collectSystemUpdates();
        for (const ws of this.wss.clients) {
            if (ws.readyState === ws_1.default.OPEN) {
                const subscriptions = ws.subscriptions || ['TWIN_STATE'];
                const filteredUpdates = updates.filter(update => subscriptions.includes(update.type));
                for (const update of filteredUpdates) {
                    ws.send(JSON.stringify(update));
                }
            }
        }
    }
    collectSystemUpdates() {
        const updates = [];
        const timestamp = Date.now();
        // Alert updates
        const activeAlerts = this.alertEngine.getActiveAlerts();
        if (activeAlerts.length > 0) {
            updates.push({
                type: 'ALERT',
                timestamp,
                payload: {
                    active: activeAlerts,
                    counts: this.alertEngine.getAlertCounts(),
                    criticalCount: activeAlerts.filter(a => a.severity === 'CRITICAL').length
                }
            });
        }
        // Failure updates
        const failureState = this.failureEngine.getState();
        const activeFailures = Array.from(failureState.activeFailures.values());
        if (activeFailures.length > 0) {
            updates.push({
                type: 'FAILURE',
                timestamp,
                payload: {
                    active: activeFailures,
                    criticalEquipment: Array.from(failureState.equipmentStates.values())
                        .filter(eq => eq.operationalStatus === 'FAILED')
                        .map(eq => eq.equipmentId),
                    healthSummary: this.calculateHealthSummary(failureState)
                }
            });
        }
        // Scenario updates
        const activeScenarios = this.scenarioEngine.getActiveScenarios();
        if (activeScenarios.length > 0) {
            updates.push({
                type: 'SCENARIO',
                timestamp,
                payload: {
                    active: activeScenarios.map(s => ({
                        id: s.id,
                        scenarioId: s.scenarioId,
                        progress: s.progress,
                        status: s.status,
                        events: s.events.slice(-5) // Last 5 events
                    })),
                    runningCount: activeScenarios.length
                }
            });
        }
        // Health updates (less frequent)
        if (timestamp % 30000 < 5000) { // Every 30 seconds
            updates.push({
                type: 'HEALTH',
                timestamp,
                payload: {
                    overallHealth: this.calculateOverallHealth(failureState),
                    maintenanceSchedule: this.getMaintenanceSchedule(failureState),
                    riskAssessment: this.calculateRiskAssessment(failureState)
                }
            });
        }
        return updates;
    }
    calculateHealthSummary(failureState) {
        const equipment = Array.from(failureState.equipmentStates.values());
        const total = equipment.length;
        const healthy = equipment.filter(eq => eq.operationalStatus === 'NORMAL').length;
        const degraded = equipment.filter(eq => eq.operationalStatus === 'DEGRADED').length;
        const failed = equipment.filter(eq => eq.operationalStatus === 'FAILED').length;
        const maintenance = equipment.filter(eq => eq.operationalStatus === 'MAINTENANCE').length;
        const avgHealth = equipment.reduce((sum, eq) => sum + eq.health, 0) / total;
        return {
            total,
            healthy,
            degraded,
            failed,
            maintenance,
            averageHealth: avgHealth,
            healthPercentage: (avgHealth * 100).toFixed(1)
        };
    }
    calculateOverallHealth(failureState) {
        const equipment = Array.from(failureState.equipmentStates.values());
        const criticalFailures = equipment.filter(eq => eq.operationalStatus === 'FAILED').length;
        const activeFailures = failureState.activeFailures.size;
        const activeAlerts = this.alertEngine.getActiveAlerts().filter(a => a.severity === 'CRITICAL').length;
        let healthScore = 100;
        healthScore -= criticalFailures * 25;
        healthScore -= activeFailures * 15;
        healthScore -= activeAlerts * 10;
        healthScore = Math.max(0, Math.min(100, healthScore));
        let status = 'HEALTHY';
        if (healthScore < 30)
            status = 'CRITICAL';
        else if (healthScore < 60)
            status = 'WARNING';
        else if (healthScore < 80)
            status = 'DEGRADED';
        return {
            score: healthScore,
            status,
            issues: {
                criticalFailures,
                activeFailures,
                criticalAlerts: activeAlerts
            }
        };
    }
    getMaintenanceSchedule(failureState) {
        // This would integrate with the health tracker
        // For now, return placeholder data
        return [
            {
                equipmentId: 'CRAC_1',
                scheduledTime: Date.now() + 86400000, // 1 day from now
                type: 'ROUTINE',
                priority: 'MEDIUM'
            }
        ];
    }
    calculateRiskAssessment(failureState) {
        const equipment = Array.from(failureState.equipmentStates.values());
        const highRisk = equipment.filter(eq => eq.health < 0.4).length;
        const mediumRisk = equipment.filter(eq => eq.health >= 0.4 && eq.health < 0.7).length;
        const lowRisk = equipment.filter(eq => eq.health >= 0.7).length;
        return {
            highRisk,
            mediumRisk,
            lowRisk,
            overallRisk: highRisk > 0 ? 'HIGH' : mediumRisk > equipment.length * 0.3 ? 'MEDIUM' : 'LOW'
        };
    }
    sendError(ws, message) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            timestamp: Date.now(),
            payload: { message }
        }));
    }
    // Public methods for broadcasting specific events
    broadcastAlert(alert) {
        const update = {
            type: 'ALERT',
            timestamp: Date.now(),
            payload: {
                event: 'ALERT_TRIGGERED',
                alert
            }
        };
        this.broadcastToSubscribers('ALERT', update);
    }
    broadcastFailure(failure) {
        const update = {
            type: 'FAILURE',
            timestamp: Date.now(),
            payload: {
                event: 'FAILURE_INJECTED',
                failure
            }
        };
        this.broadcastToSubscribers('FAILURE', update);
    }
    broadcastScenarioEvent(scenarioId, event) {
        const update = {
            type: 'SCENARIO',
            timestamp: Date.now(),
            payload: {
                event: 'SCENARIO_UPDATE',
                scenarioId,
                event
            }
        };
        this.broadcastToSubscribers('SCENARIO', update);
    }
    broadcastToSubscribers(type, update) {
        for (const ws of this.wss.clients) {
            if (ws.readyState === ws_1.default.OPEN) {
                const subscriptions = ws.subscriptions || ['TWIN_STATE'];
                if (subscriptions.includes(type)) {
                    ws.send(JSON.stringify(update));
                }
            }
        }
    }
    // Cleanup
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}
exports.AdvancedWebSocketManager = AdvancedWebSocketManager;
