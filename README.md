# HeatNet Digital Twin - Realistic Data Center Thermal Simulation

HeatNet is a sophisticated digital twin backend that simulates and controls data center thermal conditions with **realistic thermal dynamics**, **gradual temperature changes**, and **advanced cooling/heating battle scenarios**.

## 🌡️ Core Features

- **Realistic Thermal Simulation**: 120 racks with gradual temperature changes and thermal inertia
- **Advanced Cooling System**: Multi-mode cooling with cost tracking and custom temperature control
- **Heating System**: Workload-based heating with configurable CPU/GPU boosts
- **Enhanced Console Logging**: Real-time rack status, hottest racks, and system statistics
- **WebSocket Live Updates**: Real-time data streaming for all systems
- **REST API**: Complete control over thermal conditions

## 🌡️ NEW: Realistic Thermal Dynamics

- **Gradual Temperature Changes**: No more instant temperature shifts - real thermal inertia
- **Thermal Response Simulation**: Slow heating/cooling rates (2% response per tick)
- **Temperature Smoothing**: 70/30 split between current and previous temperatures
- **Dynamic Workload Patterns**: Time-based load cycles and realistic spike generation
- **Challenging Environment**: HOT status at 30°C, WARM at 25°C (realistic thresholds)

## 📊 Enhanced Console Monitoring

- **Real-time Rack Status**: Live updates every second showing all 120 racks
- **Top 10 Tables**: Hottest racks and highest power consuming racks
- **System Statistics**: Average temperatures, power consumption, critical rack counts
- **Problematic Rack Detection**: Immediate display of WARM/HOT racks with details
- **Thermal Battle Status**: Real-time cooling vs heating power and cost tracking

## 🎯 Dynamic Cooling Requirements

- **Scenario-based Cooling**: Different cooling levels needed based on heating conditions
- **AGGRESSIVE Required**: Handles HOT rack crises and extreme heat events
- **MINIMAL Insufficient**: Results in all racks going WARM under stress
- **NORMAL Balanced**: Optimal for typical data center operations
- **CUSTOM Precision**: Exact temperature targeting for specific needs

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (optional for database)

### Installation

1. **Clone and Setup**
```bash
cd HeatNet
cd digital-twin-backend
npm install
```

2. **Start the Server**
```bash
npm start
```

The server will start on `http://localhost:3000` with enhanced console logging showing:
- Real-time rack status updates every second
- Top 10 hottest and highest power racks
- System statistics and temperature distributions
- Cooling vs heating battle status

### Monitor the Simulation
```bash
# Check current thermal state (full 120-rack system state)
curl http://localhost:3000/twin/state

# Monitor cooling vs heating battle in real-time
curl http://localhost:3000/heating/battle-status

# Watch real-time updates via WebSocket
wscat -c ws://localhost:3000/ws/twin
```

## ❄️ Cooling System Control

The cooling system provides comprehensive temperature control with real cost tracking.

### Cooling Modes & Behavior

| Mode | Target Temp | Power | Realistic Behavior | When to Use |
|------|-------------|--------|-------------------|--------------|
| AGGRESSIVE | 18°C | 300kW | **Gradual cooling**, handles HOT rack crises | Extreme heat events, emergency cooling |
| NORMAL | 20°C | 75kW | **Balanced cooling**, maintains OK/WARM status | Normal operations, cost-effective |
| MINIMAL | 24°C | 12.5kW | **Basic cooling**, all racks become WARM under stress | Energy saving, low load |
| OFF | - | 0kW | **No cooling**, gradual temperature rise | Testing, maintenance |
| CUSTOM | Variable | Variable | **Precise targeting** with gradual response | Specific requirements |

**Realistic Response Times:**
- **Temperature changes**: Gradual (2% per simulation tick)
- **Full stabilization**: 30-60 seconds depending on mode
- **Thermal inertia**: Prevents instant temperature shifts
- **Dynamic requirements**: AGGRESSIVE needed when HOT racks appear

### Cooling API Endpoints

