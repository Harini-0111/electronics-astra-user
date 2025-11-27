Change Password Feature - Testing Guide

This guide exercises the change password endpoint using server-side sessions.

Prerequisites
- Backend server running on port 5001 with PostgreSQL connected.
- A verified student account registered and ready (or create one via `/api/auth/register` + `/api/auth/verify-otp`).

Testing Steps in Postman

Step 1: Login (create session)
- Method: POST
- URL: http://localhost:5001/api/auth/login
- Body (raw JSON):
  {
    "email": "student@example.com",
    "password": "OldPassword123"
  }
- Expected: 200 success, and Postman receives `connect.sid` cookie.
- Action: Keep the cookie for the next request.

Step 2: Change Password
- Method: PUT
- URL: http://localhost:5001/change-password
- Body (raw JSON):
  {
    "currentPassword": "OldPassword123",
    "newPassword": "NewPassword456"
  }
- Expected: 200 success with message "Password updated successfully".

Step 3: Verify Session Still Active
- Method: GET
- URL: http://localhost:5001/session-status
- Expected: 200 with `loggedIn: true` (session is still active after password change).

Step 4: Logout
- Method: POST
- URL: http://localhost:5001/logout
- Expected: 200 success, session destroyed.

Step 5: Login with New Password (confirm new password works)
- Method: POST
- URL: http://localhost:5001/api/auth/login
- Body (raw JSON):
  {
    "email": "student@example.com",
    "password": "NewPassword456"
  }
- Expected: 200 success with a new `connect.sid` cookie.

Step 6: Try Old Password (confirm old password fails)
- Method: POST
- URL: http://localhost:5001/api/auth/login
- Body (raw JSON):
  {
    "email": "student@example.com",
    "password": "OldPassword123"
  }
- Expected: 401 "Invalid email or password" (old password rejected).

Edge Cases to Test

1. Change Password Without Login
   - Don't send the cookie (or clear it).
   - PUT http://localhost:5001/change-password
   - Expected: 401 "Please login first".

2. Empty Password Fields
   - PUT http://localhost:5001/change-password
   - Body: { "currentPassword": "", "newPassword": "NewPass" }
   - Expected: 400 "Please provide both current password and new password".

3. Wrong Current Password
   - PUT http://localhost:5001/change-password
   - Body: { "currentPassword": "WrongPass", "newPassword": "NewPass456" }
   - Expected: 401 "Current password is wrong".

4. Same Password (new = old)
   - PUT http://localhost:5001/change-password
   - Body: { "currentPassword": "OldPassword123", "newPassword": "OldPassword123" }
   - Expected: 400 "New password must be different from current password".

Troubleshooting

- If `/change-password` returns 404:
  - Ensure the server has reloaded and the new route is mounted.
  - Run `npm run dev` from the `backend` folder.

- If change password succeeds but login fails with new password:
  - Check server logs for bcrypt hashing errors.
  - Verify the password hash was updated in the database using `node scripts/comparePassword.js`.

- If session is lost after password change:
  - The endpoint should NOT destroy the session; it only updates the password.
  - Check that the cookie is being sent in subsequent requests.

Success Criteria
- After changing password, the student can log in with the new password.
- After changing password, the student cannot log in with the old password.
- Session remains active after password change (if desired).
- All error cases return proper status codes and messages.
