# BERB backend & admin dashboard (Next.js 15 · MongoDB · Zod)

Backend for the separate BERB React site (public REST API) plus a protected admin dashboard (requests, team, services, schedule, notifications).
**Status: written without network access, so `npm install`, type-check, lint, build and the MongoDB/e2e flows have NOT been run.** See "Verification status".

## Architecture
`Route Handler / Server Action → Zod → requireAdmin() → services/* → Mongoose models → typed response`
- `src/lib/scheduling/engine.ts` – pure availability engine (no framework imports, unit-tested). `status.ts` – status machine.
- `src/services/` – `request`, `assignment` (assign/reschedule/cancel/reject/progress), `scheduling` (lock + queries), `availability`, `team`, `catalog`, `notification` (outbox + email).
- `src/models/index.ts` – Service, TeamMember, ServiceRequest, AdminUser, Notification, ScheduleLock, RateLimit (all indexed).
- `src/schemas/index.ts` – every Zod schema (shared by forms and API). Public schema strips unknown keys; admin schemas are `.strict()`.
- `src/app/api/**` – REST (`/api/v1`). `src/app/admin/**` – dashboard (Server Components + Server Actions, no client JS needed).
- Models are used directly by services (no separate repository layer – deliberate, to keep the code small).

### Design
Dashboard reuses the website's `tokens.css` (copied verbatim: `#161723`, `#c6c6c7`, STIX Two Text headings 600, Ubuntu body, 4px radius) plus plain CSS (`globals.css`). I inspected only the supplied React project (the live site was not reachable); Tailwind/shadcn/React Hook Form were **not** used (plain CSS + server-rendered forms) to avoid dependencies I couldn't install.

## Setup
```bash
cp .env.example .env        # fill in values
npm install
npm run seed:services        # Sanitary / Heating / Solar as DB rows (editable in the dashboard)
ADMIN_NAME="You" ADMIN_EMAIL=you@berb.de ADMIN_PASSWORD='min-12-chars...' npm run admin:create
npm run dev                  # http://localhost:3000/admin-login
npm test                     # unit tests
```
**Initial admin:** CLI only, no HTTP registration. Refuses when an admin exists (`--force` to add another). In production it also needs `ALLOW_ADMIN_SEED=true`; unset it afterwards.

### Environment (validated by Zod in `src/lib/env.ts`, fails fast with a readable message)
`MONGODB_URI`, `MONGODB_DB_NAME`, `APP_URL`, `AUTH_SECRET` (≥32), `ALLOWED_ORIGINS` (CSV), `BUSINESS_TIME_ZONE`, `RESEND_API_KEY` (required in prod), `EMAIL_FROM`, `CRON_SECRET` (≥16). No secret uses `NEXT_PUBLIC_`.

### MongoDB
Atlas (any tier) works. **No multi-document transactions are required**: each assignment is one atomic single-document write guarded by the per-member lock. A replica set (Atlas default) is still recommended. `autoIndex` is on in development; in production run once `node -e` / a deploy step that calls `Model.syncIndexes()` (or let the first deployment build them – the lock/rate-limit TTL indexes matter).

## Scheduling rules
- Instants are UTC. Working hours/breaks are wall-clock `HH:mm` in the **member's IANA time zone** (default `Europe/Berlin`). Customer preferred times without an offset are read in `BUSINESS_TIME_ZONE`; date-only → 09:00.
- A job blocks `[start, end + buffer)`; **buffer applies after the job** (service `bufferMinutes`). Conflict ⇔ `a.start < b.blockedEnd && a.blockedEnd > b.start`. The job itself must sit inside one working interval and not touch a break; no spanning midnight.
- Time off / blocked periods block the whole `[start, end+buffer)` window. Only `assigned` and `in_progress` requests block time. `pending`, quote-only, `rejected`, `cancelled`, `completed` never do. Availability is always computed – there is no `isAvailable` flag.
- DST gap times resolve to the instant just after the gap (known edge case).

### Concurrency
`ScheduleLock` has `_id = teamMemberId`; creating it is atomic (unique `_id`) across all instances. Expired locks (15 s) are taken over with a conditional `findOneAndUpdate`; a TTL index removes abandoned docs. Under the lock the server re-reads the member, re-queries blocking jobs, re-runs `checkSlot`, renews the lock (aborting if lost), then performs a conditional `findOneAndUpdate` (status/assignment unchanged). Conflict → `409`. Not an in-memory lock.

### Status machine
`pending → assigned | rejected | cancelled` · `assigned → in_progress | cancelled` (reschedule keeps `assigned`) · `in_progress → completed | cancelled` · `completed/rejected/cancelled` terminal. No `confirmed` status exists (no confirmation step implemented).
Deactivating a member with future jobs is refused (`409` + list). Schedule/time-off/qualification changes that invalidate future jobs are refused unless `acknowledgeConflicts: true`; affected jobs are **not** auto-moved.

## Notifications (outbox)
Assignment/reschedule/cancel write a `Notification` (unique `dedupeKey` → no duplicates) **after** the job is saved; email failure never rolls back the job. A worker claims due notifications atomically (stale `processing` claims are recovered), sends via Resend (`Idempotency-Key` header), retries with exponential backoff (2,4,8… min, cap 6 h, max 6 attempts → `failed`). Admin "Retry" resets the same record.
Processing triggers: **`GET/POST /api/cron/notifications`** with `Authorization: Bearer $CRON_SECRET` (`vercel.json` schedules it every minute – Vercel Hobby only allows daily, use an external pinger/GitHub Action or `npm run notifications:process` from a system cron), plus a manual retry button. In development without `RESEND_API_KEY` emails are printed to the console. Resend delivery webhooks are **not** implemented.

