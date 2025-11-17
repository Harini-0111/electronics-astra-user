# 🚀 Quick Start Guide - User Backend

## Step 1: Start the Server

```bash
cd backend
npm run dev
```

You should see:
```
╔═══════════════════════════════════════╗
║  User Backend Server                  ║
║  Running on PORT: 5001                ║
║  URL: http://localhost:5001           ║
╚═══════════════════════════════════════╝

✓ PostgreSQL Database connected
✓ Students table created/verified
```

## Step 2: Test the API

### Option A: Using Postman
1. Create a new request
2. Use the endpoints from README.md
3. Test in this order: Register → Verify OTP → Login

### Option B: Using cURL

**1. Register a new user:**
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

Check your email for the OTP (check spam folder too!)

**2. Verify the OTP:**
```bash
curl -X POST http://localhost:5001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

Replace `123456` with the actual OTP from your email.

**3. Login:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

You'll receive a JWT token to use for authenticated requests.

## Step 3: Frontend Integration

In your React/Vue/Angular frontend:

```javascript
// Registration
const response = await fetch('http://localhost:5001/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePassword123'
  })
});

// Verify OTP
const otpResponse = await fetch('http://localhost:5001/api/auth/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    otp: userOtpInput
  })
});

// Login
const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePassword123'
  })
});

const data = await loginResponse.json();
localStorage.setItem('token', data.data.token); // Store JWT token
```

## Troubleshooting

### ❌ "Cannot connect to PostgreSQL"
- Make sure PostgreSQL is running
- Check credentials in `.env`
- Verify database `electronics-astra` exists

### ❌ "OTP email not received"
- Check spam/junk folder
- Verify Gmail App Password is correct
- Ensure Email Service in controller is working

### ❌ "Invalid or expired OTP"
- OTP is only valid for 10 minutes
- Use "Resend OTP" to get a new one
- Check that you're using the correct OTP

### ❌ "Email already registered"
- User already exists in database
- Try with a different email

## Database Check

To manually check the students table:

```bash
psql -U postgres -d electronics-astra

# Inside psql:
SELECT * FROM students;
SELECT * FROM students WHERE email = 'your-email@example.com';
```

## Project Structure

```
backend/
├── config/db.js                 ← PostgreSQL connection
├── controllers/authController.js ← Business logic
├── models/Student.js            ← Database queries
├── routes/auth.js               ← API endpoints
├── utils/otpUtils.js            ← OTP generation
├── server.js                    ← Main app
├── .env                         ← Configuration
└── package.json                 ← Dependencies
```

## Environment Variables Checklist

- ✅ PG_HOST = localhost
- ✅ PG_PORT = 5432
- ✅ PG_DATABASE = electronics-astra
- ✅ PG_USER = postgres
- ✅ PG_PASSWORD = root
- ✅ PORT = 5001
- ✅ JWT_SECRET = your-secret-key
- ✅ EMAIL_USER = your-email@gmail.com
- ✅ EMAIL_PASS = your-app-password

## Next: Create Frontend

Once backend is working, create a React frontend with:
1. Registration form → calls `/api/auth/register`
2. OTP verification page → calls `/api/auth/verify-otp`
3. Login page → calls `/api/auth/login`
4. Dashboard → uses JWT token from login response

---

**Need Help?** Check README.md for detailed API documentation.
