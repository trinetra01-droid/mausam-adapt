# Trinetra — Mausam Adapt

> **From Weather Data to Weather-Smart Decisions**  
> An intelligent decision-support system combining official meteorological observations, Doppler radar nowcasts, and persona-driven hyper-local insights across India.

---

## 🌦 Overview

**Mausam Adapt** empowers commuters, outdoor enthusiasts, farmers, and daily decision-makers with actionable, context-aware meteorological intelligence. Rather than presenting raw numeric values, the platform synthesizes real-time observations, IMD radar scans, spatial rain analyses, and user activity schedules into clear risk ratings and proactive recommendations.

---

## ✨ Key Features

- **📍 Hyper-Local Weather Intelligence**: Live observations (temperature, feels-like, humidity, wind, UV index, air quality) mapped across Indian districts.
- **📡 Doppler Radar & Rain Around You**: High-resolution precipitation nowcasting, radar reflectivity (dBZ), and rain rate projections.
- **🧭 Persona-Driven Adaptation**:
  - **Commuter**: Route weather risks, waterlogging warnings, and safe departure windows.
  - **Outdoor & Fitness**: Heat stress, UV alerts, and optimal running/cycling slots.
  - **Farmer / Agriculture**: Rainfall accumulation, spray advisories, and frost/moisture monitoring.
- **🗓 Activity & Plan Optimizer**: Real-time safety scoring for scheduled events and travel routes.
- **⚡ Offline-Resilient & Dual Database Support**: Embedded local PostgreSQL engine (`PGlite`) with instant cloud sync to Supabase.
- **🛡️ Enterprise Security**: Row Level Security (RLS), JWT-based authentication, and hardened CORS protections.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite, Lucide Icons, Leaflet Maps, Motion
- **Backend**: Node.js, Express, TypeScript (`tsx`)
- **Database & Storage**: PostgreSQL (`pg` / `@electric-sql/pglite`), Supabase Client (`@supabase/supabase-js`)
- **Data Providers**: Indian Meteorological Department (IMD) observation feeds, Doppler radar spatial pipelines, open meteorological models

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` or `bun`

### 1. Clone the Repository

```bash
git clone https://github.com/trinetra01-droid/mausam-adapt.git
cd mausam-adapt
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` and fill in your configuration:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_here

# Optional: Supabase configuration (for cloud persistence & live sync)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
```

To run the full-stack production server:

```bash
npm start
```

---

## 🗄️ Database Setup (Supabase)

If you are using Supabase for cloud data storage:
1. Navigate to the `supabase/` directory in this repository.
2. Run `supabase/schema.sql` in your **Supabase SQL Editor** to bootstrap tables, foreign keys, and Row Level Security policies.
3. *(Optional)* Run `supabase/seed.sql` to populate sample meteorological stations and observation profiles.

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
