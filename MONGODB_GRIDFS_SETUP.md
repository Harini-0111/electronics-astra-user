# Dual-Database Architecture Setup Guide

## Overview
This application uses a **dual-database architecture**:
- **PostgreSQL**: User accounts, sessions, authentication, friend relations
- **MongoDB Atlas + GridFS**: File storage system for library files

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (React)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ├─── Auth/Profile/Friends
                      │    (PostgreSQL Session)
                      │
                      └─── Library Files
                           (MongoDB GridFS)
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                    Express Backend API                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              studentController.js                       │ │
│  │  • All endpoints use PostgreSQL session auth           │ │
│  │  • Library endpoints use MongoDB for files             │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────┬───────────────────────────┬────────────────────┘
             │                           │
             │                           │
    ┌────────▼─────────┐       ┌────────▼──────────┐
    │   PostgreSQL     │       │  MongoDB Atlas     │
    │                  │       │    + GridFS        │
    │  • students      │       │  • libraryFiles    │
    │  • friends       │       │  • fileShares      │
    │  • sessions      │       │  • library_files   │
    │                  │       │    (GridFS bucket) │
    └──────────────────┘       └────────────────────┘
```

---

## 1. MongoDB Atlas Setup

### Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Create a new cluster (Free tier M0 works fine)
4. Wait for cluster creation (2-5 minutes)

### Get Connection String
1. Click **"Connect"** on your cluster
2. Select **"Connect your application"**
3. Choose **Driver**: Node.js, **Version**: 6.3 or later
4. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Configure Database Access
1. Go to **Database Access** → **Add New Database User**
2. Create username and password (remember these!)
3. Set privileges to **Read and write to any database**

### Configure Network Access
1. Go to **Network Access** → **Add IP Address**
2. For development: Click **"Allow Access from Anywhere"** (0.0.0.0/0)
3. For production: Add your server's specific IP

---

## 2. Environment Configuration

Add to `backend/.env`:

```env
# PostgreSQL (existing)
PGUSER=your_pg_user
PGHOST=localhost
PGDATABASE=your_database
PGPASSWORD=your_password
PGPORT=5432

# MongoDB Atlas (NEW)
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGO_DB_NAME=electronics_astra

# Session Secret
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
```

**Important**: Replace `<username>` and `<password>` with your MongoDB Atlas credentials.

---

## 3. Install Dependencies

```bash
cd backend
npm install
```

The updated `package.json` includes:
- `mongodb`: ^6.3.0 (Native MongoDB driver with GridFS support)
- `multer`: ^2.0.2 (File upload handling with memory storage)

---

## 4. Database Schema

### PostgreSQL Tables (No Changes)
```sql
-- Existing tables remain unchanged
students
friends
friend_requests
sessions
```

### MongoDB Collections (Auto-created)

#### Collection: `libraryFiles`
```javascript
{
  _id: ObjectId,
  ownerPostgresId: Number,          // PostgreSQL student.id
  ownerUserid: String,               // PostgreSQL student.userid
  gridFsFileId: String,              // GridFS file ID
  filename: String,                  // Generated unique filename
  originalName: String,              // Original uploaded filename
  fileType: String,                  // MIME type
  fileSize: Number,                  // File size in bytes
  uploadedAt: Date
}
```

#### Collection: `fileShares`
```javascript
{
  _id: ObjectId,
  fileId: String,                    // MongoDB file _id
  sharedByUserId: String,            // PostgreSQL userid (sharer)
  sharedWithUserId: String,          // PostgreSQL userid (recipient)
  sharedAt: Date
}
```

#### GridFS Bucket: `library_files`
- Stores actual file binary data
- Automatically creates `library_files.files` and `library_files.chunks`
- Each file is split into 255KB chunks

---

## 5. API Endpoints

All endpoints require PostgreSQL session authentication (`requireLogin` middleware).

### 1. POST `/api/student/library/upload`
**Upload file to MongoDB GridFS**

Request:
```javascript
// FormData with file
const formData = new FormData();
formData.append('file', fileObject);

fetch('/api/student/library/upload', {
  method: 'POST',
  credentials: 'include',
  body: formData
});
```

Response:
```json
{
  "success": true,
  "message": "File uploaded successfully to MongoDB GridFS",
  "data": {
    "_id": "...",
    "ownerPostgresId": 123,
    "ownerUserid": "12345",
    "gridFsFileId": "...",
    "filename": "1234567890-document.pdf",
    "originalName": "document.pdf",
    "fileType": "application/pdf",
    "fileSize": 1024000,
    "uploadedAt": "2025-12-02T..."
  }
}
```

---

### 2. GET `/api/student/library`
**Get all library files (all users)**

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "fileId": "...",
      "ownerPostgresId": 123,
      "ownerUserid": "12345",
      "owner_name": "John Doe",
      "owner_userid": "12345",
      "filename": "1234567890-document.pdf",
      "originalName": "document.pdf",
      "fileType": "application/pdf",
      "fileSize": 1024000,
      "uploadedAt": "2025-12-02T..."
    }
  ]
}
```

---

### 3. GET `/api/student/library/my-uploads`
**Get files uploaded by logged-in user**

Response: Same format as `/library`, filtered by `ownerPostgresId`

---

