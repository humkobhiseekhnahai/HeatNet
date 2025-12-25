
## HeatNet – Digital Twin Backend

  

AI-driven digital twin backend for data center thermal simulation, stress modeling, and cooling optimization.

  

⸻

  

## Overview

  

HeatNet simulates a large-scale data center (100+ racks) as a real-time digital twin.

It models CPU/GPU load, thermal behavior, cooling efficiency degradation & recovery, and exposes:

• Live state via WebSockets

• Aggregated metrics via REST APIs

• Periodic snapshots persisted to PostgreSQL

• Fault-tolerant behavior when DB is unavailable (buffering)

  

The system is designed to later plug in cooling chamber simulations and AI-based optimizers.

  

⸻

  

## Tech Stack

• Node.js + TypeScript

• Express

• WebSocket (ws)

• Prisma ORM

• PostgreSQL

• Docker & Docker Compose

  

⸻

  

## Environment Variables

  

Create digital-twin-backend/.env

  

>DATABASE_URL=postgresql://postgres:mysecretpassword@postgres:5432/postgres

  

When using Docker Compose, host must be postgres, not localhost.

  

⸻

  

## Option 1: Run Everything Using Docker (Recommended)

  

Prerequisites

• Docker

• Docker Compose

  

**

**Start the full stack**

**

  

From the root folder (HeatNet):

  

>docker compose up --build

  

**Services**

• Backend → http://localhost:3000

• WebSocket → ws://localhost:3000/ws/twin

• PostgreSQL → internal Docker network

  

**Stop & clean**

  

> docker compose down -v

  
  

⸻

  

## Option 2: Run Database Locally + Backend Manually

  

Start PostgreSQL locally

  

>docker run -d --name heatnet-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 postgres:15

  

Update .env:

  

>DATABASE_URL=postgresql://postgres:mysecretpassword@localhost:5432/postgres

  
  

⸻

  

## Setup backend

  

>cd digital-twin-backend

>npm install

  

Generate Prisma client:

  

>npx prisma generate

  

Run migrations (IMPORTANT):

  

>npx prisma migrate dev --name init

  

npm run start

  
  



  
  

⸻

  

## Runtime Behavior

• Simulation tick: 1 second

• Snapshot persistence: every 5 ticks

• DB failure handling:

• Backend does NOT crash

• Snapshots buffered in memory

• Auto-flush on DB recovery

  

⸻

  

## Simulation Model (Current)

• 100–120 racks

• GPU-heavy workload with random spikes

• Cooling efficiency degradation & recovery

• States:

• OK

• WARM

• HOT

  

Stress-biased model for AI testing.

  

⸻

  

## WebSocket Payload

  

Live stream includes:

• Per-rack temperatures

• Power usage

• Fan RPM

• Cooling efficiency

• Status (OK / WARM / HOT)

• Aggregated metrics

  

⸻

  

## Future Extensions

• Cooling chamber & chilled-water loop simulation

• AI-based cooling control (RL / predictive)

• Failure injection (pumps, airflow)

• Multi-zone data center modeling

• Historical analytics