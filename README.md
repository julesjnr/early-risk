# Early Risk Check — Early Disease Risk Assessment System

Full-stack scaffold for the DIT2108 proposal: users register, submit health data, get risk levels
for type 2 diabetes, heart disease and high blood pressure, and keep a history of assessments.
Clinicians can review assessments; admins manage users and roles.

**Stack:** React + TypeScript (Vite) · Node + Express 5 · PostgreSQL via Drizzle ORM · JWT in an httpOnly cookie.

## Documentation

- [Project overview](docs/01-overview.md)
- [Architecture](docs/02-architecture.md)
- [Database schema](docs/03-database.md)
- [API reference](docs/04-api-reference.md)
- [Risk scoring](docs/05-risk-scoring.md)
- [Security and privacy](docs/06-security-and-privacy.md)
- [Setup and deployment](docs/07-setup-and-deployment.md)
- [User manual](docs/08-user-manual.md)
- [Testing](docs/09-testing.md)
- [Limitations and future work](docs/10-limitations-and-future-work.md)

## Run the frontend
```bash
cd client && npm install && npm run dev      # http://localhost:3000
```
`client/.env.development` currently sets `VITE_MOCK=false`, so the app uses the real API through Vite's `/api` proxy and needs the server running. For a standalone browser demo, set `VITE_MOCK=true` in that file and restart Vite to use the in-browser mock API (localStorage).
When mock mode is enabled, demo logins are `admin@demo.test` and `clinician@demo.test`, password `password123`; you can also register a mock patient.
For mock mode, use `VITE_MOCK=true`. `client/src/mockScoring.ts` is a copy of the server scoring: keep them in sync.

## Run locally (full stack)
```bash
# 1. database: any Postgres (e.g. a free Supabase project) -> copy its connection string
cp .env.example server/.env        # then edit DATABASE_URL and JWT_SECRET

# 2. server
cd server && npm install
npm run db:push                    # creates tables
npm run dev                        # http://localhost:8000

# 3. client (new terminal)
cd client && npm install
npm run dev                        # http://localhost:3000 (proxies /api to the server)
```
First admin: register normally, then run this SQL with the registered email:
```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

## Test the backend
With the server running and a user promoted to admin (see above):
```bash
cd server && ADMIN_EMAIL=you@example.com npm run smoke      # optional ADMIN_PASSWORD, default password123
```
The script covers registration, login, validation, scoring, role enforcement, patient data isolation,
admin role changes and the clinician review list. It runs 19 checks when `ADMIN_EMAIL` is set and
admin flows pass; otherwise admin/clinician checks are skipped. Test users are not removed afterward.
For local runs set `AUTH_RATE_LIMIT=500` in `server/.env` if needed
(the default is 50 requests per 15 minutes).

## Layout
- `server/src/scoring.ts` — the risk engine (rule-based, single source of truth; swap in an ML model later)
- `server/src/db/schema.ts` — `users`, `assessments`
- `server/src/routes/` — `auth`, `assessments`, `admin`
- `client/src/pages/` — Login, Assess, History, Review (clinician/admin), Admin

## Before real patients use it
- Scores are simplified and **not clinically validated**; validate with clinicians before relying on them.
- Health data is sensitive personal data under Kenya's Data Protection Act 2019: get consent, minimise what you store,
  register with the ODPC if required, use HTTPS, and encrypt backups.
- Deploy: client on Vercel; Express on a Node host (Render/Railway) or wrap it as a Vercel serverless function.
  Set `NODE_ENV=production` so cookies are `secure`, and serve client and API on the same site.
