# 9. Testing

## Backend smoke test

`server/scripts/smoke.mjs` sends HTTP requests to a running server. It checks:

- Patient registration and duplicate-email rejection.
- Wrong-password rejection and current-session lookup.
- Unauthenticated-route protection.
- Rejection of invalid assessment input.
- Assessment creation, presence of three risk results, high-risk scoring, and the checkup flag.
- Patient history and isolation between two patients.
- Patient denial for review/admin routes and patient self-promotion denial.
- Optional admin login, user listing, role promotion, clinician review visibility, and prevention of changing the logged-in admin's own role.
- Malformed JSON handling.

The script does not create or migrate the database, start the server, or clean up the test users and assessments it creates.

### Run it

In one terminal, start the server with a working database and schema:

```bash
cd server
npm run dev
```

In another terminal, run the smoke checks. From the repository root:

```bash
cd server
npm run smoke
```

Without `ADMIN_EMAIL`, the admin/clinician flow is skipped. To run those checks, promote an existing account to admin first, then run:

```bash
cd server
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='your-password' npm run smoke
```

`ADMIN_PASSWORD` is optional in the script and defaults to `password123`. The account named by `ADMIN_EMAIL` must already exist and have the admin role. The script always creates uniquely named test patients and does not delete them afterward.

### Expected output

Each completed check prints `PASS` or `FAIL`, followed by a summary:

```text
14 passed, 0 failed
```

With `ADMIN_EMAIL` set and admin flows succeeding, the current script runs 19 checks and should finish with:

```text
19 passed, 0 failed
```

When admin checks are skipped, a `SKIP` line explains why. A nonzero failure count makes the script exit with status 1.

## Frontend manual checklist

No automated frontend test script or frontend test files are configured in `client/package.json`.

- [ ] Start the client in mock mode and sign in with a demo account.
- [ ] Register a patient and confirm the client reaches the assessment.
- [ ] Complete all three assessment steps and inspect all risk levels, factors, tips, and the clinician prompt.
- [ ] Open history and expand an assessment.
- [ ] Print the result view using the browser print dialog.
- [ ] Sign in as a clinician and check the review list.
- [ ] Sign in as an admin and list users; change another user's role.
- [ ] Start the real server and database, set `VITE_MOCK=false`, and repeat with the real API.
- [ ] Check `GET /api/health`, then inspect browser Network requests for `/api` responses.
- [ ] Check phone/tablet widths for navigation, forms, tables, and result rulers.

The repository contains no automated frontend unit, integration, accessibility, or browser end-to-end tests. The manual checklist is not automatically enforced.
