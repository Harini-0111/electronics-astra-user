# 🧪 Testing Guide - User Registration System

## Prerequisites

- Node.js and npm installed
- PostgreSQL running with `electronics-astra` database
- Backend server running on `http://localhost:5001`
- Postman, Insomnia, or cURL for API testing
- Valid Gmail account with App Password configured

---

## 1. Setup for Testing

### Start the Backend Server

```bash
cd backend
npm run dev
```

Expected output:
```
╔═══════════════════════════════════════╗
║  User Backend Server                  ║
║  Running on PORT: 5001                ║
║  URL: http://localhost:5001           ║
╚═══════════════════════════════════════╝

✓ PostgreSQL Database connected
✓ Students table created/verified
```

### Verify Health Check

```bash
curl http://localhost:5001/api/health
```

Response:
```json
{
  "success": true,
  "message": "User Backend Server is running",
  "timestamp": "2025-11-15T10:30:00.000Z"
}
```

---

## 2. Complete Registration Flow Test

### Step 1: Register a New User

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test.user@example.com",
    "password": "TestPassword123!"
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful! Check your email for OTP.",
  "data": {
    "id": 1,
    "name": "Test User",
    "email": "test.user@example.com",
    "isVerified": false
  }
}
```

**Check Email:** Look for OTP in your email inbox or spam folder
**OTP Format:** 6-digit number like `123456`
**Validity:** 10 minutes from registration

---

### Step 2: Verify OTP

```bash
curl -X POST http://localhost:5001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@example.com",
    "otp": "123456"
  }'
```

Replace `123456` with the actual OTP from your email.

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully! You can now login.",
  "data": {
    "id": 1,
    "name": "Test User",
    "email": "test.user@example.com",
    "isVerified": true
  }
}
```

**✅ Email is now verified in the database**

---

### Step 3: Login with Verified Email

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@example.com",
    "password": "TestPassword123!"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful!",
  "data": {
    "id": 1,
    "name": "Test User",
    "email": "test.user@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0LnVzZXJAZXhhbXBsZS5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWF0IjoxNzMxNjc0NDAwLCJleHAiOjE3MzIyNzk0MDB9.xxxxxx"
  }
}
```

**✅ JWT Token received - User is logged in!**

---

## 3. Test Error Cases

### Test Case 1: Missing Required Fields

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Please provide name, email, and password"
}
```

---

### Test Case 2: Email Already Registered

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another User",
    "email": "test.user@example.com",
    "password": "AnotherPassword123!"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

### Test Case 3: Invalid OTP

```bash
curl -X POST http://localhost:5001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@example.com",
    "otp": "000000"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

---

### Test Case 4: Expired OTP

Wait 10+ minutes, then try:

```bash
curl -X POST http://localhost:5001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@example.com",
    "otp": "123456"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

---

### Test Case 5: Login Without Email Verification

Create a new user but DON'T verify their email, then try to login:

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "unverified@example.com",
    "password": "Password123"
  }'
```

**Expected Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Please verify your email first"
}
```

---

### Test Case 6: Wrong Password

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@example.com",
    "password": "WrongPassword123"
  }'
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### Test Case 7: Non-existent User Login

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "Password123"
  }'
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## 4. Test Resend OTP

### Create a new unverified user first:

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Resend Test User",
    "email": "resend.test@example.com",
    "password": "TestPassword123!"
  }'
```

### Request new OTP:

```bash
curl -X POST http://localhost:5001/api/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "resend.test@example.com"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP resent successfully! Check your email."
}
```

**Check Email:** You'll receive a new OTP

### Verify with new OTP:

```bash
curl -X POST http://localhost:5001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "resend.test@example.com",
    "otp": "new-otp-from-email"
  }'
