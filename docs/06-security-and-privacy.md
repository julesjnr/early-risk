# 6. Security and privacy

This section distinguishes protections visible in source from controls that should be addressed before using real patient data. It is a technical project document, not legal advice.

## Implemented protections

### Authentication and session

- Real API passwords are hashed with `bcryptjs.hash(password, 12)` and compared with `bcrypt.compare`.
- A signed JWT contains the user ID and role; it expires after eight hours.
- The JWT is placed in a cookie named `token` with `httpOnly: true`, `sameSite: "lax"`, and `secure` only when `NODE_ENV === "production"`.
- `client/src/api.ts` sends real API requests with `credentials: "include"`.
- Logout clears the cookie. The API's `GET /api/auth/me` checks the cookie and looks up the user.
- `JWT_SECRET` must be set and at least 16 characters when a token is signed or verified. The code does not generate the secret automatically.

The frontend holds a copy of the signed-in user's role in React state for navigation, but protected API routes perform their own role checks. Frontend hiding is not the security boundary.

### Role access

| Route | Unauthenticated | Patient | Clinician | Admin |
|---|---:|---:|---:|---:|
| `POST /api/auth/register` | Yes | Yes | Yes | Yes |
| `POST /api/auth/login` | Yes | Yes | Yes | Yes |
| `POST /api/auth/logout` | Yes | Yes | Yes | Yes |
| `GET /api/auth/me` | No | Yes | Yes | Yes |
| `GET /api/health` | Yes | Yes | Yes | Yes |
| `POST /api/assessments` | No | Yes | Yes | Yes |
| `GET /api/assessments` (own history) | No | Yes | Yes | Yes |
| `GET /api/assessments/review` | No | No | Yes | Yes |
| `GET /api/admin/users` | No | No | No | Yes |
| `PATCH /api/admin/users/:id/role` | No | No | No | Yes |

### Other controls

- Zod validates registration, login, assessment, and role-change bodies. Express JSON parsing is limited to 20 KB.
- `helmet()` is applied to requests.
- Express rate limiting is applied to all routes mounted under `/api/auth`: 50 requests per 15 minutes by default, configurable with `AUTH_RATE_LIMIT`.
- Patient history is filtered by the authenticated user ID. Review is role protected; admin user listing does not return password hashes.
- Assessment deletion cascades when a user is deleted, but a user deletion endpoint is not implemented.
- The default unhandled-error response avoids returning exception details; server errors are logged with `console.error`.

## Kenya Data Protection Act 2019 and sensitive health information

Health and lifestyle answers are sensitive personal information. Relevant legal obligations depend on deployment, controller/processor roles, purpose, and the applicable facts. The presence of this code does not establish compliance with Kenya's Data Protection Act 2019 or its regulations.

| Area | Visible in code now | Needed before real-patient use |
|---|---|---|
| Consent and transparency | The login page says answers are stored for history and results are not a diagnosis. A specific consent screen or consent record is **not implemented**. | Provide clear notices and a lawful basis; obtain and record consent where required and document withdrawal handling. |
| Data minimisation and purpose | The form collects fields used by the current score. Patient history is restricted to the current account; staff review returns patient name/email and results. | Assess necessity, purpose limitation, access boundaries, and retention with the responsible institution and privacy/legal advisers. |
| Retention and deletion | Assessments persist in PostgreSQL. User deletion route, retention schedule, and automated purge are **not implemented**. | Define a retention period, implement deletion/export workflows as required, and test backup expiry. |
| Encryption | Passwords are hashed. Cookie is Secure in production. HTTPS, database encryption at rest, key rotation, and encrypted backup configuration are **not implemented** by this repository. | Require HTTPS; configure hosted database TLS and storage/backup encryption; protect and rotate `JWT_SECRET`; review hosting controls. |
| Breach handling | Security headers and generic server errors are present. Breach detection, incident response, and notification workflow are **not implemented**. | Establish monitoring, incident response, evidence preservation, and legally required notification procedures. |
| Access and accountability | Role checks are applied to review/admin APIs. Audit logging and periodic access review are **not implemented**. | Add auditable access/change records and operational review appropriate to the deployment. |
| Cross-origin / CSRF | API calls use cookies; cookie SameSite is Lax. CORS middleware and an explicit CSRF token mechanism are **not implemented**. Local Vite uses a same-origin proxy. | Keep a same-site deployment where possible; verify production origin/cookie behavior and assess CSRF protection for the final topology. |

## Demo-mode warning

`client/src/mock.ts` stores users, password strings, sessions, and assessments in browser `localStorage`. Demo passwords are kept in plain text there by design. Mock mode is for demonstration only; it is not secure account storage and must not be used for real patient data.

## Risks to review

- `server/src/auth.ts` casts the decoded JWT payload to `Session` without validating the payload's ID and role shape against an allowlist. A JWT signed with the application's secret but containing an unexpected role or malformed ID could behave unpredictably; validate claims explicitly.
- The same middleware catches every error from JWT verification, including a missing/too-short `JWT_SECRET`, and responds `401` without logging that configuration failure. This can make a server configuration problem look like an ordinary expired session.
- Role checks use the role stored in the JWT. Changing a user's database role does not invalidate already-issued tokens, so an existing session can retain its former permissions until the token expires or the user signs out.
- `app.set("trust proxy", 1)` assumes a deployment with exactly one trusted proxy hop. The deployment must match this assumption, or client IP handling (including rate-limit keys) may be unreliable.
- The `users.role` column is a text column with Drizzle TypeScript enum choices, not a declared database enum/check constraint. Database-level constraints are **not implemented**.
- Admin target IDs are not validated as UUIDs before the database query; malformed values may become an unhandled database error rather than a clean `400`.
- Assessment submission has no route-specific rate limiter; only `/api/auth/*` is rate-limited.
- No explicit database pool shutdown, connection health endpoint, backup system, or database TLS policy is configured in the checked-in code.
