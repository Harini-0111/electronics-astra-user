# User Backend Registration System

This is the user-side backend for Electronics Astra with OTP-based email verification registration system.

## Features

✅ User Registration with Email Verification
✅ OTP-based Email Verification (10-minute validity)
✅ Secure Password Hashing (bcryptjs)
✅ JWT Token Authentication
✅ Resend OTP functionality
✅ PostgreSQL Database Integration
✅ Email notifications via Nodemailer

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

The `.env` file is already configured with:
- PostgreSQL connection details
- JWT secret
- MongoDB URI (if needed later)
- Email credentials

**Make sure these values match your actual setup:**
```
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=electronics-astra
PG_USER=postgres
PG_PASSWORD=root
PORT=5001
JWT_SECRET=your-secret-key
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
  "success": false,
  "message": "Please verify your email first"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "message": "Student not found"
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
```

---

## Next Steps

After this registration system is complete, you can:
1. Create user profile endpoints
2. Add product viewing/wishlist features
3. Implement shopping cart
4. Add order management
5. Create payment integration

---

## Support

For issues or questions, check the logs and ensure:
- PostgreSQL is running
- Gmail App Password is correct (if using Gmail)
- Port 5001 is available
- All environment variables are set correctly

---

**Created:** November 15, 2025
**Backend Version:** 1.0.0
