# 2. Architecture

## Three tiers

1. **Presentation tier — `client/`:** React and TypeScript render the sign-in flow, questionnaire, results, history, review list, and user-management table. Vite serves the frontend in development and proxies `/api` to the Express server.
2. **Application tier — `server/src/`:** Express exposes JSON endpoints, checks sessions and roles, validates request bodies with Zod, calls the scoring function, and reads or writes through Drizzle.
3. **Data tier — PostgreSQL:** Drizzle maps the `users` and `assessments` tables. Assessment inputs and results are JSONB values.

The mock mode is an alternate frontend data path: `client/src/api.ts` calls `client/src/mock.ts` when `VITE_MOCK` is exactly `"true"`. It stores demo state in browser `localStorage` and does not contact Express or PostgreSQL.

## Technologies and their observed roles

| Technology | Use visible in this repository |
|---|---|
| React | Composes the frontend into components and pages. |
| TypeScript | Types frontend data and server code; the client build runs `tsc --noEmit`. |
| Vite | Serves the development client on port 3000 and proxies `/api` to `http://localhost:8000`. |
| Node.js | Runs the server-side JavaScript/TypeScript runtime. |
| Express 5 | Routes HTTP requests, parses JSON, applies security middleware, and returns JSON responses. |
| Drizzle ORM / Drizzle Kit | Declares the schema, issues typed database queries, and pushes schema changes using `db:push`. |
| PostgreSQL | Stores users and assessments; JSONB holds assessment input and result objects. |
| Zod | Validates registration, login, assessment, and role-change request bodies. |
| `jsonwebtoken` | Signs and verifies the session JWT. |
| `bcryptjs` | Hashes registered passwords and compares login passwords. |
| `helmet` | Applies HTTP security headers through Express middleware. |
| `cookie-parser` | Makes parsed cookies available to the authentication middleware. |
| `express-rate-limit` | Limits requests to routes mounted under `/api/auth`. |

The code shows these technical roles. It does not record a formal decision log explaining the original selection rationale.

## Folder and important-file map

```text
.
├── README.md                         # Project summary and local commands
├── client/
│   ├── index.html                    # HTML entry point and viewport/font declarations
│   ├── package.json                  # Client scripts and dependencies
│   ├── vite.config.ts                # React plugin and /api development proxy
│   └── src/
│       ├── main.tsx                  # React root, BrowserRouter, and global CSS import
│       ├── vite-env.d.ts              # Vite client type declarations
│       ├── App.tsx                   # Session bootstrap, navigation, route access
│       ├── api.ts                    # API types, mock/real selection, fetch wrapper
│       ├── mock.ts                   # Browser localStorage mock API and demo users
│       ├── mockScoring.ts            # Offline copy of server scoring rules
│       ├── styles.css                # Global styles, responsive and print rules
│       └── pages/
│           ├── Login.tsx             # Registration and sign-in screen
│           ├── Assess.tsx            # Three-step assessment form and result flow
│           ├── ResultView.tsx        # Risk summaries, tips, print action
│           ├── Ruler.tsx             # Three-zone risk ruler
│           ├── History.tsx           # Patient's prior assessments
│           ├── Review.tsx            # Clinician/admin recent-assessment table
│           └── Admin.tsx             # Admin user list and role selector
└── server/
    ├── package.json                  # Server scripts and dependencies
    ├── drizzle.config.ts             # PostgreSQL schema path and migration output directory
    ├── scripts/smoke.mjs             # HTTP smoke checks against a running server
    └── src/
        ├── index.ts                  # Starts Express on PORT or 8000
        ├── app.ts                    # Middleware, route mounts, health and errors
        ├── auth.ts                   # JWT cookie settings and requireAuth middleware
        ├── scoring.ts                # Zod input schema and authoritative score rules
        ├── db/
        │   ├── client.ts             # PostgreSQL pool and Drizzle instance
        │   └── schema.ts             # users and assessments table definitions
        └── routes/
            ├── auth.ts               # Registration, login, logout, and current-user routes
            ├── assessments.ts        # Assessment creation, personal history, staff review
            └── admin.ts              # Admin user listing and role changes
```

## System architecture

```mermaid
flowchart LR
    Browser["Browser / React client"]
    Vite["Vite development server<br/>/api proxy"]
    API["Express 5 API"]
    Auth["JWT cookie + role checks"]
    Validate["Zod validation"]
    Score["Rule-based scoring"]
    ORM["Drizzle ORM"]
    DB[("PostgreSQL")]
    Mock["Mock API<br/>localStorage"]

    Browser -->|"VITE_MOCK=true"| Mock
    Browser -->|"otherwise: fetch /api"| Vite
    Vite -->|"development proxy"| API
    API --> Auth
    API --> Validate
    Validate --> Score
    API --> ORM
    Score --> ORM
    ORM --> DB
```

In a production deployment the Vite development server is not the production API proxy. A production hosting/reverse-proxy arrangement is **not implemented** by the repository; see [setup and deployment](07-setup-and-deployment.md).

## Request flow: submit an assessment

```mermaid
sequenceDiagram
    actor Patient
    participant Browser as React client
    participant API as Express API
    participant Auth as JWT auth middleware
    participant Validate as Zod input schema
    participant Score as assess()
    participant DB as PostgreSQL via Drizzle

    Patient->>Browser: Complete three form steps
    Browser->>API: POST /api/assessments + cookie + JSON answers
    API->>Auth: Verify cookie JWT
    Auth-->>API: User id and role, or 401
    API->>Validate: Check types and allowed ranges
    Validate-->>API: Parsed answers, or 400
    API->>Score: Calculate BMI, factors, levels and tips
    Score-->>API: Results object
    API->>DB: Insert user_id, input JSONB, results JSONB
    DB-->>API: Inserted row
    API-->>Browser: 201 JSON assessment row
    Browser-->>Patient: Render result view
```

## Request flow: login

```mermaid
sequenceDiagram
    actor User
    participant Browser as React client
    participant API as Express API
    participant Limit as Auth rate limiter
    participant Validate as Zod credentials
    participant DB as PostgreSQL via Drizzle
    participant Hash as bcryptjs

    User->>Browser: Enter email and password
    Browser->>API: POST /api/auth/login
    API->>Limit: Check auth request limit
    Limit-->>API: Continue, or 429
    API->>Validate: Validate email and password
    API->>DB: Find matching email (only if body is valid)
    DB-->>API: User row, or no row
    API->>Hash: Compare password with password_hash
    Hash-->>API: Match, or mismatch
    API-->>Browser: 200 user JSON + Set-Cookie JWT, or 401
    Note over Browser,API: Cookie is httpOnly, SameSite=Lax, and Secure only in production
```
