# ভ্রমণবন্ধু (Vromon Bondhu) — Backend

A FastAPI + PostgreSQL backend for the Vromon Bondhu travel planner.
It lives in `backend/`, next to the React frontend, and does not change any frontend files.

> **Status: complete (Phases 1–3).** Accounts, reference data, the planning engine
> (classical AI), planning and saved-trips endpoints, hardening, and tests.
> Where is the AI? See **[docs/WHERE_IS_AI.md](docs/WHERE_IS_AI.md)**.

All prices in the database are **sample estimates** (marked `source = "sample-estimate"`), not live prices.

---

## 1. What you need

| Tool | Why | Check it with |
|---|---|---|
| Python 3.11 or newer | runs the backend | `python --version` |
| PostgreSQL 16 | the database | see step 3 |
| Node.js | only to re-export the seed data (optional) | `node --version` |

All commands below are for **Windows PowerShell**. Run them from the `backend` folder unless a step says otherwise:

```powershell
cd "D:\Siam new\UIU\ai\VromonBondhu\backend"
```

---

## 2. Create the virtual environment and install packages

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

**Optional — "activate" the environment** so you can type `python`, `alembic`, `pytest`
instead of the long `.\.venv\Scripts\...` paths:

```powershell
# One time only, if PowerShell says running scripts is disabled:
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
# Every new PowerShell window:
.\.venv\Scripts\Activate.ps1
```

The rest of this guide uses the full paths, so it works either way.

---

## 3. Set up PostgreSQL (choose ONE option)

### Option A — with Docker Desktop

```powershell
docker compose up -d        # starts PostgreSQL 16 in the background
docker compose ps           # should show vromon-bondhu-db as "healthy"
```

This creates the user `vromon`, password `vromon_dev_password`, and the database
`vromon_bondhu` — exactly what `.env.example` expects. Stop it later with `docker compose down`.

### Option B — without Docker (Windows installer)

1. Download the PostgreSQL 16 installer for Windows from
   https://www.postgresql.org/download/windows/ (the EDB installer).
2. Run it. Keep the default port **5432**. Choose a password for the `postgres`
   superuser and write it down. You can untick "Stack Builder".