#### **Get Available Cooling Modes**
```bash
curl http://localhost:3000/cooling/modes
```

#### **Set Cooling Mode**
```bash
# Aggressive cooling for all racks
curl -X POST http://localhost:3000/cooling/control \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "AGGRESSIVE",
    "costMultiplier": 5
  }'

# Custom temperature for specific racks
curl -X POST http://localhost:3000/cooling/control \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "CUSTOM",
    "targetTemp": 16,
    "affectedRacks": ["R1", "R2", "R3"],
    "maxPowerKW": 200,
    "costMultiplier": 2
  }'

# Turn off cooling
curl -X POST http://localhost:3000/cooling/control \
  -H "Content-Type: application/json" \
  -d '{"mode": "OFF"}'
```

#### **Check Cooling Status**
```bash
curl http://localhost:3000/cooling/status
```

#### **Monitor Cooling Costs**
```bash
curl http://localhost:3000/cooling/metrics
```

#### **Reset Cost Counter**
```bash
curl -X POST http://localhost:3000/cooling/reset
```

### Cooling Parameters Explained

- **`mode`**: Cooling mode (AGGRESSIVE, NORMAL, MINIMAL, OFF, CUSTOM)
- **`targetTemp`**: Target inlet temperature (Celsius, 10-40°C)
- **`maxPowerKW`**: Maximum cooling power to consume
- **`affectedRacks`**: Specific rack IDs (empty = all racks)
- **`costMultiplier`**: Cost multiplier (1.0 = normal, higher = more expensive but effective)
- **`duration`**: Duration in milliseconds (undefined = until changed)

## 🔥 Heating System Control

The heating system uses workload simulation to increase temperatures by boosting CPU/GPU utilization.

### Heating Modes & Temperature Impact

| Mode | CPU Boost | GPU Boost | Power | Temperature Rise | When to Use |
|------|-----------|-----------|--------|------------------|--------------|
| HIGH | +40% | +60% | 150kW | **Gradual heat** creates WARM/HOT conditions | Stress testing, thermal war scenarios |
| MEDIUM | +25% | +35% | 90kW | **Moderate heating** leads to WARM status | Load testing, warm environment simulation |
| LOW | +15% | +20% | 60kW | **Light heating** slight temperature increase | Mild stress testing |
| OFF | 0% | 0% | 0kW | **No artificial heating** | Normal operations |
| CUSTOM | Variable | Variable | Variable | **Configurable heating** with custom targets | Specific test scenarios |

**Heating Physics:**
- **Workload-based heating**: CPU/GPU boosts generate realistic heat
- **Time-based patterns**: 5-minute load cycles simulate real data center usage
- **Gradual temperature rise**: Thermal inertia prevents instant spikes
- **Spike generation**: Random computational loads (5% probability)
- **Extreme events**: Heavy workload spikes (0.5% probability)

### Heating API Endpoints

#### **Get Available Heating Modes**
```bash
curl http://localhost:3000/heating/modes
```

#### **Set Heating Mode**
```bash
# High heating for all racks
curl -X POST http://localhost:3000/heating/control \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "HIGH",
    "costMultiplier": 3
  }'

# Custom workload boost
curl -X POST http://localhost:3000/heating/control \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "CUSTOM",
    "cpuBoost": 50,
    "gpuBoost": 70,
    "affectedRacks": ["R10", "R20", "R30"],
    "costMultiplier": 2
  }'

# Target temperature heating
curl -X POST http://localhost:3000/heating/control \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "CUSTOM",
    "targetTemp": 45,
    "maxPowerKW": 150
  }'

# Turn off heating
curl -X POST http://localhost:3000/heating/control \
  -H "Content-Type: application/json" \
  -d '{"mode": "OFF"}'
```

#### **Check Heating Status**
```bash
curl http://localhost:3000/heating/status
```

#### **Monitor Heating Costs**
```bash
curl http://localhost:3000/heating/metrics
```

#### **Reset Cost Counter**
```bash
curl -X POST http://localhost:3000/heating/reset
```





## 🎯 Practical Testing Scenarios

