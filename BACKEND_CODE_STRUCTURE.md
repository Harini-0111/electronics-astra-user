# Backend Code Structure - Dual Database Implementation

## File Changes Summary

### 📁 New Files Created

#### 1. `backend/config/mongodb.js`
**Purpose**: MongoDB Atlas connection and GridFS utilities

**Key Functions**:
- `connectMongoDB()` - Connect to MongoDB Atlas
- `getDB()` - Get database instance
- `getGridFSBucket()` - Get GridFS bucket
- `uploadToGridFS(buffer, metadata)` - Upload file to GridFS
- `downloadFromGridFS(fileId)` - Stream file from GridFS
- `deleteFromGridFS(fileId)` - Delete file from GridFS
- `getGridFSFileInfo(fileId)` - Get file metadata

**Collections Created**:
- `libraryFiles` - File metadata storage
- `fileShares` - File sharing records
- `library_files.files` - GridFS metadata
- `library_files.chunks` - GridFS chunks (auto-created)

**Indexes Created**:
```javascript
libraryFiles: ownerPostgresId, ownerUserid, uploadedAt
fileShares: fileId, sharedWithUserId, sharedByUserId
```

---

#### 2. `backend/config/multer.js`
**Purpose**: Multer configuration for memory storage

**Changed From**: `diskStorage` (files saved to `backend/uploads/`)  
**Changed To**: `memoryStorage` (files kept in `req.file.buffer`)

**Why**: GridFS requires file buffer to upload to MongoDB

**File Filter**: PDF, DOCX, XLSX, images, videos, ZIP, TXT  
**Size Limit**: 50MB

---

### 📝 Modified Files

#### 3. `backend/models/Student.js`
**Changes**: Replaced 6 library methods with MongoDB + GridFS versions

**Old Methods (PostgreSQL)**:
```javascript
uploadFile(ownerId, filename, originalName, fileType, filePath)
getAllFiles()
getMyUploads(ownerId)
getFileById(fileId)
shareFile(fileId, sharedByUserId, sharedWithUserId)
getSharedWithMe(userId)
```

**New Methods (MongoDB + GridFS)**:
```javascript
// Upload file to GridFS + save metadata to MongoDB
uploadFile(ownerPostgresId, ownerUserid, fileBuffer, fileMetadata)

// Get all files from MongoDB, enrich with PostgreSQL owner info
getAllFiles()

// Get user's files from MongoDB
getMyUploads(ownerPostgresId)

// Get file by MongoDB _id
getFileById(fileId)

// Share file using PostgreSQL userids
shareFile(fileId, sharedByUserId, sharedWithUserId)

// Get shared files for user
getSharedWithMe(userId)
```

**Key Changes**:
- Uses `getDB()` from `mongodb.js`
- Calls `uploadToGridFS()` for file storage
- Queries MongoDB collections instead of PostgreSQL tables
- Enriches MongoDB data with PostgreSQL user info (name, userid)

---

#### 4. `backend/controllers/studentController.js`
**Changes**: Updated library controllers to use MongoDB + GridFS

**`uploadFile` Controller**:
```javascript
// OLD:
const { filename, originalname, mimetype, path: filePath } = req.file;
await Student.uploadFile(userId, filename, originalname, mimetype, filePath);

// NEW:
const fileBuffer = req.file.buffer;  // From memory storage
const fileMetadata = {
  filename: `${Date.now()}-${req.file.originalname}`,
  originalName: req.file.originalname,
  fileType: req.file.mimetype,
  fileSize: req.file.size
};
await Student.uploadFile(userId, user.userid, fileBuffer, fileMetadata);
```

**`downloadFile` Controller**:
```javascript
// OLD:
const fileStream = fs.createReadStream(file.file_path);
fileStream.pipe(res);

// NEW:
const { downloadFromGridFS } = require('../config/mongodb');
const downloadStream = downloadFromGridFS(file.gridFsFileId);
downloadStream.pipe(res);
```

**`shareFileWithFriend` Controller**:
```javascript
// OLD:
const targetStudent = await Student.findByUserId(parseInt(targetUserId, 10));
await Student.shareFile(fileId, userId, targetStudent.id);

// NEW:
await Student.shareFile(fileId, currentUser.userid, String(targetUserId));
```

