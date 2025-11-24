# Electronics Astra — User Backend (Student Auth)

This repository contains the user backend for Electronics Astra. It implements a student-focused, PostgreSQL-backed registration and authentication system with OTP-based email verification and server-side sessions.

What this project contains (current state)
- Student-only authentication and profile storage in PostgreSQL (`students` table)
- Endpoints: registration (with profile fields), OTP verify, resend OTP, login (server session), session status, logout, profile CRUD (GET/PUT/DELETE)
- OTP generation and expiry (6 digits, 10 minutes)
- Password hashing with `bcryptjs`
- Email sending via `nodemailer` (non-fatal in dev; OTP persisted in DB)
- Dev helper scripts: `backend/scripts/checkStudents.js`, `show-env.js`, `test-db-connection.js`
- Server resilience improvements for DB connectivity

Prerequisites
- Node.js (14+ recommended)
- PostgreSQL (running locally or accessible remotely)
- Git

Quick clone, install and run
1. Clone the repository and checkout the branch used for development (we use `primary`):

```powershell
git clone https://github.com/Harini-0111/electronics-astra-user.git
cd electronics-astra-user
git checkout primary
```

2. Open the project in VS Code:

```powershell
code .
```

3. Install dependencies for the backend and start the server (from VS Code terminal):

```powershell
cd backend; npm install; npm run dev
```

Environment variables
- Create a `backend/.env` file (this repository ignores `.env`) with the values below:

```
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=electronics-astra
PG_USER=postgres
PG_PASSWORD=<your-db-password>
PORT=5001
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=<your-gmail-app-password>
```

Notes:
- If SMTP/email is not configured, registration will still succeed because OTPs are stored in the DB. Use `backend/scripts/checkStudents.js` to read OTPs during development.

How to run & test in VS Code
- Use the integrated terminal (PowerShell) and run `cd backend; npm run dev`.
- Server logs print DB connection status and OTP/email send attempts.
- Use the Run panel if you add a `launch.json` configuration to start the server in debug mode.

Postman / cURL testing (examples)
1) Register (includes optional profile fields)

POST http://localhost:5001/api/auth/register
Headers: Content-Type: application/json

Body (JSON):
{
  "name": "Test Student",
  "email": "student@example.com",
  "password": "TestPass123!",
  "phone": "9999999999",
  "address": "123 Main St",
  "date_of_birth": "1990-01-01"
}

Expected: 201 created, student row inserted and an OTP saved in DB.

2) Verify OTP

POST http://localhost:5001/api/auth/verify-otp
Headers: Content-Type: application/json

Body:
{
  "email": "student@example.com",
  "otp": "<6-digit-otp>"
}

3) Login (creates a server-side session)

POST http://localhost:5001/api/auth/login
Headers: Content-Type: application/json

Body:
{
  "email": "student@example.com",
  "password": "TestPass123!"
}

Important: The server creates a `connect.sid` cookie. In Postman enable "Follow redirects" and make sure "Automatically follow cookies" is on (cookie jar enabled). For `curl`, use the `-c` / `-b` options to save and send cookies across requests.

Example `curl` preserving cookies:

```powershell
curl -c cookiejar.txt -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"student@example.com","password":"TestPass123!"}'
curl -b cookiejar.txt -X GET http://localhost:5001/api/profile
```

If email delivery isn't working
- Use `backend/scripts/checkStudents.js` to print recent `students` rows and OTP values for development.
- Or query the DB directly using `psql`:

```powershell
psql -U postgres -d electronics-astra
SELECT id, email, otp, otp_expiry, is_verified FROM students ORDER BY created_at DESC LIMIT 10;
```

Helpful dev scripts
- `node backend/scripts/show-env.js` — prints loaded env vars (debugging)
- `node backend/scripts/test-db-connection.js` — attempts a DB connection and reports status
- `node backend/scripts/checkStudents.js` — prints recent student rows and OTPs (dev-only)

API summary (most-used endpoints)
- POST `/api/auth/register` — register student (accepts profile fields)
- POST `/api/auth/verify-otp` — verify OTP
- POST `/api/auth/resend-otp` — resend OTP
- POST `/api/auth/login` — login (creates server session)
- GET `/api/session-status` — check session
- POST `/api/logout` — logout
- GET `/api/profile` — get logged-in student's profile
- PUT `/api/profile` — update profile
- DELETE `/api/profile` — delete account

Testing checklist
- [ ] PostgreSQL is running and `backend/.env` credentials are correct
- [ ] `npm install` completed successfully inside `backend`
- [ ] `npm run dev` starts the server without fatal errors
- [ ] Registration → Verify OTP → Login flows complete in Postman

What we've built so far
- A focused, student-only authentication system backed by PostgreSQL. It supports registration (with phone/address/dob), OTP verification, server-side sessions, profile CRUD, and useful developer helpers for testing when email is unavailable.

Where to go next (suggestions)
- Add automated tests (integration tests for auth flows)
- Add rate-limiting on OTP/resend endpoints
- Harden session cookie settings for production
- Add OpenAPI / Postman collection export for easier QA

If you want, I can also:
- Generate a Postman collection JSON for these requests
- Update top-level docs (`ARCHITECTURE.md`, `IMPLEMENTATION_SUMMARY.md`, `TESTING_GUIDE.md`) to match this README

---
**Last updated:** November 24, 2025
