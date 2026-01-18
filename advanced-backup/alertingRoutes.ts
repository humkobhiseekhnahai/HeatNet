import { Router, Request, Response } from 'express';
import { AlertEngine } from '../alerting/alertEngine';
import { FailureEngine } from '../failure/failureEngine';
import { AlertType, AlertSeverity, AlertStatus } from '../types/alerting';

const router = Router();
const failureEngine = new FailureEngine();
const alertEngine = new AlertEngine(failureEngine);

// Get Active Alerts
router.get('/active', (req: Request, res: Response) => {
  try {
    const activeAlerts = alertEngine.getActiveAlerts();
    
    res.json({
      success: true,
      data: activeAlerts,
      count: activeAlerts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Alert History
router.get('/history', (req: Request, res: Response) => {
  try {
    const { limit = 50, type, severity, status } = req.query;
    let limitNum = parseInt(limit as string);
    
    let history = alertEngine.getAlertHistory(limitNum);
    
    // Apply filters
    if (type) {
      history = history.filter(a => a.alertType === type);
    }
    if (severity) {
      history = history.filter(a => a.severity === severity);
    }
    if (status) {
      history = history.filter(a => a.status === status);
    }
    
    res.json({
      success: true,
      data: history,
      total: history.length,
      limit: limitNum
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Specific Alert
router.get('/:alertId', (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const state = alertEngine.getState();
    const alert = state.activeAlerts.get(alertId) || 
                 state.alertHistory.find(a => a.id === alertId);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: `Alert ${alertId} not found`
      });
    }
    
    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Acknowledge Alert
router.post('/:alertId/acknowledge', (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { acknowledgedBy = 'System' } = req.body;
    
    const success = alertEngine.acknowledgeAlert(alertId, acknowledgedBy);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: `Alert ${alertId} not found or already acknowledged`
      });
    }
    
    res.json({
      success: true,
      message: `Alert ${alertId} acknowledged by ${acknowledgedBy}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Resolve Alert
router.post('/:alertId/resolve', (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const success = alertEngine.resolveAlert(alertId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: `Alert ${alertId} not found or already resolved`
      });
    }
    
    res.json({
      success: true,
      message: `Alert ${alertId} resolved`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Alert Statistics
router.get('/stats/summary', (req: Request, res: Response) => {
  try {
    const alertCounts = alertEngine.getAlertCounts();
    const state = alertEngine.getState();
    
    const stats = {
      ...alertCounts,
      rules: {
        total: state.rules.size,
        active: Array.from(state.rules.values()).filter(r => r.isActive).length
      },
      settings: state.config.globalSettings,
      lastRuleCheck: state.lastRuleCheck
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create Manual Alert
router.post('/create', (req: Request, res: Response) => {
  try {
    const { 
      alertType, 
      severity, 
      title, 
      description, 
      affectedRacks, 
      metrics, 
      source 
    } = req.body;
    
    const alert = alertEngine.createAlert({
      alertType,
      severity,
      title,
      description,
      affectedRacks: affectedRacks || [],
      metrics,
      source: source || 'MANUAL'
    });
    
    res.status(201).json({
      success: true,
      data: alert,
      message: 'Manual alert created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Alert Types
router.get('/types/list', (req: Request, res: Response) => {
  try {
    const types = Object.values(AlertType);
    const severities = Object.values(AlertSeverity);
    const statuses = Object.values(AlertStatus);
    
    res.json({
      success: true,
      data: {
        types,
        severities,
        statuses
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Acknowledge Multiple Alerts
router.post('/batch/acknowledge', (req: Request, res: Response) => {
  try {
    const { alertIds, acknowledgedBy = 'System' } = req.body;
    
    if (!Array.isArray(alertIds)) {
      return res.status(400).json({
        success: false,
        error: 'alertIds must be an array'
      });
    }
    
    const results = [];
    for (const alertId of alertIds) {
      const success = alertEngine.acknowledgeAlert(alertId, acknowledgedBy);
      results.push({ alertId, success });
    }
    
    const successful = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      message: `Acknowledged ${successful} of ${alertIds.length} alerts`,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Resolve Multiple Alerts
router.post('/batch/resolve', (req: Request, res: Response) => {
  try {
    const { alertIds } = req.body;
    
    if (!Array.isArray(alertIds)) {
      return res.status(400).json({
        success: false,
        error: 'alertIds must be an array'
      });
    }
    
    const results = [];
    for (const alertId of alertIds) {
      const success = alertEngine.resolveAlert(alertId);
      results.push({ alertId, success });
    }
    
    const successful = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      message: `Resolved ${successful} of ${alertIds.length} alerts`,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Trigger Root Cause Analysis for Alert
router.post('/:alertId/rca', (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const state = alertEngine.getState();
    const alert = state.activeAlerts.get(alertId);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: `Alert ${alertId} not found`
      });
    }
    
    // This would need the current twin state - for now, return placeholder
    // In real implementation, this would call alertEngine.performRCA()
    const rcaResult = {
      primaryCause: 'Analysis triggered - requires full system state',
      confidence: 0.5,
      contributingFactors: [],
      evidence: [],
      recommendations: ['Full RCA requires current system context']
    };
    
    res.json({
      success: true,
      data: rcaResult,
      message: `RCA triggered for alert ${alertId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear All Active Alerts
router.post('/clear', (req: Request, res: Response) => {
  try {
    const activeAlerts = alertEngine.getActiveAlerts();
    const clearedCount = activeAlerts.length;
    
    for (const alert of activeAlerts) {
      alertEngine.resolveAlert(alert.id);
    }
    
    res.json({
      success: true,
      message: `Cleared ${clearedCount} active alerts`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export alert data
router.get('/export', (req: Request, res: Response) => {
  try {
    const { format = 'json', type = 'all' } = req.query;
    
    let data;
    
    switch (type) {
      case 'active':
        data = alertEngine.getActiveAlerts();
        break;
      case 'history':
        data = alertEngine.getAlertHistory(1000);
        break;
      default:
        data = {
          active: alertEngine.getActiveAlerts(),
          history: alertEngine.getAlertHistory(1000),
          stats: alertEngine.getAlertCounts()
        };
    }
    
    if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csv = convertToCSV(Array.isArray(data) ? data : data.active || []);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=alerts.csv');
      return res.send(csv);
    }
    
    res.json({
      success: true,
      data,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to convert alerts to CSV
function convertToCSV(alerts: any[]): string {
  if (alerts.length === 0) return 'No alerts found';
  
  const headers = ['ID', 'Type', 'Severity', 'Title', 'Description', 'Status', 'Created', 'Source'];
  const rows = alerts.map(alert => [
    alert.id,
    alert.alertType,
    alert.severity,
    alert.title,
    alert.description,
    alert.status,
    new Date(alert.timestamp).toISOString(),
    alert.source || 'N/A'
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export { router as alertingRouter };