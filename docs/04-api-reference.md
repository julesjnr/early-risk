# 4. API reference

All routes are mounted under `/api` by `server/src/app.ts`. In local development, Vite serves the client at `http://localhost:3000` and proxies `/api` to `http://localhost:8000`. Requests and responses use JSON except that successful authentication also sets a cookie.

## Common behavior

- Authenticated routes read a JWT from the `token` cookie.
- Missing, expired, or invalid authentication returns `401 {"error":"Please sign in"}`.
- Insufficient role returns `403 {"error":"Not allowed"}`.
- Invalid JSON is handled as `400 {"error":"Invalid JSON"}`.
- Unhandled server errors are logged on the server and return `500 {"error":"Something went wrong on our side"}`.
- The auth rate limiter covers `/api/auth/*`; it is configured for 50 requests per 15 minutes by default, or `Number(AUTH_RATE_LIMIT)` when set. Rate-limit responses use express-rate-limit's default response and status `429`.

## Health

### `GET /api/health`

**Who:** Anyone; no cookie required. The route only returns a constant response and does not test database readiness.

**Body:** None.

**Success:** `200 {"ok":true}`.

**Errors:** No route-specific errors are declared.

```bash
curl -i http://localhost:8000/api/health
```

## Authentication

### `POST /api/auth/register`

**Who:** Anyone. New registrations always receive the `patient` role.

**JSON body:**

| Field | Type and rules |
|---|---|
| `name` | String, 1–100 characters. |
| `email` | Valid email string; normalized to lowercase by Zod. |
| `password` | String, 8–128 characters. |

**Success:** `201`; response has `{ "id": "<uuid>", "name": "...", "role": "patient" }`. Sets the `token` cookie.

**Errors:** `400` for invalid fields; `409 {"error":"That email is already registered"}` for duplicate email; `429` if rate-limited; `500` for unhandled errors.

```bash
curl -i -c cookies.txt http://localhost:8000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Example Patient","email":"patient@example.test","password":"password123"}'
```

### `POST /api/auth/login`

**Who:** Anyone.

**JSON body:** `email` is a valid email string normalized to lowercase; `password` is a string of 8–128 characters.

**Success:** `200`; response has `{ "id": "<uuid>", "name": "...", "role": "patient|clinician|admin" }`. Sets the `token` cookie.

**Errors:** `401 {"error":"Email or password is incorrect"}` for invalid credentials or invalid login body; `429` if rate-limited; `500` for unhandled errors.

```bash
curl -i -c cookies.txt http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"patient@example.test","password":"password123"}'
```

### `POST /api/auth/logout`

**Who:** Anyone; the handler does not require authentication. It clears the `token` cookie.

**Body:** None.

**Success:** `200 {"ok":true}`.

**Errors:** `429` if rate-limited; `500` for unhandled errors.

```bash
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:8000/api/auth/logout
```

### `GET /api/auth/me`

**Who:** Signed-in user of any role.

**Body:** None.

**Success:** `200` with `{ "id": "<uuid>", "name": "...", "role": "patient|clinician|admin" }`.

**Errors:** `401 {"error":"Please sign in"}` when the cookie is missing/invalid or no corresponding user row exists; `429` if rate-limited; `500` for unhandled errors.

```bash
curl -i -b cookies.txt http://localhost:8000/api/auth/me
```

## Assessments

The `POST /api/assessments` body uses the following Zod schema. Numeric values must be JSON numbers; `age` must be an integer. All listed fields except `sys` are required.

| Field | Type and allowed values | Meaning shown by the form |
|---|---|---|
| `age` | Integer, 18–100 | Age in years. |
| `sex` | `"m"` or `"f"` | Sex selection used by the current rules. |
| `h` | Number, 120–230 | Height in centimetres. |
| `w` | Number, 30–250 | Weight in kilograms. |
| `waist` | Number, 50–200 | Waist circumference in centimetres. |
| `sys` | Optional number, 80–240 | Systolic blood pressure in mmHg. |
| `act` | `0` or `1` | `1` means under 150 minutes of activity per week. |
| `veg` | `0` or `1` | `1` means fruit and vegetables are not eaten daily. |
| `smoke` | `0` or `1` | Smoking indicator. |
| `fd` | `0`, `3`, or `5` | Diabetes family-history score selected by the form. |
| `fh` | `0` or `1` | Heart disease in parent or sibling. |
| `gl` | `0` or `1` | Previously told blood sugar was high. |
| `bpm` | `0` or `1` | Taking blood-pressure medicine. |

### `POST /api/assessments`

**Who:** Signed-in user of any role. The assessment is saved under the session user's ID.

**Success:** `201` with the inserted assessment row: `id`, `userId`, `input`, `results`, and `createdAt`. The results object contains `bmi`, `risks`, `seeClinician`, and `tips`.

**Errors:** `400 {"error":"Some answers are missing or out of range","issues":[...]}` for invalid input; `401` if not signed in; `500` for unhandled errors.

```bash
curl -i -b cookies.txt http://localhost:8000/api/assessments \
  -H 'Content-Type: application/json' \
  -d '{"age":58,"sex":"m","h":172,"w":95,"waist":108,"sys":150,"act":1,"veg":1,"smoke":1,"fd":5,"fh":1,"gl":1,"bpm":0}'
```

### `GET /api/assessments`

**Who:** Signed-in user of any role. Returns only that user's assessments, newest first.

**Body:** None.

**Success:** `200` JSON array of assessment rows, including stored `input` and `results`.

**Errors:** `401` if not signed in; `500` for unhandled errors.

```bash
curl -i -b cookies.txt http://localhost:8000/api/assessments
```

### `GET /api/assessments/review`

**Who:** `clinician` or `admin`.

**Body:** None.

**Success:** `200` JSON array of up to 100 recent rows. Each has `id`, `createdAt`, `results`, `patient`, and `email`; the query does not return `input`.

**Errors:** `401` if not signed in; `403 {"error":"Not allowed"}` for a patient; `500` for unhandled errors.

```bash
curl -i -b cookies.txt http://localhost:8000/api/assessments/review
```

## Administration

### `GET /api/admin/users`

**Who:** `admin`.

**Body:** None.

**Success:** `200` JSON array of users with `id`, `name`, `email`, `role`, and `createdAt`. Password hashes are not selected.

**Errors:** `401` if not signed in; `403 {"error":"Not allowed"}` for non-admin; `500` for unhandled errors.

```bash
curl -i -b cookies.txt http://localhost:8000/api/admin/users
```

### `PATCH /api/admin/users/:id/role`

**Who:** `admin`.

**JSON body:** `role` must be one of `"patient"`, `"clinician"`, or `"admin"`.

**Success:** `200 {"id":"<uuid>","role":"clinician"}`.

**Errors:** `400 {"error":"Invalid role"}` for an invalid body; `400 {"error":"You can't change your own role"}` for the current admin's own ID; `401` if not signed in; `403` for non-admin; `404 {"error":"User not found"}` for a valid but unknown ID; `500` for unhandled errors.

```bash
curl -i -b cookies.txt -X PATCH http://localhost:8000/api/admin/users/USER_UUID/role \
  -H 'Content-Type: application/json' \
  -d '{"role":"clinician"}'
```

`USER_UUID` is a placeholder: replace it with the target user's UUID.
