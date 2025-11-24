User Backend - Postman Testing Guide

This guide exercises the full auth + profile flows using server-side sessions.

Prerequisites
- Start the backend server from `backend` folder:

```powershell
cd C:\Users\harini\electronics-astra-user\backend
npm install
npm run dev
```

- Ensure `.env` contains correct Postgres and email creds for OTP sending (if you plan to test email flow).

Notes about sessions
- The backend uses `express-session` and sends a cookie named `connect.sid` on successful login.
- In Postman: keep cookies enabled and use the same tab/session for the sequence so cookies persist.

1) Register new user
- POST `http://localhost:5001/api/auth/register`
- Body (raw JSON):
  {
    "name": "Test User",
    "email": "you+test@example.com",
    "password": "TestPass123",
    "phone": "9876543210",
    "address": "123 Example St",
    "date_of_birth": "1990-01-01"  // ISO date (YYYY-MM-DD)
  }
- Expected: 201 success with message "Registration successful! Check your email for OTP."; server log will show `✓ OTP sent to ...` if email is configured.

2) Verify OTP (one of these methods)
- Preferred (email): check your email for OTP and POST to `/api/auth/verify-otp`:
  POST `http://localhost:5001/api/auth/verify-otp`
  Body: { "email": "you+test@example.com", "otp": "123456" }

- Dev shortcut (DB read) (only with permission): run `node scripts/checkStudents.js` and read the `otp` field to verify.

3) Login (creates server-side session)
- POST `http://localhost:5001/api/auth/login`
- Body: { "email": "you+test@example.com", "password": "TestPass123" }
- Expected: 200 success, and Postman should receive a `connect.sid` cookie. Keep it.

4) Get Profile
- GET `http://localhost:5001/profile`
- No body. Must be called with the cookie received from login.
- Expected: 200 success and JSON `data` with: id, name, email, phone, address, date_of_birth, is_verified, timestamps.

5) Update Profile
- PUT `http://localhost:5001/profile`
- Body (raw JSON) (provide only fields to update):
  { "name": "Updated Name", "phone": "9876543210", "address": "123 Street" }
- Expected: 200 success and `data` containing updated fields.

6) Logout
- POST `http://localhost:5001/logout`
- Must be called with the same cookie. Expected: 200 success, and cookie cleared.

7) Check session behavior after logout
- GET `http://localhost:5001/session-status`
- Should return `loggedIn: false`.

8) Delete Account (optional)
- DELETE `http://localhost:5001/profile`
- Must be called while logged in. It will remove the DB record and destroy the session.
- Expected: 200 success with message that account deleted and session destroyed.

Debugging tips
- If `GET /profile` returns `Please login first` after login:
  - Ensure the `connect.sid` cookie is present and being sent. In Postman, click the "Cookies" button and inspect the cookie jar for `localhost`.
  - Use the same Postman tab to preserve cookies.
- If OTP email doesn't arrive:
  - Use `node scripts/checkStudents.js` to view OTP (development only).
  - Or call `POST /api/auth/resend-otp` with the email.
- If the server is not reachable:
  - Run `Test-NetConnection -ComputerName localhost -Port 5001` (PowerShell) to see if port is listening.
  - Keep the server terminal open (`npm run dev`) to inspect runtime logs.

Contact
- If you want me to run these tests here I can, but I need either the plaintext password you want to use for the test user or explicit permission to read OTP values from the DB for verification.