3. Create the app's user and database (you will be asked for the `postgres` password):

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -c "CREATE USER vromon WITH PASSWORD 'vromon_dev_password';"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE vromon_bondhu OWNER vromon;"
```

(If you installed a different version, change `16` in the path.)

---

## 4. Create your `.env` file

```powershell
Copy-Item .env.example .env
notepad .env
```

- `DATABASE_URL` — already correct for both options above.
- `SECRET_KEY` — replace it with a long random value. Generate one with:

```powershell
.\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(48))"
```

`.env` holds secrets and is listed in `.gitignore` — never commit it.

---

## 5. Create the tables and load the data

```powershell
.\.venv\Scripts\alembic.exe upgrade head     # creates all 7 tables (and applies later changes)
.\.venv\Scripts\python.exe -m app.seed       # loads destinations, attractions, hotels, restaurants, transport
```

The seed command is safe to run again — it updates rows instead of duplicating them.

**If you change the frontend data files** (`src/data/*.js`), re-export them first,
from the **project root** (the folder that contains `src` and `backend`):

```powershell
cd "D:\Siam new\UIU\ai\VromonBondhu"
node backend/scripts/export_frontend_data.mjs
cd backend
.\.venv\Scripts\python.exe -m app.seed
```

---

## 6. Start the server

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

- API: http://localhost:8000/api/health → `{"status": "ok", "database": "ok"}`
- **Interactive docs: http://localhost:8000/docs** — every endpoint can be tried from the browser.
- Stop the server with `Ctrl + C`.

### Try it in /docs

**Plan a trip (no login needed):** open **POST /api/trips/generate** → *Try it out* → paste:

```json
{
  "from": "Dhaka", "destination": "Cox's Bazar", "days": 4, "nights": 3, "travelers": 2,
  "startDate": "", "budget": 15000, "budgetMode": "strict",
  "budgetCovers": ["transportation", "accommodation", "food", "activities"],
  "interests": ["adventure", "photography", "food", "beach"], "travelStyle": "packed",
  "transport": ["flight"], "food": [], "accommodation": "mid-range", "crowd": "balanced", "notes": ""
}
```

→ *Execute*. You get `{status, trip, budgetReport, adjustmentsMade}` — the same shape the
frontend's `generateTrip()` returns — plus `trip.explanation` showing the AI's reasoning.
Change `"from"` to `"Sajek Valley"` to see a readable 422 error.

**Save it (login needed):**

1. Open **POST /api/auth/register** → *Try it out* → send
   `{"name": "Nadia", "email": "nadia@example.com", "password": "my-password-1"}`.
2. Copy the `accessToken` from the response.
3. Click **Authorize** (top right), paste the token, click *Authorize*.
4. Open **POST /api/trips** and send `{"trip": <the "trip" object from generate>}`.
5. **GET /api/trips** lists your trips; **GET/DELETE /api/trips/{id}** reads or deletes one.

---

## 7. Run the tests

```powershell
.\.venv\Scripts\python.exe -m pytest -v
```

The tests do **not** need PostgreSQL: each test uses a fresh temporary SQLite database
loaded with the real seed data. (JSONB columns automatically fall back to plain JSON there.)

---

## 8. Watch the planner work (no UI, no database needed)

```powershell
.\.venv\Scripts\python.exe -m app.demo_plan
```

It prints every candidate place with its five component scores, each hard-constraint
check, every repair step with the cost before and after, and the final itinerary.
Try other requests:

```powershell
.\.venv\Scripts\python.exe -m app.demo_plan --budget 12000 --mode flexible --style relaxed
.\.venv\Scripts\python.exe -m app.demo_plan --to Sundarbans --days 3 --travelers 3 --budget 5000
.\.venv\Scripts\python.exe -m app.demo_plan --help
```

---

## The planning engine (`app/services/planner/`)

Classical AI — heuristic scoring, CSP-style constraint checking, greedy local search
and greedy scheduling. **No machine learning.** Pure Python: it does not use FastAPI
or the database, so it can be tested on its own.

| File | Technique | What it does |
|---|---|---|
| `preferences.py` | formula | Interest weights `W_i = (N − Rank_i + 1) / N` |
| `recommendation.py` | heuristic scoring | `Score = 0.40·Interest + 0.15·Budget + 0.15·Time + 0.15·Distance + 0.15·Preference` (each 0–1) |
| `constraints.py` | CSP-style constraints | Checks 6 hard constraints, returns plain-English violations |
| `budget.py` | business logic | Total = transport + stay + food + activities + local transport + misc, from the itinerary's own legs |
| `repair.py` | greedy local search | One change at a time (same 6 levers and order as the frontend) until the budget fits |
| `scheduler.py` | greedy scheduling | Builds days (nearby places together), lays out times, meals and travel |
| `ordering.py` | greedy heuristic | Nearest-neighbour order within each time of day (replaceable) |
| `transport.py` | data processing | Distances, travel times, sample fares (port of `transportPlanner.js`) |
| `generator.py` | pipeline | rank → build days → schedule → cost → validate → repair → validate |
| `config.py` | settings | Every rate, fare and weight (sample estimates / proposed defaults, not tuned) |

`generate_trip(inputs, catalog)` returns **exactly** the frontend's
`generateTrip()` shape — `{status, trip, budgetReport, adjustmentsMade}` — plus one
optional field the frontend ignores: `trip.explanation`
(`topScoredPlaces`, `constraintChecks`, `repairSteps`).

### Parity with the frontend

`tests/planner/golden_values.json` holds answers produced by running the
**frontend's own JavaScript**. The tests check the Python gives identical numbers.
Regenerate it after changing frontend cost or transport code, from the project root:

```powershell
cd "D:\Siam new\UIU\ai\VromonBondhu"
node backend/scripts/make_golden_values.mjs
```

**Identical to the frontend:** every intercity fare and duration, every local leg,
hotel choice, rooms, miscellaneous, interest weights, rounding (the Python uses
`js_round`, which rounds halves up like JavaScript), budget rules
(`STRICT_TOLERANCE = 0`, `FLEXIBLE_LIMIT = 0.30`), lever order, and message wording.

**Intentional differences** (so the same inputs can give a different itinerary than the frontend placeholder):

1. **Place ranking** uses the five-component score. The frontend only adds up interest weights with a crowd bonus or penalty.
2. **Days are built greedily around the previous stop**, so nearby places share a day, and each day is filled with the best places that still fit.
3. **Packed trips fill leftover gaps** after the repair step, as long as the budget allows. A place removed during repair can come back this way; its "Removed …" message is then dropped, so the messages describe only the final plan.
4. **Stops are ordered by nearest neighbour** within each time of day. The frontend keeps the data order.
5. **The user's selected transport drives the choice.** The repair only moves between selected intercity modes. A mode the user didn't select is used only as a last resort, when no selected mode can fit the budget (or none runs on the route). That switch is recorded in `adjustmentsMade`, for example "Switched the main journey from your selected Bus/Flight to Train because it was the only way to fit your budget.", and flagged with `trip.transport.outbound.selected = false` / `return.selected = false`. In that case the return leg is chosen on its own and can use a different mode. Consecutive switches between selected modes become one message.
6. **Day limits are always enforced.** After a slower mode is chosen, each day is re-fitted to its activity limit.
7. **Trip ids** look like `trip-<16 hex characters>` instead of `trip-<timestamp>`.
8. **`trip.explanation` is added.**

---

## Endpoints

| Method | Path | Login? | What it does |
|---|---|---|---|
| GET | `/api/health` | no | Server and database status |
| POST | `/api/auth/register` | no | Create an account → login token |
| POST | `/api/auth/login` | no | Log in → login token (rate-limited) |
| GET | `/api/auth/me` | **yes** | The logged-in user |
| POST | `/api/trips/generate` | no | **Plan a trip.** Returns the frontend contract; nothing is saved |
| POST | `/api/trips` | **yes** | Store a generated trip as a snapshot: `{"trip": {...}, "saved": true}` (Save Trip) or `"saved": false` (planned). Sending the same trip again returns the existing record |
| GET | `/api/trips` | **yes** | My trips, newest first; `?saved=true` or `?saved=false` to filter |
| GET | `/api/trips/{id}` | **yes** | One of my trips (someone else's → 404) |
| PATCH | `/api/trips/{id}` | **yes** | Mark a trip saved or not saved: `{"saved": true}` |
| DELETE | `/api/trips/{id}` | **yes** | Delete one of my trips (someone else's → 404) |
| GET | `/api/reference/destinations` | no | All 12 destinations |
| GET | `/api/reference/attractions` | no | Attractions (optional `?destinationId=`) |
| GET | `/api/reference/hotels` | no | Hotels (optional `?destinationId=`) |
| GET | `/api/reference/restaurants` | no | Restaurants (optional `?destinationId=`) |
| GET | `/api/reference/transport` | no | Transport hubs (optional `?destinationId=`) |

JSON uses **camelCase** field names (`pricePerNight`, `hasAirport`), the same as the frontend.

**Every error has the same shape:**

```json
{ "error": { "code": "validation_error", "message": "Unknown destination 'atlantis'. Supported destinations: ...", "details": [ { "field": "destinationId", "message": "..." } ] } }
```

Unexpected errors return a generic message; stack traces are never sent to the browser.

---

## Folder guide

```
backend/
  app/
    main.py          starts the app: CORS, error handling, routes
    config.py        reads settings from .env
    database.py      database connection
    models/          database tables (SQLAlchemy)
    schemas/         request/response shapes (Pydantic, camelCase JSON)
    api/
      routes/        the endpoints (health, auth, reference)
      deps.py        "must be logged in" check
      errors.py      the single error format
    services/
      security.py    password hashing (Argon2) and login tokens (JWT)
      rate_limit.py  login attempt limit
      catalog_repository.py  database rows → the planner's plain data
      planner/       the planning engine (see the table above)
    seed/            seed JSON files + the loader (python -m app.seed)
    demo_plan.py     python -m app.demo_plan — the planner step by step
  alembic/           database migrations (0001 creates all tables)
  scripts/
    export_frontend_data.mjs   frontend src/data → app/seed/*.json
    make_golden_values.mjs     frontend JS answers for the parity tests
  tests/             pytest tests (tests/planner/ = the engine on its own)
  docs/
    WHERE_IS_AI.md   the AI explained for the lab viva, with worked examples
  docker-compose.yml PostgreSQL for Docker users
  .env.example       copy to .env
```

## Database tables

`destinations`, `attractions`, `hotels`, `restaurants`, `transport_hubs` (reference data),
`users` (UUID id, unique email, Argon2 password hash), and `saved_trips`.

`saved_trips.trip_json` stores the **whole generated trip as a JSONB snapshot on purpose**:
a saved itinerary must never change later when prices or places in the reference data are updated.

## Security notes

- Passwords are hashed with **Argon2** (`argon2-cffi`); the plain password is never stored.
- Login uses **JWT bearer tokens** signed with `SECRET_KEY` from `.env`. The server
  **refuses to start** if `SECRET_KEY` is the placeholder or shorter than 32 characters.
- Wrong email and wrong password give the same message, so accounts can't be discovered.
- **Login rate limit:** after 5 failed logins for one email from one address within
  15 minutes, further attempts get `429 Too many failed login attempts`. A successful login
  resets the count. *Limitation:* the counts are kept in the server's memory. They reset on
  restart and aren't shared between several server processes. For a real deployment, use
  a shared store (e.g. Redis) or a reverse-proxy limit.
- **Request size limit:** bodies over `MAX_REQUEST_BYTES` (default 256 KB) get `413`.
- **Every error has the same format**, and unexpected errors return a generic message.
  Stack traces are only written to the server log, never sent to the client.
- **Trips are private:** a user can only list, read or delete their own trips.
  Someone else's trip id answers "Trip not found", just like an id that doesn't exist.
- CORS allows only `CORS_ORIGINS` from `.env` (default `http://localhost:5173`).
- Secrets come only from `.env`, which `.gitignore` keeps out of git.

## Assumptions

- The budget is the **total for the whole group**, as in the frontend.
- `POST /api/trips` stores the trip object the client sends, as a snapshot, after checking
  that it has the fields a generated trip has. It does not re-plan the trip.
  (Saved trips belong only to the user who saved them.)
- Saved trips are returned as `{id, title, destinationId, days, travelers, budgetTotal,
  estimatedCost, budgetMode, createdAt, trip, inputs}`. `id` is the database id
  (a UUID), and `trip.id` keeps the planner's own id.
- Reference data is read from the database on each planning request (about 170 rows).