### **Basic Thermal Battle Tests**
```bash
# Test 1: Cool OFF vs Heat ON (observe gradual rise)
curl -X POST http://localhost:3000/cooling/control -H "Content-Type: application/json" -d '{"mode": "OFF"}'
curl -X POST http://localhost:3000/heating/control -H "Content-Type: application/json" -d '{"mode": "HIGH"}'
# Watch console for OK → WARM → HOT progression over 60-90 seconds

# Test 2: Cooling Effectiveness Comparison
curl -X POST http://localhost:3000/cooling/control -H "Content-Type: application/json" -d '{"mode": "MINIMAL"}'
# All racks should become WARM within 30 seconds

curl -X POST http://localhost:3000/cooling/control -H "Content-Type: application/json" -d '{"mode": "NORMAL"}'
# Some racks should return to OK within 30-45 seconds

curl -X POST http://localhost:3000/cooling/control -H "Content-Type: application/json" -d '{"mode": "AGGRESSIVE"}'
# All racks should return to OK within 45-60 seconds
```

### **Custom Temperature Targeting**
```bash
# Target specific temperature with custom cooling
curl -X POST http://localhost:3000/cooling/control -H "Content-Type: application/json" -d '{
  "mode": "CUSTOM",
  "targetTemp": 18,
  "costMultiplier": 2
}'

# Monitor system reach target
curl http://localhost:3000/twin/state | jq '.aggregates.avgInletTemp'

# Custom workload heating
curl -X POST http://localhost:3000/heating/control -H "Content-Type: application/json" -d '{
  "mode": "CUSTOM",
  "cpuBoost": 60,
  "gpuBoost": 80
}'
```

### **Response Time Testing**
```bash
# Create crisis (no cooling + max heating)
curl -X POST http://localhost:3000/cooling/control -H "Content-Type: application/json" -d '{"mode": "OFF"}'
curl -X POST http://localhost:3000/heating/control -H "Content-Type: application/json" -d '{"mode": "CUSTOM", "cpuBoost": 80, "gpuBoost": 90}'

# Wait for HOT racks to appear (watch console)
# Then deploy AGGRESSIVE cooling and measure recovery time
curl -X POST http://localhost:3000/cooling/control -H "Content-Type: application/json" -d '{"mode": "AGGRESSIVE"}'
# Measure time until all racks return to OK status
```

## 📊 Real-time Monitoring & Analytics

### **Live Console Output**
```bash
# Start server and watch console for:
npm start

# Real-time updates every second showing:
# - Total racks and their status distribution
# - Top 10 hottest racks with temperatures and power
# - Top 10 highest power consuming racks
# - System statistics (average temp, total power, critical rack count)
# - Cooling and heating battle status with costs
# - Problematic rack detection when HOT/WARM racks appear
```

### **System State API**
```bash
# Get complete thermal state (all 120 racks)
curl http://localhost:3000/twin/state | jq '{
  "timestamp": .timestamp,
  "avg_temp": .aggregates.avgInletTemp,
  "max_temp": .aggregates.maxInletTemp,
  "total_power": .aggregates.totalPowerKW,
  "hot_racks": [.racks[] | select(.inletTemp > 30)] | length,
  "warm_racks": [.racks[] | select(.inletTemp > 25 and .inletTemp <= 30)] | length,
  "ok_racks": [.racks[] | select(.inletTemp <= 25)] | length
}'

# Monitor heating vs cooling battle in real-time
curl http://localhost:3000/heating/battle-status
```

### **Cost Analysis**
```bash
# Cooling costs ($0.12/kWh) with realistic response times
curl http://localhost:3000/cooling/metrics

# Heating costs ($0.15/kWh) with gradual workload increases
curl http://localhost:3000/heating/metrics

# Combined thermal battle economics
curl http://localhost:3000/heating/battle-status | jq '{
  "total_power_kw": .netPowerKW,
  "total_cost_per_hour": .netCostPerHour,
  "heating_power": .heating.powerKW,
  "cooling_power": .cooling.powerKW
}'
```

