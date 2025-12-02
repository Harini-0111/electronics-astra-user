# Complete Testing Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Configure MongoDB Atlas (5 minutes)

**Option A: Use MongoDB Atlas (Cloud - Recommended)**
1. Go to https://cloud.mongodb.com
2. Create free M0 cluster
3. Create database user (save username/password)
4. Network Access → Add 0.0.0.0/0
5. Get connection string: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/`

**Option B: Use Local MongoDB (Quick Test)**
- If you have MongoDB installed locally, keep current config

### Step 2: Update .env File

Open `backend\.env` and update:

```env
# For MongoDB Atlas (Cloud):
MONGO_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGO_DB_NAME=electronics_astra

# For Local MongoDB (Testing only):
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=electronics_astra

# Add if missing:
SESSION_SECRET=your_random_secret_key_here
```

### Step 3: Start the Server

```powershell
cd backend
npm install
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
║  PostgreSQL: Connected                ║
║  MongoDB Atlas: Connected (GridFS)    ║
╚═══════════════════════════════════════╝
```

---

## 🧪 Testing the API

### Test 1: Health Check (No Auth Required)

```powershell
curl http://localhost:5001/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User Backend Server is running"
}
```

---

### Test 2: Login (Get Session Cookie)

Create a test user first or use existing credentials:

```powershell
curl -X POST http://localhost:5001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}' `
  -c cookies.txt
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": 123,
    "userid": "12345",
    "name": "Test User",
    "email": "test@example.com"
  }
}
```

**Note:** Save the session cookie in `cookies.txt` for subsequent requests.

---

### Test 3: Upload File to GridFS

Create a test file first:
```powershell
echo "Test file content" > test.txt
```

Upload:
```powershell
curl -X POST http://localhost:5001/api/student/library/upload `
  -b cookies.txt `
  -F "file=@test.txt"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully to MongoDB GridFS",
  "data": {
    "_id": "674a1b2c3d4e5f6789",
    "ownerPostgresId": 123,
    "ownerUserid": "12345",
    "gridFsFileId": "674a1b2c3d4e5f6790",
    "filename": "1733149200000-test.txt",
    "originalName": "test.txt",
    "fileType": "text/plain",
    "fileSize": 17,
    "uploadedAt": "2025-12-02T10:00:00.000Z"
  }
}
```

---

### Test 4: Get All Files

```powershell
curl http://localhost:5001/api/student/library -b cookies.txt
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "674a1b2c3d4e5f6789",
      "fileId": "674a1b2c3d4e5f6789",
      "ownerPostgresId": 123,
      "ownerUserid": "12345",
      "owner_name": "Test User",
      "owner_userid": "12345",
      "gridFsFileId": "674a1b2c3d4e5f6790",
      "filename": "1733149200000-test.txt",
      "originalName": "test.txt",
      "fileType": "text/plain",
      "fileSize": 17,
      "uploadedAt": "2025-12-02T10:00:00.000Z"
    }
  ]
}
```

---

### Test 5: Get My Uploads

```powershell
curl http://localhost:5001/api/student/library/my-uploads -b cookies.txt
```

Same response format as "Get All Files" but filtered by current user.

---

### Test 6: Download File

**Get the file ID from previous response, then:**

```powershell
curl "http://localhost:5001/api/student/library/674a1b2c3d4e5f6789/download" `
  -b cookies.txt `
  -o downloaded.txt
```

**Expected:** File downloads successfully as `downloaded.txt`

---

### Test 7: Share File with Friend

