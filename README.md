# TransitOps

**A fleet dispatch and operations platform** — vehicles, drivers, trips, maintenance, fuel & expenses, and cost analytics, all gated behind role-based access control and enforced business rules.

![Last commit](https://img.shields.io/github/last-commit/hsd2514/RouteHQ)
![Issues closed](https://img.shields.io/github/issues-closed/hsd2514/RouteHQ)
![PRs merged](https://img.shields.io/github/issues-pr-closed/hsd2514/RouteHQ)
![Repo size](https://img.shields.io/github/repo-size/hsd2514/RouteHQ)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)

---

## Table of contents

- [What this is](#what-this-is)
- [Screens](#screens)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone](#1-clone)
  - [2. Database](#2-database)
  - [3. Backend](#3-backend)
  - [4. Frontend](#4-frontend)
  - [5. Log in](#5-log-in)
- [Business rules](#business-rules-the-part-that-actually-matters)
- [RBAC matrix](#rbac-matrix)
- [API reference](#api-reference)
- [Project structure](#project-structure)
- [Testing](#testing)
- [Known limitations](#known-limitations--things-a-real-production-deploy-would-need)
- [Troubleshooting](#troubleshooting)
- [Contributors](#contributors)

---

## What this is

TransitOps models a real fleet operator's day: a dispatcher creates a trip, the backend refuses to dispatch it if the cargo is over the truck's rated capacity or the assigned driver's license has expired, a vehicle can't be sent to the shop while it's mid-trip, and every dollar of fuel/maintenance/toll spend rolls up into a per-vehicle cost report you can export to CSV.

It's a hackathon build, but the backend business-rule enforcement is written and tested like it isn't — every state transition (dispatch → complete → cancel, maintenance open → close) is validated server-side, covered by an automated test suite, and was verified live end-to-end against a running Postgres instance before anything got merged.

## Screens

| Page | Who can act on it |
|---|---|
| **Dashboard** | Everyone (read-only) — KPIs, cost-per-vehicle bar chart, status pie chart, license-expiry banner, filterable by vehicle type/status/region |
| **Vehicle Registry** | `fleet_manager` writes; everyone reads |
| **Drivers & Safety** | `fleet_manager`, `safety_officer` write; everyone reads |
| **Trip Dispatcher** | `fleet_manager`, `driver` (dispatcher role) act; everyone reads |
| **Maintenance** | `fleet_manager` writes; everyone reads |
| **Fuel & Expenses** | `fleet_manager`, `financial_analyst`, `driver` write; everyone reads |
| **Reports & Analytics** | Everyone (read-only) — cost table with ROI + CSV export |
| **Settings & RBAC** | Everyone — general prefs (local only) + a live view of the permission matrix below |
| **Login / Signup / Forgot / Reset Password** | Public |

Original wireframes are in [`Excali_Images/`](Excali_Images/).

**Also throughout the app:** a notification bell in the navbar surfacing expiring licenses and vehicles in the shop, click-to-sort on every data table column, dark/light mode with the preference saved locally, and client-side search/filtering on every list page.

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Backend | FastAPI + SQLAlchemy (sync) + Pydantic v2 | Single `models.py` / `schemas.py`, routers split by resource |
| Package manager | [`uv`](https://docs.astral.sh/uv/) | No pip, no requirements.txt |
| Database | PostgreSQL 16 | Tables created via `Base.metadata.create_all()` on startup, no Alembic |
| Auth | JWT (`python-jose`) + `bcrypt` | Access tokens (24h) and single-use password-reset tokens (15 min) |
| Frontend | React 18 + Vite + Tailwind CSS v4 | Plain JavaScript, no TypeScript |
| Charts | Recharts | Dashboard bar/pie charts |
| State | React Context + `useReducer` for auth; local `useState` everywhere else | No Redux |
| Tests | pytest + FastAPI `TestClient`, isolated test database | 30 tests covering every business rule |

## Getting started

### Prerequisites

- [uv](https://docs.astral.sh/uv/getting-started/installation/)
- Node.js 18+ and npm
- Docker (for Postgres) — or a local Postgres instance if you'd rather not use Docker

### 1. Clone

```bash
git clone https://github.com/hsd2514/RouteHQ.git
cd RouteHQ
```

### 2. Database

Spin up Postgres in Docker (skip if you already have one running):

```bash
docker run -d --name transitops-pg \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=transitops \
  -p 5433:5432 postgres:16-alpine
```

> Mapped to host port **5433**, not 5432 — this sidesteps a conflict if you already have a native Postgres service running locally. Adjust if you don't have that conflict.

### 3. Backend

```bash
cd backend
cp .env.example .env   # then edit if your DB host/port/credentials differ
uv sync
uv run uvicorn app.main:app --reload
```

Runs on `http://localhost:8000`. On first startup it creates all tables and seeds demo data automatically (skipped on subsequent runs if users already exist).

> **Windows users:** `.env.example` already uses `127.0.0.1` instead of `localhost` for `DATABASE_URL` — keep it that way. `localhost` resolves to IPv6 first on Windows and can add **~20 seconds** to your first database connection before falling back to IPv4. Don't change it back.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` (CORS on the backend is locked to this origin).

### 5. Log in

Seed accounts, one per role, all with password `password123`:

| Email | Role |
|---|---|
| `fleet@transitops.com` | Fleet Manager |
| `driver@transitops.com` | Dispatcher |
| `safety@transitops.com` | Safety Officer |
| `finance@transitops.com` | Financial Analyst |

## Business rules (the part that actually matters)

All enforced **server-side**, inside a single DB transaction per action. The frontend hides buttons the current role can't use, but the backend never trusts that — every rule below is independently tested in `backend/tests/`.

**Trip dispatch** (`POST /trips/{id}/dispatch`) rejects with `400` if any of:
- trip isn't `draft`
- vehicle isn't `available`
- driver isn't `available`
- driver's license has expired
- cargo weight exceeds the vehicle's rated capacity

On success: trip → `dispatched`, vehicle → `on_trip`, driver → `on_trip`.

**Trip completion** (`POST /trips/{id}/complete`) only from `dispatched`. Computes `fuel_efficiency = actual_distance / fuel_consumed` (null-guarded against divide-by-zero), optionally records the trip's `revenue` (defaults to 0 if omitted), rejects if the final odometer reading is behind the current one, and frees the vehicle/driver back to `available`.

**Vehicle ROI** (`GET /reports/vehicle-costs`) — `ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost` per vehicle, summed across its completed trips' revenue. Null-guarded when `acquisition_cost` is 0.

**Trip cancel** (`POST /trips/{id}/cancel`) allowed from `draft` or `dispatched`; restores vehicle/driver to `available` if it was mid-trip.

**Maintenance** (`POST /maintenance`) rejects if the vehicle is currently `on_trip` — you can't service something that's out on a delivery. Creating a record flips the vehicle to `in_shop`; closing it (`POST /maintenance/{id}/close`) restores `available` **unless** the vehicle has since been `retired`.

**Registry integrity**: vehicle `reg_number` and driver `license_number` are both unique, enforced with a friendly `400` message rather than a raw DB constraint error. Retired/in-shop vehicles and suspended/expired-license drivers are excluded from the trip-creation dropdowns via `?status=available` and `?assignable=true` query filters.

**Password reset**: enumeration-safe (`/auth/forgot-password` returns the identical response whether or not the email exists), and reset tokens are single-use — they're bound to a fingerprint of the current password hash, so once a reset succeeds, the same link stops working even though the JWT itself hasn't expired yet. There's no real email delivery; the reset link is printed to the backend console (see [Known limitations](#known-limitations--things-a-real-production-deploy-would-need)).

## RBAC matrix

| Resource | `fleet_manager` | `driver` (Dispatcher) | `safety_officer` | `financial_analyst` |
|---|:---:|:---:|:---:|:---:|
| Vehicles (read) | ✓ | ✓ | ✓ | ✓ |
| Vehicles (write) | ✓ | — | — | — |
| Drivers (read) | ✓ | ✓ | ✓ | ✓ |
| Drivers (write / suspend) | ✓ | — | ✓ | — |
| Trips (read) | ✓ | ✓ | ✓ | ✓ |
| Trips (create/dispatch/complete/cancel) | ✓ | ✓ | — | — |
| Maintenance (read) | ✓ | ✓ | ✓ | ✓ |
| Maintenance (write/close) | ✓ | — | — | — |
| Fuel logs / Expenses (read) | ✓ | ✓ | ✓ | ✓ |
| Fuel logs / Expenses (write) | ✓ | ✓ | — | ✓ |
| Dashboard / Reports | ✓ read-only | ✓ read-only | ✓ read-only | ✓ read-only |

This table is also rendered live in the app's **Settings** page.

## API reference

All endpoints except `/auth/*` and `/health` require a JWT (`Authorization: Bearer <token>`).

| Router | Endpoints |
|---|---|
| `auth` | `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| `vehicles` | `GET/POST /vehicles`, `GET/PATCH/DELETE /vehicles/{id}`, `GET /vehicles/{id}/history` |
| `drivers` | `GET/POST /drivers`, `GET/PATCH/DELETE /drivers/{id}`, `GET /drivers/expiring?days=30` |
| `trips` | `GET/POST /trips`, `GET /trips/{id}`, `POST /trips/{id}/dispatch`, `POST /trips/{id}/complete`, `POST /trips/{id}/cancel` |
| `maintenance` | `GET/POST /maintenance`, `POST /maintenance/{id}/close` |
| `fuel` | `GET/POST /fuel-logs` |
| `expenses` | `GET/POST /expenses` |
| `dashboard` | `GET /dashboard/kpis` |
| `reports` | `GET /reports/vehicle-costs`, `GET /reports/vehicle-costs/csv` |

Interactive docs (Swagger UI) are available at `http://localhost:8000/docs` while the backend is running.

## Project structure

```
RouteHQ/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, startup (create_all + seed)
│   │   ├── database.py      # engine, SessionLocal, get_db
│   │   ├── models.py        # all SQLAlchemy models
│   │   ├── schemas.py       # all Pydantic schemas
│   │   ├── auth.py          # JWT + reset-token issuing/verification
│   │   ├── deps.py          # require_role() dependency factory
│   │   ├── seed.py          # idempotent demo data
│   │   └── routers/         # one file per resource
│   ├── tests/                # pytest suite (isolated test database)
│   ├── .env.example
│   └── pyproject.toml
└── frontend/
    └── src/
        ├── api/client.js              # axios instance + JWT interceptor
        ├── context/AuthContext.jsx     # Context + useReducer auth state
        ├── components/
        │   ├── layout/                 # Sidebar, Navbar, ProtectedRoute
        │   └── shared/                  # DataTable, StatusBadge, KpiCard, Modal, Toast
        └── pages/                      # one file per screen
```

## Testing

```bash
cd backend
uv run pytest -v
```

30 tests, covering:
- every trip dispatch rejection path (capacity, vehicle/driver status, expired license, double-dispatch)
- trip completion (fuel-efficiency math, divide-by-zero guard, odometer regression guard)
- trip cancellation and resource restoration
- maintenance open/close and the "can't service a vehicle mid-trip" rule
- registry uniqueness constraints and dropdown filtering
- the full auth flow: signup, login, enumeration-safe forgot-password, single-use reset tokens, and rejection of a login token used as a reset token
- revenue/ROI math and the zero-acquisition-cost null guard

Tests run against a dedicated `transitops_test` database (auto-created on first run) so they never touch your seeded dev data.

## Known limitations & things a real production deploy would need

Being upfront about what's still rough, roughly in order of "would actually bite someone":

- **Password reset emails aren't real.** `POST /auth/forgot-password` prints the reset link to the backend's console instead of sending an email — there's no SMTP/email-provider integration. Fine for a demo, not for real users.
- **No rate limiting** on login, signup, or forgot-password. A production deploy needs this before it touches the public internet.
- **No CI pipeline.** Tests exist and pass locally, but nothing runs them automatically on push/PR yet.
- **No password complexity policy.** Signup and reset both accept any non-empty string.
- **Mobile/narrow viewports are unverified.** The layout assumes a fixed sidebar + wide tables; nobody's tested below ~900px.
- **No Alembic migrations.** Schema changes currently mean editing `models.py` and recreating tables — fine for a hackathon, not for a live database with real data in it.

## Troubleshooting

**"Everything is stuck / spinner never resolves" right after starting the backend.** This was a real bug we hit and fixed: on Windows, `localhost` can resolve to IPv6 first and add ~20s to the very first DB connection. Make sure `backend/.env`'s `DATABASE_URL` uses `127.0.0.1`, not `localhost`.

**`docker: Error response from daemon` / connection refused on port 5433.** Docker Desktop isn't running, or the `transitops-pg` container was stopped. `docker start transitops-pg` (or re-run the `docker run` command from step 2 if the container doesn't exist yet).

**CORS errors in the browser console.** The backend only allows `http://localhost:5173` by default (see `main.py`). If you're running the frontend on a different port, update the `CORSMiddleware` origin list.

## Contributors

| | |
|---|---|
| [**hsd2514**](https://github.com/hsd2514) | Backend, business logic, UI system, integration |
| [**ParthTimeDEV**](https://github.com/ParthTimeDEV) | Vehicle Registry, Maintenance, Settings & RBAC, Navbar notifications |
| [**Pragati-1-7**](https://github.com/Pragati-1-7) | Drivers & Safety, Trip Dispatcher |
| [**Aryan0550p**](https://github.com/Aryan0550p) | Fuel & Expenses, Reports & Analytics, Forgot/Reset Password |
