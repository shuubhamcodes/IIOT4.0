---

# 🛰️ InsightHub — Industrial IoT Monitoring Platform (Built in TypeScript)

**InsightHub** is a full-stack **Industrial IoT (IIoT)** monitoring platform built using **TypeScript**, **React**, **Supabase**, and **Node.js/Express**. It simulates and monitors real-time sensor data from industrial machines, generates intelligent alerts, tracks maintenance logs, and provides actionable historical analytics across manufacturing plants.

This project aligns with real-world IIoT needs such as data acquisition, alerting, monitoring, and predictive analytics — specifically designed as a tailored prototype for roles like ADM's **IX Technology Engineer**.

---

## 🚀 Project Overview

InsightHub is designed for smart manufacturing plants to:

- **Ingest and visualize real-time sensor data**
- **Detect anomalies and generate alerts**
- **Enable engineers to log and resolve maintenance tickets**
- **View historical analytics** for uptime, energy consumption, and alert trends
- **Control access** using role-based authentication (`admin`, `engineer`, `operator`)

This project is fully implemented in **TypeScript** for safety and scalability.

---

## 🛠 Tech Stack

| Layer              | Tech Used                                                                 |
|-------------------|----------------------------------------------------------------------------|
| **Frontend**       | React (TypeScript), Tailwind CSS, Recharts                                |
| **Backend API**    | Node.js + Express (TypeScript), Supabase Service Role                     |
| **Database**       | Supabase PostgreSQL, Supabase Auth, Supabase Row-Level Security (RLS)     |
| **Auth & Roles**   | Supabase Auth + Custom `user_roles` table (`admin`, `engineer`, `operator`) |
| **Simulation**     | Node.js script that simulates real-time sensor data every 5 seconds       |
| **Deployment Ready** | Works on Vercel (monolithic)                                             |

---

## 🧱 System Architecture

```
                         ┌─────────────────────┐
                         │ Supabase PostgreSQL │
                         │ (plants, assets,    │
                         │  readings, alerts)  │
                         └────────┬────────────┘
                                  │
                 ┌────────────┬───┴────┬───────────────┐
                 │            │        │               │
       ┌────────▼─────┐  ┌────▼────┐  ┌▼──────────────┐┐
       │ Sensor Sim   │  │ API     │  │ React Frontend││
       │ (Node.js)    │  │ Express │  │ + Supabase    ││
       └──────────────┘  └─────────┘  └────────────────┘
```

---

## 🔐 Auth & Roles

Supabase Auth (email/password) + `user_roles` table:
- **Admin**: Full access to configure plants and machines.
- **Engineer**: Can view alerts, handle maintenance.
- **Operator**: Limited dashboard and monitoring.

---

## 📦 Features By Day (Roadmap)

| Day | Feature                            | Description |
|-----|------------------------------------|-------------|
| ✅ 1  | Supabase Schema Setup              | Defined tables for `plants`, `assets`, `sensor_readings`, `alerts`, `maintenance_tickets`, `users`, `user_roles` |
| ✅ 2  | Sensor Ingestion API              | `/api/ingest-sensor` route with JWT verification + alert generation logic |
| ✅ 3  | Sensor Simulation Engine          | Node script sending readings every 5s |
| ✅ 4  | Auth (Login/Signup)               | Frontend login + signup using Supabase Auth |
| ✅ 5  | Role-Based Navigation             | Sidebar dynamically rendered based on user role |
| ✅ 6  | Plant & Asset Config (Admin)      | `/config` page for creating plants & machines |
| ✅ 7  | Realtime Dashboard (Operator)     | `/dashboard` page showing live metrics using Recharts |
| ✅ 8  | Intelligent Alerts System         | `/alerts` page listing threshold-triggered alerts with filters |
| ✅ 9  | Maintenance Ticketing Panel       | `/maintenance` page with alert-linked ticketing & status updates |
| ✅ 10 | Historical Analytics Dashboard    | `/analytics` page showing 7/30-day trends and top error-prone machines |

---

## 📁 Supabase Table Schema Overview

| Table               | Description |
|---------------------|-------------|
| `plants`            | Manufacturing locations |
| `assets`            | Machines linked to a plant |
| `sensor_readings`   | Periodic telemetry from each machine |
| `alerts`            | Auto-generated alerts based on thresholds |
| `maintenance_tickets` | Linked to alerts, tracks issue resolution |
| `users`             | Supabase Auth users |
| `user_roles`        | Links user to a role: admin, engineer, operator |

---

## 📊 Sample Metrics (Analytics Page)

- **7-Day Uptime Trend**
- **Energy Usage (Daily Avg)**
- **Total Alerts**
- **Top 3 Error-Prone Machines**
- **30-Day Alert + Energy Trends**

---

## 🧪 Testing the Application

### ✅ Local Development

```bash
# Start backend server
npm run server

# Start frontend (Vite + React)
npm run dev

# Run simulator (manual JWT token insertion required)
npm run simulate
```

### 🔍 How to Verify

- **Ingestion**: Sensor readings show up in Supabase > `sensor_readings`
- **Alerts**: Triggered when readings exceed thresholds (check `/alerts`)
- **Dashboard**: View updated charts per asset on `/dashboard`
- **Maintenance**: Link alerts to tickets, resolve them
- **Analytics**: View 7-day and 30-day trends, filter by plant

---

## 🚀 Deployment (Monolithic on Vercel)

- Frontend + backend merged in a single Vercel deployment
- Supabase client and server keys configured via environment variables
- Sensor simulator can remain local or ported to a cron job or Node Lambda (future scope)

---

## 🎯 Alignment with ADM's IX Technology Engineer Role

| ADM Role Expectation                         | Covered in InsightHub                             |
|----------------------------------------------|--------------------------------------------------|
| Design & build IIoT apps                     | Full-stack TypeScript app with IIoT functionality |
| Data acquisition + ingestion pipelines       | `/api/ingest-sensor`, simulator, validation      |
| Alerting & Maintenance flow                  | Automatic alerts + linked ticketing              |
| Historical trend analysis                    | 7/30-day analytics with Recharts                 |
| Auth + Role system                           | Supabase Auth + `user_roles`                     |
| PostgreSQL-based structure                   | Supabase PostgreSQL used                         |
| Edge simulation (proto-edge emulation)       | Simulator mimics edge device behavior            |
| Container-ready, cloud-deployable            | Fully Vercel-ready monolith (no Docker yet)      |
| DevOps-compatible                            | Local + cloud deployable with API-first design   |

---

## 🌱 Future Enhancements

- ✅ Integrate MQTT broker for real-time ingestion
- ✅ Add PI/InfluxDB simulation to mimic time-series DBs
- ✅ Dockerize for production deployments
- ✅ Add AI summary of machine health
- ✅ Export CSV reports and anomaly detection

---

## 👨‍💻 Author

**Shubham Sharma**  
Full-Stack Developer
Built with ❤️ and TypeScript.