```

---

### Test Case: Already Verified User

Try to resend OTP for an already verified user:

```bash
curl -X POST http://localhost:5001/api/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@example.com"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Email already verified"
}
```

---

## 5. Database Verification

### Connect to PostgreSQL

```bash
psql -U postgres -d electronics-astra
```

### Check all registered users

```sql
SELECT id, name, email, is_verified, created_at FROM students;
```

### Check specific user details

```sql
SELECT * FROM students WHERE email = 'test.user@example.com';
```

### View password (hashed)

```sql
SELECT email, password FROM students WHERE email = 'test.user@example.com';
```

### Count total users

```sql
SELECT COUNT(*) FROM students;
```

### Exit PostgreSQL

```sql
\q
```

---

## 6. Using Postman

### Import Collection

Create these requests in Postman:

#### Request 1: Register
- Method: `POST`
- URL: `http://localhost:5001/api/auth/register`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "name": "{{user_name}}",
  "email": "{{user_email}}",
  "password": "{{user_password}}"
}
```

#### Request 2: Verify OTP
- Method: `POST`
- URL: `http://localhost:5001/api/auth/verify-otp`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "email": "{{user_email}}",
  "otp": "{{otp_from_email}}"
}
```

#### Request 3: Resend OTP
- Method: `POST`
- URL: `http://localhost:5001/api/auth/resend-otp`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "email": "{{user_email}}"
}
```

#### Request 4: Login
- Method: `POST`
- URL: `http://localhost:5001/api/auth/login`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "email": "{{user_email}}",
  "password": "{{user_password}}"
}
```

#### Request 5: Health Check
- Method: `GET`
- URL: `http://localhost:5001/api/health`

---

## 7. Performance Testing

### Test with Multiple Registrations

```bash
# Register 5 different users
for i in {1..5}; do
  curl -X POST http://localhost:5001/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"User $i\",
      \"email\": \"user$i@example.com\",
      \"password\": \"Password$i\"
    }"
  echo "Registered User $i"
done
```

### Check Server Logs

Monitor the terminal running `npm run dev` for:
- Request logs
- Database operations
- Email sending
- Any errors

---

## 8. Security Testing

### Test 1: SQL Injection

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@test.com\"; DROP TABLE students; --",
    "password": "test"
  }'
```

**Expected:** Should fail gracefully (no table dropped)

### Test 2: Password not returned in login

After login, verify that the response doesn't include the password hash.

### Test 3: OTP not returned in registration

After registration, verify that OTP is not sent in the response.

---

## 9. Troubleshooting Checklist

- [ ] PostgreSQL is running
- [ ] `electronics-astra` database exists
- [ ] Node dependencies installed (`npm install`)
- [ ] `.env` file has correct credentials
- [ ] Backend server is running (`npm run dev`)
- [ ] Email service is configured (Gmail App Password)
- [ ] Port 5001 is available
- [ ] No CORS errors (check browser console)
- [ ] Check email spam folder for OTP

---

## 10. Testing Checklist

- [ ] Health check endpoint works
- [ ] Registration with valid data succeeds
- [ ] Duplicate email registration fails
- [ ] Missing fields validation works
- [ ] OTP email is received
- [ ] OTP verification with correct code works
- [ ] OTP verification with wrong code fails
- [ ] OTP expires after 10 minutes
- [ ] Resend OTP works for unverified users
- [ ] Resend OTP fails for verified users
- [ ] Login fails without email verification
- [ ] Login succeeds after verification
- [ ] Wrong password login fails
- [ ] JWT token is returned on successful login
- [ ] Database records are created correctly
- [ ] Passwords are hashed in database

---

## 11. Test Data

Use these credentials for consistent testing:

```
User 1:
- Name: John Doe
- Email: john.doe@test.com
- Password: TestPassword123!

User 2:
- Name: Jane Smith
- Email: jane.smith@test.com
- Password: JanePass456!

User 3:
- Name: Bob Wilson
- Email: bob.wilson@test.com
- Password: BobPassword789!
```

---

## 12. Load Testing (Optional)

Using Apache Bench or similar:

```bash
# Test 100 requests with 10 concurrent
ab -n 100 -c 10 http://localhost:5001/api/health
```

---

**Testing Status:** ✅ Ready
**Last Updated:** November 15, 2025
**Test Environment:** Local Development
