# Mausam Adapt

> **From Weather Data to Weather-Smart Decisions**

Mausam Adapt is a **mobile-first personalized weather experience** developed for **Smart India Hackathon 2026, PS SIH26076**:

**“Development of personalized homepage for 'Mausam' mobile application.”**

**Team:** Trinetra

## What It Does

Mausam Adapt personalizes weather information based on the user's:

- Persona
- Location
- Activity
- Plans
- Weather conditions

It supports the 8 user groups from the PS:

- Health-conscious
- Fitness
- Beach / Surf
- Travel
- Family
- Agriculture
- Commuters
- Event planners

## Key Features

- Personalized homepage
- Challenge a Plan
- What-If time comparison
- Rain Around You
- Weather forecasts
- Severe weather alerts
- Saved locations
- Location permission
- Login & Signup
- Offline / cached data support

## Architecture

```text
Presentation
     ↓
Application / Business Logic
     ↓
Data / Integration
```

### Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS  
**Backend:** Node.js, Express, TypeScript  
**Database:** PostgreSQL / Supabase  
**Maps:** Leaflet  
**Data:** IMD, INCOIS, CPCB, MOSDAC / ISRO where available

## Development

```bash
git clone https://github.com/trinetra01-droid/mausam-adapt.git
cd mausam-adapt
npm install
npm run dev
```

Build:

```bash
npm run build
```

Start:

```bash
npm start
```

## Data & Safety

Mausam Adapt prioritizes official weather warnings and clearly distinguishes live, cached, stale, unavailable, and demo data.

AI is used only as a supporting layer for tasks such as intent understanding and explanations. It does not override official safety information.

## Deployment

Production deployment is designed for **Antideploy** with PostgreSQL/Supabase and secure environment variables.

Never commit:

- API keys
- JWT secrets
- database credentials
- other private environment variables

## License

MIT