### **Advanced Scenario 2: Cascading Failure Chain**
```bash
# Execute cascading failures scenario
curl -X POST http://localhost:3000/scenarios/cascading-failures/execute

# Add environmental stress
curl -X POST http://localhost:3000/failures/inject/environmental \
  -H "Content-Type: application/json" \
  -d '{
    "type": "HIGH_AMBIENT",
    "ambientTempRise": 10,
    "durationMs": 900000
  }'

# Watch alerts and RCA
curl http://localhost:3000/alerts/active
# Get RCA for critical alerts
curl -X POST http://localhost:3000/alerts/ALERT_ID/rca
```

### **Advanced Scenario 3: Random Chaos Testing**
```bash
# Execute random stress scenario
curl -X POST http://localhost:3000/scenarios/random-stress/execute

# Monitor system resilience
curl http://localhost:3000/failures/health/summary
curl http://localhost:3000/failures/stats

# Watch WebSocket for real-time updates
wscat -c ws://localhost:3000/ws/twin
```

### **Original Thermal War (Manual)**
```bash
# Start aggressive cooling
curl -X POST http://localhost:3000/cooling/control \
  -H "Content-Type: application/json" \
  -d '{"mode": "AGGRESSIVE", "costMultiplier": 10}'

# Start high heating
curl -X POST http://localhost:3000/heating/control \
  -H "Content-Type: application/json" \
  -d '{"mode": "HIGH", "costMultiplier": 8}'

# Watch the battle
curl http://localhost:3000/heating/battle-status
curl http://localhost:3000/twin/state
```

### **Scenario 2: Selective Heating/Cooling**
```bash
# Cool racks 1-40 aggressively
curl -X POST http://localhost:3000/cooling/control \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "AGGRESSIVE", 
    "affectedRacks": ["R1","R2","R3","R4","R5","R6","R7","R8","R9","R10","R11","R12","R13","R14","R15","R16","R17","R18","R19","R20","R21","R22","R23","R24","R25","R26","R27","R28","R29","R30","R31","R32","R33","R34","R35","R36","R37","R38","R39","R40"]
  }'

# Heat racks 41-80
curl -X POST http://localhost:3000/heating/control \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "HIGH", 
    "affectedRacks": ["R41","R42","R43","R44","R45","R46","R47","R48","R49","R50","R51","R52","R53","R54","R55","R56","R57","R58","R59","R60","R61","R62","R63","R64","R65","R66","R67","R68","R69","R70","R71","R72","R73","R74","R75","R76","R77","R78","R79","R80"]
  }'
```

### **Scenario 3: Temperature Targeting**
```bash
# Cool to 18°C
curl -X POST http://localhost:3000/cooling/control \
  -H "Content-Type: application/json" \
  -d '{"mode": "CUSTOM", "targetTemp": 18, "costMultiplier": 5}'

# Heat to 50°C
curl -X POST http://localhost:3000/heating/control \
  -H "Content-Type: application/json" \
  -d '{"mode": "CUSTOM", "targetTemp": 50, "costMultiplier": 5}'
```

## 📊 Monitoring and Analytics

### **Real-time State Monitoring**
```bash
# Get complete thermal state
curl http://localhost:3000/twin/state
```

**Response includes:**
- 120 rack states with CPU/GPU utilization, temperatures, fan RPM
- Aggregated metrics (average/max temperatures, total power)
- Zone configurations
- Real-time timestamp

### **Cost Analysis**
```bash
# Cooling costs ($0.12/kWh)
curl http://localhost:3000/cooling/metrics

# Heating costs ($0.15/kWh) 
curl http://localhost:3000/heating/metrics

# Combined battle status
curl http://localhost:3000/heating/battle-status
```

