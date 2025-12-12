# Quick Start Guide - Dual Database Setup

## Prerequisites
- Node.js installed
- PostgreSQL database running
- MongoDB Atlas account (free tier works)

## Step-by-Step Setup

### 1. MongoDB Atlas Setup (5 minutes)

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up (free)

2. **Create Cluster**
   - Click "Build a Database"
   - Select FREE "M0" tier
   - Choose a cloud provider & region
   - Click "Create Cluster" (wait 2-5 minutes)

3. **Create Database User**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username: `admin` (or your choice)
   - Generate secure password (save it!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Driver: Node.js, Version: 6.3 or later
   - Copy the connection string:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

### 2. Backend Configuration

1. **Navigate to backend folder**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   # Copy from template
   cp .env.example .env
   ```

4. **Edit .env file**
   Open `.env` and update:
   ```env
   # PostgreSQL (your existing values)
   PGUSER=your_user
   PGHOST=localhost
   PGDATABASE=your_db
   PGPASSWORD=your_password
   PGPORT=5432

   # MongoDB Atlas (paste your connection string)
   MONGO_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   MONGO_DB_NAME=electronics_astra

   # Session secret (any random string)
   SESSION_SECRET=change_this_to_random_string_abc123xyz
   ```

   **Important**: 
   - Replace `<username>` with your MongoDB username
   - Replace `<password>` with your MongoDB password
   - Replace `cluster0.xxxxx` with your actual cluster address

### 3. Start the Server

```bash
npm run dev
```

**Expected Output:**
```
✅ MongoDB Atlas connected successfully
✅ GridFS bucket initialized: library_files
✅ MongoDB indexes created successfully
╔═══════════════════════════════════════╗
║  User Backend Server                  ║
║  Running on PORT: 5001                ║
║  URL: http://localhost:5001           ║
║  PostgreSQL: Connected                ║
║  MongoDB Atlas: Connected (GridFS)    ║
╚═══════════════════════════════════════╝
```

### 4. Test the Library API

1. **Login first** (to get session)
   ```bash
   curl -X POST http://localhost:5001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "your@email.com", "password": "yourpassword"}' \
     -c cookies.txt
   ```

2. **Upload a test file**
   ```bash
   curl -X POST http://localhost:5001/api/student/library/upload \
     -b cookies.txt \
     -F "file=@test.pdf"
   ```

3. **Get all files**
   ```bash
   curl http://localhost:5001/api/student/library \
     -b cookies.txt
   ```

### 5. Frontend Setup

The existing frontend should work without changes. Just ensure:

```bash
cd frontend
npm install
npm run dev
```

Navigate to Library page and test upload/download.

---

## Troubleshooting

### "MongoDB not connected"
- Check `MONGO_URI` in `.env`
- Verify MongoDB username/password in connection string
- Check MongoDB Atlas "Network Access" allows your IP

### "Connection timeout"
- MongoDB Atlas network access not configured
- Go to MongoDB Atlas → Network Access → Add 0.0.0.0/0

### "Authentication failed"
- Wrong username or password in `MONGO_URI`
- Check MongoDB Atlas → Database Access

### "Cannot find module 'mongodb'"
- Run `npm install` in backend folder
- Check `package.json` has `"mongodb": "^6.3.0"`

---

## What Changed?

✅ **Files stored in MongoDB GridFS** (cloud storage)  
✅ **Metadata in MongoDB collections** (not PostgreSQL)  
✅ **PostgreSQL still handles** auth, sessions, friends  
✅ **No breaking changes** to login/profile/friends features

---

## Next Steps

1. ✅ Backend code complete (all files modified)
2. ⏭️ Test backend endpoints with Postman/cURL
3. ⏭️ Frontend Library.jsx already exists (minimal changes needed)
4. ⏭️ Test file upload/download from UI

**Everything is ready to run! Just:**
1. Set up MongoDB Atlas (5 min)
2. Update `.env` file
3. Run `npm install && npm run dev`
