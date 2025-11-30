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
EMAIL_PASS=your-app-password
```

### 3. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5001`

## Database Schema

### Students Table

```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  otp VARCHAR(6),
  otp_expiry TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### 1. Register User
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Registration successful! Check your email for OTP.",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "isVerified": false
  }
}
```

---

### 2. Verify OTP
**POST** `/api/auth/verify-otp`

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Email verified successfully! You can now login.",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "isVerified": true
  }
}
```

---

### 3. Resend OTP
**POST** `/api/auth/resend-otp`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP resent successfully! Check your email."
}
```

---

### 4. Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful!",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 5. Health Check
**GET** `/api/health`

**Response:**
```json
{
  "success": true,
  "message": "User Backend Server is running",
  "timestamp": "2025-11-15T10:30:00.000Z"
}
```

---

## Error Responses

### 400 - Bad Request
```json
{
  "success": false,
  "message": "Please provide name, email, and password"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### 403 - Forbidden
```json
{
  "email": "student@example.com",
  "otp": "<6-digit-otp>"
}
```

### 500 - Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## User Registration Flow

```
1. User enters name, email, password
   ↓
2. System sends OTP to email
   ↓
3. User receives OTP in email inbox
   ↓
4. User enters OTP to verify email
   ↓
5. Email verified - User redirected to login page
   ↓
6. User logs in with email & password
   ↓
7. JWT token issued for authenticated requests
```

---

## Important Notes

⚠️ **Gmail App Passwords:**
- If using Gmail, you need to generate an "App Password"
- Enable "Less secure app access" OR use App Passwords
- Store the app password in `.env` as `EMAIL_PASS`

⚠️ **OTP Validity:**
- OTP is valid for 10 minutes
- After 10 minutes, user must request a new OTP via "Resend OTP"

⚠️ **Password Requirements:**
- Passwords are hashed using bcryptjs (10 salt rounds)
- Never store plain text passwords

⚠️ **Environment Variables:**
- Keep `.env` file secure
- Don't commit `.env` to version control (already in .gitignore)

---

## File Structure

```
backend/
├── config/
│   └── db.js                 # PostgreSQL connection
├── controllers/
│   └── authController.js     # Registration, OTP, Login logic
├── models/
│   └── Student.js            # Student database operations
├── routes/
│   └── auth.js               # Authentication routes
├── utils/
│   └── otpUtils.js           # OTP generation utilities
├── server.js                 # Main server file
├── package.json              # Dependencies
└── .env                       # Environment variables
```

---

## Testing with Postman/cURL

### Test Registration
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123"
  }'
```

### Test OTP Verification
```bash
curl -X POST http://localhost:5001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "123456"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

---

## Database Connection

The app automatically creates the `students` table on startup if it doesn't exist. PostgreSQL must be running and accessible with the credentials in `.env`.

**To verify PostgreSQL is running:**
```bash
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
