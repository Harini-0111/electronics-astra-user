# Frontend for Electronics Astra

This is a Vite + React frontend that integrates with the existing backend server (session-based auth).

Quick start

1. Install dependencies

```powershell
cd frontend
npm install
```

2. Start dev server

```powershell
npm run dev
```

The dev server runs on `http://localhost:3000` by default. The frontend is configured to connect to the backend at `http://localhost:5001` (see `src/api/axiosInstance.js`).

Notes
- Axios is configured with `withCredentials: true` so session cookies are sent to the backend.
- If your backend is running on a different host/port, update `src/api/axiosInstance.js`.
- Vite proxies some routes to `http://localhost:5001` for convenience (see `vite.config.js`).

Pages implemented
- Register (with OTP verification)
- Login (session-based)
- Dashboard (profile: name, email, userid, phone, address, DOB)
- Update Profile
- Change Password
- Add Friend (placeholder)
- Accept Friend (placeholder)
- Logout