**`getSharedWithMe` Controller**:
```javascript
// OLD:
await Student.getSharedWithMe(userId);  // PostgreSQL id

// NEW:
await Student.getSharedWithMe(currentUser.userid);  // PostgreSQL userid
```

---

#### 5. `backend/server.js`
**Changes**: 
1. Import MongoDB connection
2. Initialize MongoDB before starting server

```javascript
// Added import
const { connectMongoDB } = require('./config/mongodb');

// Changed server start
async function startServer() {
  await connectMongoDB();  // Connect MongoDB first
  app.listen(PORT, () => { ... });
}
startServer();
```

**Startup Output**:
```
✅ MongoDB Atlas connected successfully
✅ GridFS bucket initialized: library_files
✅ MongoDB indexes created successfully
╔═══════════════════════════════════════╗
║  PostgreSQL: Connected                ║
║  MongoDB Atlas: Connected (GridFS)    ║
╚═══════════════════════════════════════╝
```

---

#### 6. `backend/package.json`
**Changes**: Replaced mongoose with mongodb native driver

```json
// REMOVED:
"mongoose": "^8.19.4"

// ADDED:
"mongodb": "^6.3.0"
```

**Why**: Native driver provides direct GridFS support without ODM overhead

---

### 📄 Routes (No Changes Required)

#### `backend/routes/studentRoutes.js`
Routes remain the same:
```javascript
router.post('/library/upload', upload.single('file'), studentController.uploadFile);
router.get('/library', studentController.getLibrary);
router.get('/library/my-uploads', studentController.getMyUploads);
router.get('/library/:fileId/download', studentController.downloadFile);
router.post('/library/share', studentController.shareFileWithFriend);
router.get('/library/shared-with-me', studentController.getSharedWithMe);
```

**Only change**: `upload` now uses memory storage instead of disk storage

---

## Data Flow

### Upload Flow
```
Client (React)
  └─> POST /library/upload (FormData with file)
      └─> Multer memoryStorage → req.file.buffer
          └─> studentController.uploadFile
              └─> Student.uploadFile(postgresId, userid, buffer, metadata)
                  ├─> uploadToGridFS(buffer) → gridFsFileId
                  └─> db.collection('libraryFiles').insertOne(metadata)
```

### Download Flow
```
Client (React)
  └─> GET /library/:fileId/download
      └─> studentController.downloadFile
          └─> Student.getFileById(fileId) → Get metadata from MongoDB
              └─> downloadFromGridFS(gridFsFileId) → Stream from GridFS
                  └─> Pipe to response
```

### Share Flow
```
Client (React)
  └─> POST /library/share { fileId, targetUserId }
      └─> studentController.shareFileWithFriend
          └─> Student.shareFile(fileId, sharerUserid, targetUserid)
              ├─> Verify file exists in MongoDB
              ├─> Verify target user exists in PostgreSQL
              └─> db.collection('fileShares').insertOne(shareRecord)
```

---

## Database Relationships

### PostgreSQL → MongoDB Link
```javascript
// PostgreSQL student
{
  id: 123,              // Primary key
  userid: "12345",      // Unique 5-digit ID
  name: "John Doe",
  email: "john@example.com"
}

// MongoDB libraryFile (linked by both)
{
  _id: ObjectId("..."),
  ownerPostgresId: 123,      // Links to PostgreSQL student.id
  ownerUserid: "12345",      // Links to PostgreSQL student.userid
  gridFsFileId: "...",
  filename: "...",
  // ...
}

// MongoDB fileShare (uses PostgreSQL userid)
{
  fileId: "...",             // MongoDB file _id
  sharedByUserId: "12345",   // PostgreSQL student.userid
  sharedWithUserId: "67890", // PostgreSQL student.userid
  sharedAt: Date
}
```

### Why Both IDs?
- `ownerPostgresId` (integer): Fast session lookups (req.session.user.id)
- `ownerUserid` (string): User-facing ID for sharing with friends

---

## Collections Schema

### MongoDB Collection: `libraryFiles`
```javascript
{
  _id: ObjectId("674a1b2c3d4e5f6789"),
  ownerPostgresId: 123,
  ownerUserid: "12345",
  gridFsFileId: "674a1b2c3d4e5f6790",
  filename: "1733149200000-document.pdf",
  originalName: "document.pdf",
  fileType: "application/pdf",
  fileSize: 1024000,
  uploadedAt: ISODate("2025-12-02T...")
}
```