### **Advanced WebSocket Real-time Updates**
```javascript
// Standard twin updates
const twinWs = new WebSocket('ws://localhost:3000/ws/twin');
twinWs.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Thermal update:', data);
};

// Advanced system updates (NEW)
const advancedWs = new WebSocket('ws://localhost:3000/ws/twin');
advancedWs.onopen = () => {
  // Subscribe to specific event types
  advancedWs.send(JSON.stringify({
    type: 'SUBSCRIBE',
    data: {
      types: ['ALERT', 'FAILURE', 'SCENARIO', 'HEALTH']
    }
  }));
};

advancedWs.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'ALERT':
      console.log('New alert:', message.payload);
      break;
    case 'FAILURE':
      console.log('Failure injected:', message.payload);
      break;
    case 'SCENARIO':
      console.log('Scenario update:', message.payload);
      break;
    case 'HEALTH':
      console.log('System health:', message.payload);
      break;
    case 'INITIAL_STATE':
      console.log('Initial system state:', message.payload);
      break;
  }
};
```

## 📈 Rack Status Indicators (Updated)

- **OK**: Inlet temperature ≤ 25°C *(Lowered for realistic challenge)*
- **WARM**: Inlet temperature 25°C - 30°C *(Critical range requiring attention)*
- **HOT**: Inlet temperature > 30°C *(Immediate cooling intervention needed)*

## 🌡️ Realistic Thermal Scenarios

### **Scenario 1: Gradual Temperature Crisis**
```bash
# 1. Start with NORMAL cooling
curl -X POST http://localhost:3000/cooling/control -H "Content-Type: application/json" -d '{"mode": "NORMAL"}'

# 2. Add HIGH heating (watch gradual temperature rise)
curl -X POST http://localhost:3000/heating/control -H "Content-Type: application/json" -d '{"mode": "HIGH"}'

# 3. Monitor console - watch racks go OK → WARM → HOT over 60 seconds
# 4. When HOT racks appear, upgrade to AGGRESSIVE cooling
curl -X POST http://localhost:3000/cooling/control -H "Content-Type: application/json" -d '{"mode": "AGGRESSIVE"}'

# 5. Watch gradual recovery over 45-60 seconds
```

### **Scenario 2: Cooling Level Comparison**
```bash
# Test different cooling effectiveness levels
curl -X POST http://localhost:3000/heating/control -H "Content-Type: application/json" -d '{"mode": "HIGH"}'

# MINIMAL cooling - all racks become WARM
curl -X POST http://localhost:3000/cooling/control -H "Content-Type: application/json" -d '{"mode": "MINIMAL"}'
# Wait 30 seconds and observe console

# NORMAL cooling - some racks OK, some WARM  
curl -X POST http://localhost:3000/cooling/control -H "Content-Type: application/json" -d '{"mode": "NORMAL"}'
# Wait 30 seconds and observe improvement

# AGGRESSIVE cooling - racks recover to OK status
curl -X POST http://localhost:3000/cooling/control -H "Content-Type: application/json" -d '{"mode": "AGGRESSIVE"}'
# Wait 30 seconds and watch full recovery
```

### **Scenario 3: Custom Temperature Targeting**
```bash
# Precise temperature control with custom settings
curl -X POST http://localhost:3000/cooling/control -H "Content-Type: application/json" -d '{
  "mode": "CUSTOM", 
  "targetTemp": 16, 
  "costMultiplier": 2
}'

# Monitor system reach and maintain 16°C average
curl http://localhost:3000/twin/state | jq '.aggregates.avgInletTemp'

# Custom heating for specific workload patterns
curl -X POST http://localhost:3000/heating/control -H "Content-Type: application/json" -d '{
  "mode": "CUSTOM", 
  "cpuBoost": 50, 
  "gpuBoost": 70
}'
```

## 💡 Realistic Usage Tips

### **Thermal Response Understanding**
1. **Gradual Changes**: Temperature changes take 30-60 seconds to stabilize
2. **Thermal Inertia**: System prevents instant temperature shifts
3. **Watch Console**: Real-time status updates every second show gradual transitions
4. **Crisis Development**: Monitor HOT rack count to determine if AGGRESSIVE cooling needed
5. **Power vs Temperature**: Higher heating requires proportionally higher cooling

