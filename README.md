# Trinetra — Mausam Adapt

**Official weather intelligence, adapted to your plans.**

Trinetra is a personalized decision-support layer for the Mausam ecosystem. It combines official environmental and weather information with user context, plans, and deterministic safety rules to turn forecasts into practical decisions.

## What Trinetra Does

- **Personalized weather homepage** based on user context and activity
- **Challenge My Plan** to evaluate plans against weather conditions
- **Plan conflict detection** for upcoming activities
- **Safety-first recommendations** with official warnings taking priority
- **Dynamic weather experience** with clear, context-aware information
- **Government-first data architecture** designed around official Indian sources
- **Offline-aware experience** with clear data freshness states

## Decision Pipeline

```
Official Government Data
        ↓
Normalization & Validation
        ↓
User Context + Location + Plan
        ↓
Safety & Risk Engine
        ↓
Decision Engine
        ↓
Personalized Action
```

## Safety Principle

Official severe weather warnings always take priority over personalization.

AI or language-processing components may help interpret intent or explain information, but they do not override official warnings or safety rules.

## Data Sources

The architecture is designed to integrate official Indian government sources such as:

- **India Meteorological Department (IMD)** — weather observations, forecasts and warnings
- **Indian National Centre for Ocean Information Services (INCOIS)** — marine and ocean information
- **Central Pollution Control Board (CPCB)** — air-quality information where officially available
- **MOSDAC / ISRO** — satellite and geospatial information where officially available
- **Bhashini / MeitY** — Indian-language and voice capabilities

Provider availability depends on official access, authentication and service status. Trinetra does not represent unavailable or cached data as live data.

## Technology

- React + TypeScript
- Vite
- Node.js / TypeScript backend
- PostgreSQL
- Redis
- Government data provider adapters
- Deterministic decision and safety engines

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL
- Redis

### Install

```bash
npm install
```

### Configure

Copy `.env.example` to your local environment and provide the required credentials for the services you are authorized to use.

**Never commit real API keys, passwords, database credentials or other secrets.**

### Run

```bash
npm run dev
```

## Project Structure

```text
src/            Frontend application
server.ts       Backend entry point
package.json    Project dependencies and scripts
vite.config.ts  Frontend build configuration
.env.example    Environment variable template
```

## Development Status

Trinetra is being developed as a Smart India Hackathon 2026 solution for:

**PS 26076 — Development of personalized homepage for 'Mausam' mobile application**

The project focuses on turning weather information into context-aware decisions for different user needs while preserving access to the depth of the existing Mausam ecosystem.

## License

This project is currently intended for development and evaluation. Licensing details will be added as the project is prepared for release.