```powershell
curl -X POST http://localhost:5001/api/student/library/share `
  -b cookies.txt `
  -H "Content-Type: application/json" `
  -d '{\"fileId\":\"674a1b2c3d4e5f6789\",\"targetUserId\":\"67890\"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "File shared successfully",
  "data": {
    "_id": "674a1b2c999",
    "fileId": "674a1b2c3d4e5f6789",
    "sharedByUserId": "12345",
    "sharedWithUserId": "67890",
    "sharedAt": "2025-12-02T10:05:00.000Z"
  }
}
```

---

### Test 8: Get Shared Files

Login as the friend (userid: 67890) and:

```powershell
curl http://localhost:5001/api/student/library/shared-with-me -b cookies.txt
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "674a1b2c3d4e5f6789",
      "fileId": "674a1b2c3d4e5f6789",
      "ownerPostgresId": 123,
      "owner_name": "Test User",
      "owner_userid": "12345",
      "shared_by_name": "Test User",
      "shared_at": "2025-12-02T10:05:00.000Z",
      "originalName": "test.txt",
      "fileType": "text/plain",
      "fileSize": 17
    }
  ]
}
```

---

## 🔍 Verify in MongoDB Atlas

1. Go to MongoDB Atlas dashboard
2. Click "Browse Collections"
3. Database: `electronics_astra`
4. Check collections:
   - `libraryFiles` - File metadata
   - `fileShares` - Sharing records
   - `library_files.files` - GridFS file metadata
   - `library_files.chunks` - GridFS file chunks

---

## 🐛 Troubleshooting

### Server won't start

**Error: "MongoDB not connected"**
- Check `MONGO_URI` in `.env`
- Verify MongoDB Atlas username/password
- Check network access (0.0.0.0/0)

**Error: "Cannot find module 'mongodb'"**
```powershell
cd backend
npm install
```

**Error: "PostgreSQL connection failed"**
- Check if PostgreSQL is running
- Verify credentials in `.env`

### File upload fails

**Error: "No file uploaded"**
- Check FormData includes `file` field
- Verify file size < 50MB
- Check file type is allowed

**Error: "Session not found"**
- Login first to get session cookie
- Use `-b cookies.txt` in curl commands

### Download fails

**Error: "File not found"**
- Verify file ID is correct (MongoDB ObjectId)
- Check file exists in `libraryFiles` collection

---

## 📊 Testing Checklist

- [ ] Server starts without errors
- [ ] MongoDB connection successful
- [ ] Health endpoint responds
- [ ] Can login and get session cookie
- [ ] Can upload file (stores in GridFS)
- [ ] File appears in GET /library
- [ ] Can download uploaded file
- [ ] Can share file with friend (by userid)
- [ ] Shared file appears in friend's shared-with-me
- [ ] Files visible in MongoDB Atlas dashboard

---

## 🎯 Quick Test Script

Save as `test-api.ps1`:

```powershell
# Quick API Test Script
$baseUrl = "http://localhost:5001"

# 1. Health check
Write-Host "Testing health endpoint..." -ForegroundColor Cyan
curl "$baseUrl/api/health"

# 2. Login (replace with your credentials)
Write-Host "`nLogging in..." -ForegroundColor Cyan
curl -X POST "$baseUrl/api/auth/login" `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}' `
  -c cookies.txt

# 3. Create test file
"Test content" | Out-File -FilePath test.txt

# 4. Upload file
Write-Host "`nUploading file..." -ForegroundColor Cyan
curl -X POST "$baseUrl/api/student/library/upload" `
  -b cookies.txt `
  -F "file=@test.txt"

# 5. Get all files
Write-Host "`nGetting all files..." -ForegroundColor Cyan
curl "$baseUrl/api/student/library" -b cookies.txt

# 6. Get my uploads
Write-Host "`nGetting my uploads..." -ForegroundColor Cyan
curl "$baseUrl/api/student/library/my-uploads" -b cookies.txt

Write-Host "`nTests complete!" -ForegroundColor Green
```

Run with:
```powershell
.\test-api.ps1
```

---

## 📚 Documentation Reference

- **QUICK_START.md** - Fast setup
- **MONGODB_GRIDFS_SETUP.md** - Detailed MongoDB guide
- **BACKEND_CODE_STRUCTURE.md** - Code implementation
- **ARCHITECTURE_DIAGRAMS.md** - Visual architecture
- **CHECKLIST.md** - Full setup checklist

---

## ✅ Success Indicators

You know everything is working when:

1. ✅ Server starts with MongoDB connected message
2. ✅ File uploads return success with GridFS file ID
3. ✅ Files appear in MongoDB Atlas dashboard
4. ✅ Downloads work and return correct file
5. ✅ File sharing creates records in `fileShares`
6. ✅ Shared files visible to recipient
7. ✅ Login/profile/friends still work (PostgreSQL)

**Your system is ready! 🎉**
