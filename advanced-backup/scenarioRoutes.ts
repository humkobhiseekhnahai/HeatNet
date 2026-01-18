import { Router, Request, Response } from 'express';
import { ScenarioEngine } from '../scenario/scenarioEngine';
import { FailureEngine } from '../failure/failureEngine';
import { ScenarioCategory, ScenarioDifficulty, ScenarioStatus } from '../types/scenario';

const router = Router();
const failureEngine = new FailureEngine();
const scenarioEngine = new ScenarioEngine(failureEngine);

// Get All Preset Scenarios
router.get('/presets', (req: Request, res: Response) => {
  try {
    const { category, difficulty, tags } = req.query;
    let presets = scenarioEngine.getPresetScenarios();
    
    // Apply filters
    if (category) {
      presets = presets.filter(p => p.scenario.category === category);
    }
    if (difficulty) {
      presets = presets.filter(p => p.scenario.difficulty === difficulty);
    }
    if (tags) {
      const tagList = (tags as string).split(',');
      presets = presets.filter(p => 
        tagList.some(tag => p.scenario.tags.includes(tag))
      );
    }
    
    res.json({
      success: true,
      data: presets,
      count: presets.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Specific Preset Scenario
router.get('/presets/:scenarioId', (req: Request, res: Response) => {
  try {
    const { scenarioId } = req.params;
    const preset = scenarioEngine.getPresetScenario(scenarioId);
    
    if (!preset) {
      return res.status(404).json({
        success: false,
        error: `Scenario ${scenarioId} not found`
      });
    }
    
    res.json({
      success: true,
      data: preset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Execute Scenario
router.post('/:scenarioId/execute', (req: Request, res: Response) => {
  try {
    const { scenarioId } = req.params;
    const { triggeredBy = 'API' } = req.body;
    
    const execution = scenarioEngine.executeScenario(scenarioId, triggeredBy);
    
    res.status(201).json({
      success: true,
      data: execution,
      message: `Scenario ${scenarioId} execution started`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Stop Scenario
router.post('/:scenarioId/stop', (req: Request, res: Response) => {
  try {
    const { scenarioId } = req.params;
    const success = scenarioEngine.stopScenario(scenarioId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: `Scenario ${scenarioId} is not running`
      });
    }
    
    res.json({
      success: true,
      message: `Scenario ${scenarioId} stopped`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Active Scenarios
router.get('/active', (req: Request, res: Response) => {
  try {
    const activeScenarios = scenarioEngine.getActiveScenarios();
    
    res.json({
      success: true,
      data: activeScenarios,
      count: activeScenarios.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Execution History
router.get('/history', (req: Request, res: Response) => {
  try {
    const { limit = 50, scenarioId, status } = req.query;
    let limitNum = parseInt(limit as string);
    
    let history = scenarioEngine.getExecutionHistory(limitNum);
    
    // Apply filters
    if (scenarioId) {
      history = history.filter(h => h.scenarioId === scenarioId);
    }
    if (status) {
      history = history.filter(h => h.status === status);
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

// Get Specific Execution
router.get('/executions/:executionId', (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;
    const state = scenarioEngine.getState();
    
    // Check active scenarios
    let execution = Array.from(state.activeScenarios.values()).find(e => e.id === executionId);
    
    // Check history
    if (!execution) {
      execution = state.executionHistory.find(e => e.id === executionId);
    }
    
    if (!execution) {
      return res.status(404).json({
        success: false,
        error: `Execution ${executionId} not found`
      });
    }
    
    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Scenario Categories
router.get('/categories/list', (req: Request, res: Response) => {
  try {
    const categories = Object.values(ScenarioCategory);
    const difficulties = Object.values(ScenarioDifficulty);
    const statuses = Object.values(ScenarioStatus);
    
    res.json({
      success: true,
      data: {
        categories,
        difficulties,
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

// Get Scenario Statistics
router.get('/stats', (req: Request, res: Response) => {
  try {
    const presets = scenarioEngine.getPresetScenarios();
    const activeScenarios = scenarioEngine.getActiveScenarios();
    const history = scenarioEngine.getExecutionHistory(1000);
    
    const stats = {
      presets: {
        total: presets.length,
        byCategory: {} as Record<string, number>,
        byDifficulty: {} as Record<string, number>
      },
      executions: {
        active: activeScenarios.length,
        total: history.length,
        byStatus: {} as Record<string, number>,
        successRate: 0
      },
      usage: {
        totalExecutions: presets.reduce((sum, p) => sum + p.usage.totalExecutions, 0),
        avgSuccessRate: presets.reduce((sum, p) => sum + p.usage.successRate, 0) / presets.length || 0
      }
    };
    
    // Calculate category distribution
    for (const preset of presets) {
      stats.presets.byCategory[preset.scenario.category] = 
        (stats.presets.byCategory[preset.scenario.category] || 0) + 1;
      stats.presets.byDifficulty[preset.scenario.difficulty] = 
        (stats.presets.byDifficulty[preset.scenario.difficulty] || 0) + 1;
    }
    
    // Calculate execution status distribution
    for (const execution of history) {
      stats.executions.byStatus[execution.status] = 
        (stats.executions.byStatus[execution.status] || 0) + 1;
    }
    
    // Calculate overall success rate
    const completedExecutions = history.filter(e => e.status === ScenarioStatus.COMPLETED);
    if (completedExecutions.length > 0) {
      const successfulExecutions = completedExecutions.filter(e => 
        e.validationResults && e.validationResults.overallScore > 0.7
      );
      stats.executions.successRate = successfulExecutions.length / completedExecutions.length;
    }
    
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

// Create Custom Scenario
router.post('/create', (req: Request, res: Response) => {
  try {
    const { 
      name, 
      description, 
      category, 
      difficulty, 
      tags, 
      config, 
      expectedOutcomes, 
      durationMs 
    } = req.body;
    
    // Validate required fields
    if (!name || !description || !category || !difficulty || !config) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, description, category, difficulty, config'
      });
    }
    
    // Create custom scenario (simplified - in real implementation would save to database)
    const customScenario = {
      id: `custom_${Date.now()}`,
      name,
      description,
      category,
      difficulty,
      tags: tags || [],
      isPreset: false,
      config,
      expectedOutcomes,
      durationMs,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    res.status(201).json({
      success: true,
      data: customScenario,
      message: 'Custom scenario created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate Scenario Configuration
router.post('/validate', (req: Request, res: Response) => {
  try {
    const { config } = req.body;
    
    const validation = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[]
    };
    
    // Validate heating configuration
    if (config.heating) {
      if (!config.heating.mode) {
        validation.errors.push('Heating mode is required');
      }
      if (config.heating.costMultiplier && (config.heating.costMultiplier < 0.1 || config.heating.costMultiplier > 10)) {
        validation.warnings.push('Heating cost multiplier outside recommended range (0.1-10)');
      }
    }
    
    // Validate cooling configuration
    if (config.cooling) {
      if (!config.cooling.mode) {
        validation.errors.push('Cooling mode is required');
      }
      if (config.cooling.targetTemp && (config.cooling.targetTemp < 10 || config.cooling.targetTemp > 40)) {
        validation.warnings.push('Cooling target temperature outside recommended range (10-40°C)');
      }
    }
    
    // Validate failure configurations
    if (config.failures) {
      for (let i = 0; i < config.failures.length; i++) {
        const failure = config.failures[i];
        if (!failure.type || !failure.equipmentId || !failure.equipmentType) {
          validation.errors.push(`Failure ${i + 1} missing required fields: type, equipmentId, equipmentType`);
        }
        if (!failure.triggerTime || failure.triggerTime < 0) {
          validation.warnings.push(`Failure ${i + 1} trigger time should be >= 0`);
        }
      }
    }
    
    // Validate duration
    if (config.durationMs && config.durationMs < 60000) {
      validation.warnings.push('Scenario duration less than 1 minute may not show meaningful results');
    }
    
    validation.valid = validation.errors.length === 0;
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clone Scenario
router.post('/:scenarioId/clone', (req: Request, res: Response) => {
  try {
    const { scenarioId } = req.params;
    const { name, description } = req.body;
    
    const original = scenarioEngine.getPresetScenario(scenarioId);
    if (!original) {
      return res.status(404).json({
        success: false,
        error: `Scenario ${scenarioId} not found`
      });
    }
    
    const cloned = {
      ...original.scenario,
      id: `cloned_${Date.now()}`,
      name: name || `${original.scenario.name} (Clone)`,
      description: description || `${original.scenario.description} - Cloned scenario`,
      isPreset: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    delete (cloned as any).usage; // Remove usage stats
    
    res.status(201).json({
      success: true,
      data: cloned,
      message: `Scenario cloned successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Stop All Active Scenarios
router.post('/stop-all', (req: Request, res: Response) => {
  try {
    const activeScenarios = scenarioEngine.getActiveScenarios();
    const stoppedCount = activeScenarios.length;
    
    for (const execution of activeScenarios) {
      scenarioEngine.stopScenario(execution.scenarioId);
    }
    
    res.json({
      success: true,
      message: `Stopped ${stoppedCount} active scenarios`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export Scenario Data
router.get('/export', (req: Request, res: Response) => {
  try {
    const { format = 'json', includeHistory = 'false' } = req.query;
    const includeHistoryBool = includeHistory === 'true';
    
    const data = {
      presets: scenarioEngine.getPresetScenarios(),
      activeScenarios: scenarioEngine.getActiveScenarios(),
      exportDate: new Date().toISOString()
    };
    
    if (includeHistoryBool) {
      (data as any).history = scenarioEngine.getExecutionHistory(1000);
    }
    
    if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csv = convertScenariosToCSV(data.presets);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=scenarios.csv');
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

// Helper function to convert scenarios to CSV
function convertScenariosToCSV(presets: any[]): string {
  if (presets.length === 0) return 'No scenarios found';
  
  const headers = ['ID', 'Name', 'Category', 'Difficulty', 'Description', 'Total Executions', 'Success Rate', 'Avg Score'];
  const rows = presets.map(preset => [
    preset.scenario.id,
    preset.scenario.name,
    preset.scenario.category,
    preset.scenario.difficulty,
    preset.scenario.description,
    preset.usage.totalExecutions,
    (preset.usage.successRate * 100).toFixed(1) + '%',
    (preset.usage.avgScore * 100).toFixed(1) + '%'
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export { router as scenarioRouter };