### 4. GET `/api/student/library/shared-with-me`
**Get files shared with logged-in user**

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "fileId": "...",
      "ownerPostgresId": 456,
      "owner_name": "Jane Doe",
      "owner_userid": "67890",
      "shared_by_name": "Bob Smith",
      "shared_at": "2025-12-02T...",
      "filename": "...",
      "originalName": "shared-doc.pdf",
      "fileType": "application/pdf",
      "fileSize": 512000
    }
  ]
}
```

---

### 5. POST `/api/student/library/share`
**Share file with friend**

Request:
```json
{
  "fileId": "6747a1b2c3d4e5f6a7b8c9d0",  // MongoDB _id
  "targetUserId": "12345"                 // PostgreSQL userid
}
```

Response:
```json
{
  "success": true,
  "message": "File shared successfully",
  "data": {
    "_id": "...",
    "fileId": "6747a1b2c3d4e5f6a7b8c9d0",
    "sharedByUserId": "67890",
    "sharedWithUserId": "12345",
    "sharedAt": "2025-12-02T..."
  }
}
```

---

### 6. GET `/api/student/library/:fileId/download`
**Download file from GridFS**

Response: Binary stream with headers:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="document.pdf"
```

---

## 6. File Upload Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Client uploads file (FormData)                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Multer (memoryStorage) stores in req.file.buffer         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. studentController.uploadFile extracts:                   │
│    • req.file.buffer                                         │
│    • req.session.user.id (PostgreSQL)                        │
│    • req.session.user.userid (PostgreSQL)                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Student.uploadFile(postgresId, userid, buffer, metadata) │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ├──── 4a. uploadToGridFS(buffer)
                  │      └─→ Returns gridFsFileId
                  │
                  └──── 4b. db.collection('libraryFiles').insertOne(metadata)
                         └─→ Returns MongoDB document _id
```

---

## 7. File Download Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Client requests GET /library/:fileId/download            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Get file metadata from MongoDB                           │
│    • db.collection('libraryFiles').findOne({ _id })          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Get GridFS file stream                                   │
│    • downloadFromGridFS(gridFsFileId)                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Stream to client with headers                            │
│    • Content-Type: fileType                                  │
│    • Content-Disposition: attachment; filename="..."         │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Key Files Created/Modified

### Created Files
1. `backend/config/mongodb.js` - MongoDB connection and GridFS utilities
2. `backend/config/multer.js` - Multer memory storage configuration

### Modified Files
1. `backend/models/Student.js` - Added 6 MongoDB library methods
2. `backend/controllers/studentController.js` - Updated library controllers
3. `backend/routes/studentRoutes.js` - Library routes (already existed)
4. `backend/server.js` - Added MongoDB connection initialization
5. `backend/package.json` - Changed `mongoose` to `mongodb`

---

## 9. Testing the Implementation

### Start Backend Server
```bash
cd backend
npm install        # Install mongodb driver
npm run dev        # Or npm start
```

Expected output:
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

### Test with cURL

1. **Upload File**
```bash
curl -X POST http://localhost:5001/api/student/library/upload \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -F "file=@test.pdf"
```

2. **Get All Files**
```bash
curl http://localhost:5001/api/student/library \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

3. **Download File**
```bash
curl http://localhost:5001/api/student/library/FILE_ID/download \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -o downloaded.pdf
```

---

## 10. Frontend Integration Notes

The frontend `Library.jsx` already exists and needs minimal changes:

### Update API calls to handle new response format
```javascript
// File metadata now uses MongoDB _id
const fileId = file._id || file.fileId;

// Download endpoint remains the same
api.get(`/library/${fileId}/download`)
```

### Upload remains the same
```javascript
const formData = new FormData();
formData.append('file', file);
await api.post('/library/upload', formData);
```

---

## 11. Security Considerations

1. **Session-based Auth**: All endpoints verify PostgreSQL session
2. **File Validation**: Multer filters allowed file types
3. **Size Limits**: 50MB max file size
4. **MongoDB Atlas**: Use IP whitelisting in production
5. **Environment Variables**: Never commit `.env` file

---

## 12. Troubleshooting

### Error: "MongoDB not connected"
- Check `MONGO_URI` in `.env`
- Verify MongoDB Atlas network access (IP whitelist)
- Check username/password in connection string

### Error: "File upload failed"
- Check multer configuration
- Verify `req.file.buffer` exists
- Check file size < 50MB

### Error: "GridFS file not found"
- Verify `gridFsFileId` in MongoDB document
- Check GridFS bucket name: `library_files`
- Use MongoDB Compass to inspect collections

### Session Issues
- PostgreSQL session must be active
- Check `connect.sid` cookie
- Verify CORS credentials: `withCredentials: true`

---

## 13. MongoDB Atlas Monitoring

View uploaded files in MongoDB Compass:
1. Connect to your cluster
2. Navigate to database: `electronics_astra`
3. Collections:
   - `libraryFiles` - File metadata
   - `fileShares` - Share records
   - `library_files.files` - GridFS file metadata
   - `library_files.chunks` - GridFS file chunks

---

## Summary

✅ **PostgreSQL**: Handles all user authentication, sessions, and friend relations  
✅ **MongoDB Atlas + GridFS**: Stores actual files and file metadata  
✅ **Dual Integration**: Uses PostgreSQL `student.id` and `student.userid` to link MongoDB file ownership  
✅ **No Breaking Changes**: Login, profile, friends features remain unchanged  
✅ **GridFS Advantages**: Automatic chunking, scalability, no filesystem management  

This architecture allows PostgreSQL to handle structured relational data while MongoDB Atlas efficiently manages file storage with GridFS.