### **Realistic Testing Scenarios**
6. **Cooling Validation**: Test MINIMAL → NORMAL → AGGRESSIVE progression under same heating load
7. **Heating Stress**: Create HOT rack crisis, then observe cooling response time
8. **Custom Targeting**: Use CUSTOM mode to test precise temperature maintenance
9. **Battle Monitoring**: Use `/heating/battle-status` to track power/cost ratios
10. **Pattern Recognition**: Watch for daily load cycles affecting temperatures

### **Realistic Testing Guidelines**
6. **Thermal Response Testing**: Measure 30-90 second response times
7. **Cooling Validation**: Test all modes under identical heating loads
8. **Temperature Targeting**: Use CUSTOM mode for precise temperature control
9. **Battle Economics**: Monitor power/cost ratios between heating and cooling
10. **Pattern Recognition**: Watch for 5-minute workload cycles affecting temperatures

### **Performance Optimization**
11. **Response Time Planning**: Account for 30-90 second stabilization periods
12. **Cost Management**: Balance `costMultiplier` vs effectiveness
13. **Selective Control**: Use `affectedRacks` for targeted testing
14. **Real-time Monitoring**: Watch console logs for gradual temperature transitions
15. **Battle Analytics**: Use `/heating/battle-status` for power/cost insights

## 🔧 Development

### **Project Structure**
```
digital-twin-backend/
├── src/
│   ├── api/           # REST API routes
│   │   ├── coolingRoutes.ts    # Cooling API endpoints
│   │   ├── heatingRoutes.ts    # Heating API endpoints
│   │   └── twinRoutes.ts       # Twin state API
│   ├── cooling/       # Cooling system
│   │   └── coolingController.ts # Cooling state management
│   ├── heating/       # Heating system
│   │   └── heatingController.ts # Heating workload control
│   ├── twin/          # Digital twin simulation
│   │   ├── simulator.ts       # Main thermal simulation loop
│   │   ├── twinState.ts       # Current system state
│   │   └── aggregate.ts       # System aggregation logic
│   ├── types/         # TypeScript interfaces
│   │   ├── twin.ts            # Twin state types
│   │   ├── cooling.ts         # Cooling types
│   │   └── heating.ts         # Heating types
│   ├── ws/            # WebSocket handling
│   │   └── twinSocket.ts       # Real-time updates
│   ├── server.ts       # Express server setup
│   └── index.ts        # Application entry point
├── prisma/             # Database schema (optional)
│   └── schema.prisma       # Database schema
├── dist/                # Compiled JavaScript
└── package.json          # Dependencies
```

### **Key Files**
#### **Core Thermal System**
- `src/twin/simulator.ts` - **Realistic thermal simulation** with gradual temperature changes
- `src/cooling/coolingController.ts` - Multi-mode cooling with custom targets
- `src/heating/heatingController.ts` - Workload-based heating with CPU/GPU boosts

#### **API Routes**
- `src/api/coolingRoutes.ts` - Cooling control and monitoring endpoints
- `src/api/heatingRoutes.ts` - Heating control and monitoring endpoints
- `src/api/twinRoutes.ts` - System state and WebSocket endpoints

#### **Thermal Model Features**
- **Gradual Response**: 2% thermal response rate (vs 8% instant)
- **Temperature Smoothing**: 70/30 split with previous temps
- **Realistic Heat Generation**: CPU/GPU workload → heat conversion
- **Time-based Patterns**: 5-minute load cycles
- **Dynamic Thresholds**: OK ≤25°C, WARM 25-30°C, HOT >30°C

## 🌡️ Enhanced Thermal Physics Model

The simulation uses **realistic thermal dynamics** with gradual response times:

### **Realistic Thermal Model**
- **CPU/GPU Workload**: Generates heat based on utilization (0.22°C/% + 0.08°C/%)
- **Thermal Response Rate**: 2% per tick (vs previous 8% for instant effect)
- **Temperature Smoothing**: 70/30 split between current and previous temperatures
- **Gradual Power Changes**: Stepwise workload increases prevent instant heat spikes
- **Realistic Cooling Response**: Dampened cooling effect (30% of immediate value)
- **Time-based Load Cycles**: 5-minute sinusoidal patterns simulate daily usage

