# 7. Setup and deployment

These instructions assume a Debian/Ubuntu-style Linux system and a shell. The repository does not pin a Node.js version; use a Node.js release compatible with the Vite 5 and installed package versions.

## 1. Install Node.js, npm, and PostgreSQL

```bash
sudo apt update
sudo apt install nodejs npm postgresql postgresql-contrib openssl
```

Confirm the commands are available:

```bash
node --version
npm --version
psql --version
```

The exact Node version supplied by the Linux distribution depends on that distribution's repositories. A Node version installation/version manager is **not specified** by this project.

## 2. Set a PostgreSQL password and create the database

Open the PostgreSQL prompt as its system administrator:

```bash
sudo -u postgres psql
```

At the `psql` prompt, set the password and create the database:

```sql
\password postgres
CREATE DATABASE earlyrisk;
\q
```

Use the password entered at the `\password` prompt in the database URL in the next step. If it contains URL-reserved characters, percent-encode them in the URL.

## 3. Create `server/.env`

From the repository root, create the file with an editor:

```bash
nano server/.env
```

Enter the following and replace both example values. The JWT secret must be at least 16 characters; use a long random secret instead of the sample:

```dotenv
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/earlyrisk
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
PORT=8000
```

To generate a random hex string in a separate terminal:

```bash
openssl rand -hex 32
```

The server loads `.env` using `dotenv/config`. Do not commit a real `.env` or share its secrets.

## 4. Install dependencies and create tables

From the repository root:

```bash
cd server
npm install
npm run db:push
```

`db:push` is the actual package script and invokes Drizzle Kit using `server/drizzle.config.ts`.

## 5. Start the server

In a terminal with its current directory set to `server/`:

```bash
npm run dev
```

The server listens on `PORT` or `8000` and logs its URL. Open a second terminal for the client. The health route can be checked with:

```bash
curl http://localhost:8000/api/health
```

Expected response:

```json
{"ok":true}
```

This endpoint returns a constant success response; it does not verify database connectivity.

## 6. Create the first admin

Start the client, register an account, and then promote that account using SQL. The database name is `earlyrisk`:

```bash
sudo -u postgres psql -d earlyrisk
```

At the SQL prompt, replace the email with the registered account's email:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
\q
```

The normal registration route only creates patient accounts. This SQL promotion is how the project README describes creating the first admin.

## 7. Configure and start the client

The project currently has `client/.env.development` with `VITE_MOCK=false`. To set it explicitly:

```bash
printf 'VITE_MOCK=false\n' > client/.env.development
```

If your shell has a `VITE_MOCK` environment variable set, remove it from that shell before starting Vite so it does not override the env-file setting:

```bash
unset VITE_MOCK
```

Start the client in a separate terminal:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:3000`. Vite proxies `/api` to `http://localhost:8000` in development. Vite reads env values when it starts, so restart the client after changing `VITE_MOCK`.

To use the browser-only demo instead, set `VITE_MOCK=true` in `client/.env.development` and restart Vite. Demo users are `admin@demo.test` and `clinician@demo.test`, both with password `password123`; demo data is stored in localStorage.

## Smoke test

The server package defines `npm run smoke`. Start the server first. See [testing](09-testing.md) for how to run it with and without the optional admin checks.

## Troubleshooting

| Symptom | Likely code/config cause | What to check |
|---|---|---|
| `Peer authentication failed` | PostgreSQL local peer authentication expects a matching Linux account; the server URL may be using a local socket or no password. | Use the TCP URL shown above with `@localhost:5432`, confirm the `postgres` password, and make sure the URL's password is correct and URL-encoded if necessary. |
| Server says `JWT_SECRET must be set (16+ characters)` | `server/.env` is missing, not loaded, or the secret is shorter than 16 characters. | Confirm `server/.env` contains `JWT_SECRET` and restart `npm run dev` from `server/`. |
| The login screen still says “Demo mode” | Vite was started with `VITE_MOCK=true` or has not been restarted after changing env settings. | Confirm `client/.env.development` is `VITE_MOCK=false`, check the shell environment, restart Vite, and confirm the console says “Using real API at /api”. |
| Login says email or password is incorrect | The real database has no account with that email, capitalization differs before the registration path normalized it, or the password is wrong. | Register the account against the real API or check the email/role in `users`; mock demo credentials do not exist in PostgreSQL. |
| `localhost:8000` is unavailable or browser requests fail | The Express server is stopped, failed at startup, uses another `PORT`, or the client proxy target is unavailable. | Read the server terminal, check `PORT`, then use `curl http://localhost:8000/api/health`. |
| `db:push` or a database request fails | `DATABASE_URL` is wrong, PostgreSQL is stopped, or database access is denied. | Verify PostgreSQL is running and that the database and credentials match `server/.env`. |

## Deployment

The README suggests a Vercel-hosted client, an Express API on Render or Railway (or wrapping it as a Vercel serverless function), and hosted PostgreSQL such as Supabase. Provider-specific deployment files and a serverless adapter are **not implemented** in this repository. Treat the following as deployment requirements to configure, not existing infrastructure.

### Client

- Build command from `client/`: `npm run build`.
- The repository's Vite proxy is a development-server setting, not a production reverse proxy. In production, configure the frontend/API domains or hosting rewrites so `/api` reaches the API on the same site. No production rewrite is included here.
- Frontend calls use relative `/api` URLs and cookies with `credentials: "include"`.
- `VITE_MOCK=false` must be present at client build time for real API use. `VITE_MOCK` is a frontend build-time setting, not a server secret.

### API and database

Configure the API service with:

| Variable | Requirement |
|---|---|
| `DATABASE_URL` | PostgreSQL connection URL. For hosted databases, use the provider's required SSL settings; the application passes the URL to `pg.Pool` and does not force TLS options itself. |
| `JWT_SECRET` | Required, at least 16 characters; use a securely generated secret. |
| `PORT` | Optional; defaults to `8000`. |
| `NODE_ENV` | Set to `production` so the session cookie gets the `Secure` attribute. |
| `AUTH_RATE_LIMIT` | Optional; default 50 auth-route requests per 15 minutes. |

Build the server with `npm run build` from `server/`; start the compiled server using `npm start`. Hosted PostgreSQL providers may require SSL parameters in `DATABASE_URL`; check the provider's current connection-string documentation. TLS configuration is not explicitly set in this project's `pg.Pool` options.

Use HTTPS, protect environment secrets, configure backups and retention, and verify same-site cookie behavior for the actual hosting topology before real users access health data. Provider account setup, domain routing, migrations on deploy, automated backups, and monitoring are **not implemented** here.