### MongoDB Collection: `fileShares`
```javascript
{
  _id: ObjectId("..."),
  fileId: "674a1b2c3d4e5f6789",  // References libraryFiles._id
  sharedByUserId: "12345",        // PostgreSQL userid
  sharedWithUserId: "67890",      // PostgreSQL userid
  sharedAt: ISODate("2025-12-02T...")
}
```

### GridFS Collections (Auto-created)
```javascript
// library_files.files
{
  _id: ObjectId("674a1b2c3d4e5f6790"),
  length: 1024000,
  chunkSize: 261120,
  uploadDate: ISODate("..."),
  filename: "1733149200000-document.pdf",
  metadata: {
    originalName: "document.pdf",
    fileType: "application/pdf",
    ownerPostgresId: 123,
    ownerUserid: "12345"
  }
}

// library_files.chunks
{
  _id: ObjectId("..."),
  files_id: ObjectId("674a1b2c3d4e5f6790"),
  n: 0,  // Chunk number
  data: Binary("...")  // 255KB chunk
}
```

---

## API Response Format Changes

### GET /library (All Files)
```json
{
  "success": true,
  "data": [
    {
      "_id": "674a1b2c3d4e5f6789",      // MongoDB _id (NEW)
      "fileId": "674a1b2c3d4e5f6789",   // Same as _id (NEW)
      "ownerPostgresId": 123,            // NEW
      "ownerUserid": "12345",            // NEW
      "gridFsFileId": "674a1b2c3d4e5f6790", // NEW
      "filename": "1733149200000-document.pdf",
      "originalName": "document.pdf",    // Changed from original_name
      "fileType": "application/pdf",     // Changed from file_type
      "fileSize": 1024000,               // NEW
      "uploadedAt": "2025-12-02T...",    // Changed from uploaded_at
      "owner_name": "John Doe",
      "owner_userid": "12345"
    }
  ]
}
```

### Key Changes from PostgreSQL version:
- `id` → `_id` (MongoDB ObjectId)
- Added `fileId` (string version of _id)
- Added `ownerPostgresId` and `ownerUserid`
- Added `gridFsFileId` (GridFS file reference)
- Added `fileSize`
- `file_path` removed (files in GridFS, not disk)
- Camel case: `originalName`, `fileType`, `uploadedAt`

---

## Environment Variables Required

```env
# PostgreSQL (existing - no changes)
PGUSER=...
PGHOST=localhost
PGDATABASE=...
PGPASSWORD=...
PGPORT=5432

# MongoDB Atlas (NEW - REQUIRED)
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/
MONGO_DB_NAME=electronics_astra

# Session (existing)
SESSION_SECRET=...
```

---

## Dependencies

### Before (Mongoose)
```json
"mongoose": "^8.19.4"
```

### After (Native MongoDB Driver)
```json
"mongodb": "^6.3.0"
```

### Kept (Still Required)
```json
"multer": "^2.0.2",
"express": "^5.1.0",
"express-session": "^1.18.2",
"pg": "^8.11.3"
```

---

## Testing Checklist

✅ MongoDB Atlas cluster created  
✅ Connection string in .env  
✅ `npm install` completed  
✅ Server starts without errors  
✅ Can upload file (POST /library/upload)  
✅ Can view all files (GET /library)  
✅ Can view my uploads (GET /library/my-uploads)  
✅ Can download file (GET /library/:fileId/download)  
✅ Can share file (POST /library/share)  
✅ Can view shared files (GET /library/shared-with-me)  
✅ Login/profile/friends still work (PostgreSQL)  

---

## Summary

**Storage Architecture**:
- Files: MongoDB Atlas GridFS (cloud storage)
- File Metadata: MongoDB collections
- Users/Auth/Sessions: PostgreSQL (unchanged)
- Friend Relations: PostgreSQL (unchanged)

**No Breaking Changes**:
- Login, register, profile, friends all work as before
- Only library feature uses MongoDB
- Frontend minimal changes needed

**Benefits**:
- Scalable file storage (GridFS automatic chunking)
- Cloud-based (MongoDB Atlas)
- No disk space management needed
- Files distributed across chunks (255KB each)
- Easy to move to production