## Security summary
bcrypt (cost 12) passwords; signed JWT (HS256, 8 h) in an HTTP-only, `SameSite=Strict`, `Secure`-in-prod cookie; every page/route/action calls `requireAdmin()` (also re-checks the admin is still active in the DB); `Origin` check on mutating admin routes; Mongo-backed rate limiting (login: 8/15 min per email, 20 per IP; public submit: 5/h per IP); 20 KB body limit; honeypot field `website`; 10-minute duplicate suppression; regex escaping + Zod enums/ObjectId validation (operator objects rejected); security headers. **Not implemented:** CAPTCHA, 2FA, password reset, admin-user management UI, audit log beyond `assignmentHistory`, middleware (deliberately – checks live in the server code).

## CORS / deployment
Public endpoints only (`/api/v1/services`, `/api/v1/service-requests`) answer CORS for origins in `ALLOWED_ORIGINS` (no credentials). Admin routes are same-origin only (cookies are `SameSite=Strict`); host the dashboard on its own origin and never call admin APIs from the React site. Set the React app's `VITE_API_BASE_URL` to this app's URL.

## API
Errors: `{ "message": "...", "code": "validation_error|unauthenticated|forbidden|not_found|conflict|unprocessable|rate_limited|internal_error", "errors": { "field": ["msg"] }, "details": {...} }` with 400/401/403/404/409/422/429/500.

### Public
`GET /api/v1/services` → `200 [ { "id","slug","name","description","category","defaultDurationMinutes","startingPrice?" } ]` (active only; bare array to match the existing `fetchServices()`).

`POST /api/v1/service-requests` (JSON)
```json
{ "customerName":"Jane Doe","email":"jane@x.com","phone":"0221 123","service":"Heating","address":"Berbstr. 1, Cologne",
  "preferredDate":"2026-10-20T10:00","jobDescription":"Boiler leaks","source":"service_page" }
```
`service` accepts slug, name or id. `address` may be a string or `{line1,city,postalCode,country,coordinates}`. `preferredDate` optional (omit ⇒ quote request). → `201 {"id":"BERB-7K2…","reference":"BERB-7K2…","status":"pending"}` (`200` for a duplicate within 10 min). Errors: `400` validation, `422` unknown/inactive service or past date, `429` rate limit.
No public team, availability or retrieval endpoints exist.

### Admin (cookie session; `POST /api/auth/login {email,password}`, `POST /api/auth/logout`)
| Method & path | Purpose |
|---|---|
| `GET /api/v1/admin/requests?page&pageSize&status&serviceId&from&to&q&sort` | list (`{items,total,page,pageSize,pages}`) |
| `GET /api/v1/admin/requests/:id` · `PATCH` `{adminNotes}` | detail · internal notes |
| `POST …/:id/assign` `{teamMemberId,start,durationMinutes?,note?}` | assign (pending only) → `200` request · `409` `{details:{reasons:[{code,message}]}}` |
| `POST …/:id/reschedule` same body | reschedule/reassign (assigned only) |
| `POST …/:id/cancel` `{reason?}` · `…/reject` `{reason}` · `…/status` `{status:"in_progress"|"completed"}` | transitions (`422` if invalid) |
| `GET /api/v1/admin/availability?requestId&date=YYYY-MM-DD[&teamMemberId&start&durationMinutes]` | per qualified member: hours, breaks, time off, jobs, proposed-slot verdict, suggested slots (advisory only) |
| `GET/POST /api/v1/admin/team` · `GET/PATCH /api/v1/admin/team/:id` | team CRUD (PATCH accepts `acknowledgeConflicts`) |
| `GET/POST /api/v1/admin/services` · `PATCH /api/v1/admin/services/:id` | services |
| `GET /api/v1/admin/notifications?status&page` · `POST …/:id/retry` | notifications |

Conflict example: `409 {"message":"The selected time is not available","code":"conflict","details":{"reasons":[{"code":"conflict","message":"Overlaps another assigned job (including its buffer)"}]}}`. Unauthenticated: `401 {"message":"Authentication required","code":"unauthenticated"}`.

## Verification status (honest)
- ✅ Run: scheduling-engine + status-transition unit tests (13 passing, executed with `tsx` + a node:test shim because Vitest couldn't be installed offline).
- ⚠ Written but **not executed**: `tests/schemas.test.ts` (needs `zod`), everything importing Next/Mongoose/jose/bcryptjs, `tsc`, `eslint`, `next build`. Expect to fix small type errors on first `npm run typecheck` (Next 15 route-context typing, Mongoose lean types).
- ❌ Not written: integration tests against MongoDB (concurrent-assign test, assignment/cancellation DB flows, email-failure/retry), API auth tests, end-to-end tests. These are the highest-priority follow-ups (use `mongodb-memory-server` replica set).
- Dashboard limitations: day/week schedule is a list view (no drag-and-drop), team form edits one working interval + one break per day (API supports more), no admin-user management UI.