### **Thermal Inertia Implementation**
- **Previous Temperature Storage**: Each rack remembers previous inlet temperature
- **Gradual Temperature Convergence**: Current temp = 70% new + 30% previous
- **Slower Heat Transfer**: Outlet → inlet temperature transfer rate reduced to 2%
- **Dampened Cooling**: Active cooling effect multiplied by 0.3 for realism

### **Realistic Thermal Physics**
- **Heat Generation**: CPU/GPU utilization → temperature rise (0.22°C/% + 0.08°C/%)
- **Thermal Inertia**: Previous temperature stored for smoothing
- **Gradual Response**: 2% per tick thermal response rate
- **Dampened Cooling**: Active cooling effect multiplied by 0.3
- **Dynamic Workloads**: Random spikes (5% chance) and extreme loads (0.5% chance)
- **Time Cycles**: 5-minute sinusoidal patterns simulate daily usage

### **Temperature Status Logic**
- **OK Status**: ≤25°C (Optimal operating range)
- **WARM Status**: 25-30°C (Requires attention)
- **HOT Status**: >30°C (Critical, needs immediate cooling)
- **Gradual Transitions**: Status changes happen progressively, not instantly

### **Power & Cost Modeling**
- **Cooling Costs**: $0.12/kWh with realistic power consumption
- **Heating Costs**: $0.15/kWh with workload-based power draw
- **Rack Power**: Base 5kW + GPU workload contribution
- **Thermal Battle**: Real-time power and cost tracking between systems

## 🚨 System Limits & Safety Constraints

### **Thermal Safety Limits**
- **Target Temperature Range**: 10-40°C for custom cooling
- **CPU/GPU Utilization**: 0-100% with realistic workload patterns
- **Power Limits**: Configurable via `maxPowerKW` parameter
- **Fan RPM Range**: 1800-3000 (automatically adjusted by temperature)

### **Custom Control Parameters**
- **Heating Boosts**: CPU/GPU boost range 0-100%
- **Cooling Multipliers**: 0.1-10.0 for cost/power balancing
- **Target Precision**: 1°C granularity for temperature control
- **Response Time**: 30-90 seconds for full temperature stabilization

### **Realistic Constraints**
- **Thermal Response**: 2% per simulation tick (gradual)
- **Temperature Smoothing**: 70/30 split prevents instant changes
- **Workload Cycles**: 5-minute patterns simulate realistic usage
- **Stress Patterns**: Random computational loads and extreme spikes
- **Maximum Racks**: 120 rack simulation with individual thermal tracking

## 📝 License

ISC License - Feel free to use and modify for your data center simulation needs.

## 🐳 Docker Deployment

### **Quick Docker Start**
```bash
# Start all services with advanced systems
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f digital-twin-backend
```

### **Enhanced Docker Configuration**
The enhanced Docker setup includes:
- **Health Checks**: Automatic service monitoring
- **Database Migrations**: Automatic schema updates
- **Environment Variables**: Comprehensive system configuration
- **Persistent Storage**: Database and logs preserved
- **Port Mapping**: HTTP (3000) + WebSocket support

### **Production Considerations**
- Use `NODE_ENV=production` for optimized performance
- Configure database connection pooling
- Set appropriate retention policies
- Monitor system health via Docker health checks

## 📝 License

ISC License - Feel free to use and modify for your data center simulation needs.

## 🐳 Quick Docker Start (Optional)

```bash
# Start with Docker (if you have Docker Compose)
docker-compose up -d

# Or run directly with Node
cd digital-twin-backend && npm start
```

---

**HeatNet**: Realistic data center thermal simulation with gradual temperature changes and dynamic cooling/heating battle scenarios! 🌡️❄️🔥

**Perfect for:**
- Data center thermal management training
- Cooling system validation
- Thermal response time testing
- Realistic workload pattern simulation
- Cost optimization analysis
- Educational thermal dynamics demonstrations