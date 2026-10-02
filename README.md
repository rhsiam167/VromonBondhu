# ভ্রমণবন্ধু (Vromon Bondhu)

A personalized travel planner for trips within Bangladesh.

| Part | Folder | Runs at |
|---|---|---|
| Website (React + Vite) | this folder (`src/`) | http://localhost:5173 |
| API + planning engine (FastAPI) | `backend/` | http://localhost:8000 (docs at `/docs`) |
| Database (PostgreSQL 18) | Windows service `postgresql-x64-18` | localhost:5432 |

Where is the AI? See **[backend/docs/WHERE_IS_AI.md](backend/docs/WHERE_IS_AI.md)**.
All prices are sample estimates, not live prices.

---

## Start everything (normal run)

You need **two PowerShell windows**: one for the backend, one for the website.

### 1. Make sure PostgreSQL is running

PostgreSQL starts automatically with Windows. To check:

```powershell
Get-Service postgresql-x64-18
```

If the status isn't **Running**, start it in an **Administrator** PowerShell:

```powershell
Start-Service postgresql-x64-18
```

### 2. Start the backend (window 1)

```powershell
cd "D:\Siam new\UIU\ai\VromonBondhu\backend"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Leave it running. Check http://localhost:8000/api/health shows `{"status":"ok","database":"ok"}`.

### 3. Start the website (window 2)

```powershell
cd "D:\Siam new\UIU\ai\VromonBondhu"
npm run dev
```

### 4. Open the app

**http://localhost:5173**. Register your own account with **Sign Up**, then plan and save trips.

To stop: press `Ctrl + C` in each window.

---

## First-time setup (already done on this machine)

1. **PostgreSQL 18:** `winget install --id PostgreSQL.PostgreSQL.18 --interactive`. You choose
   the `postgres` superuser password during installation.
2. **Database and app user:** database `vromon_bondhu`, owned by the user `vromon`. The
   connection string and a random `SECRET_KEY` are in `backend/.env`, which is never committed.
3. **Backend:** see [backend/README.md](backend/README.md), steps 2–5. In short:
   `python -m venv .venv`, `pip install -r requirements.txt`, `alembic upgrade head`,
   `python -m app.seed`.
4. **Website:** `npm install` in this folder.

### Settings

- `backend/.env`: database connection, secret key, CORS, limits (template: `backend/.env.example`).
- `.env` in this folder (optional): `VITE_API_BASE_URL` is the backend address, by default
  `http://localhost:8000` (template: `.env.example`).

---

## How the website uses the backend

| Website action | Backend call |
|---|---|
| Register / Log In | `POST /api/auth/register`, `POST /api/auth/login` |
| Stay logged in after a refresh | `GET /api/auth/me` (the login token is kept in the browser's localStorage) |
| Generate My Trip | `POST /api/trips/generate`; when logged in, the trip is also stored under **Recently Planned** (`POST /api/trips` with `saved: false`) |
| Save Trip | Moves it to **Saved Trips** (`POST /api/trips` with `saved: true`, or `PATCH /api/trips/{id}`). Asks you to log in or sign up first if needed |
| Mark as Completed / Mark as Upcoming (Home, My Trips) | `PATCH /api/trips/{id}` with `completed: true` / `false` (saved trips only) |
| My Trips / Home | `GET /api/trips` (My Trips shows three sections: Saved Trips (upcoming), Completed Trips and Recently Planned) |
| Open a trip | `GET /api/trips/{id}` |
| Delete (on My Trips) | `DELETE /api/trips/{id}` |

The code that talks to the backend is in `src/services/apiClient.js`, `src/services/tripGenerator.js`,
`src/context/AuthContext.jsx` and `src/context/SavedTripsContext.jsx`.

## Tests

```powershell
cd "D:\Siam new\UIU\ai\VromonBondhu\backend"
.\.venv\Scripts\python.exe -m pytest -q
```

By default the tests use a temporary SQLite database. To run them against PostgreSQL, set
`TEST_DATABASE_URL` to the separate test database `vromon_bondhu_test`, never the real one
(see `backend/tests/conftest.py`).

## Planner demo (for presentations)

```powershell
cd "D:\Siam new\UIU\ai\VromonBondhu\backend"
.\.venv\Scripts\python.exe -m app.demo_plan
```
