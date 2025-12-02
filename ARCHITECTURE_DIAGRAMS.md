# System Architecture Diagram

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                       │
│                    http://localhost:5173 or 3000                     │
│                                                                       │
│  Components:                                                          │
│  • Login.jsx          → POST /api/auth/login                         │
│  • Register.jsx       → POST /api/auth/register                      │
│  • Dashboard.jsx      → GET /api/student/profile                     │
│  • Library.jsx        → POST /library/upload                         │
│                       → GET /library                                  │
│                       → GET /library/:fileId/download                │
│                       → POST /library/share                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ axios (withCredentials: true)
                             │
┌────────────────────────────┴────────────────────────────────────────┐
│                    Backend API (Express.js)                          │
│                    http://localhost:5001                             │
│                                                                       │
│  Middleware:                                                          │
│  • CORS (allowlist: 3000, 3001, 5173)                               │
│  • express-session (connect.sid cookie)                             │
│  • multer (memory storage)                                           │
│  • requireLogin (session check)                                      │
│                                                                       │
│  Routes:                                                              │
│  • /api/auth/*         → authController                              │
│  • /api/student/*      → studentController                           │
│                                                                       │
└─────────────┬──────────────────────────┬────────────────────────────┘
              │                          │
              │                          │
              │                          │
    ┌─────────▼─────────┐       ┌────────▼──────────┐
    │   PostgreSQL      │       │  MongoDB Atlas     │
    │   localhost:5432  │       │   Cloud Cluster    │
    │                   │       │                    │
    │   Tables:         │       │   Collections:     │
    │   • students      │       │   • libraryFiles   │
    │   • friends       │       │   • fileShares     │
    │   • friend_req... │       │                    │
    │   • sessions      │       │   GridFS Bucket:   │
    │                   │       │   • library_files  │
    │                   │       │     .files         │
    │   Used For:       │       │     .chunks        │
    │   • Auth          │       │                    │
    │   • Sessions      │       │   Used For:        │
    │   • User Data     │       │   • File Storage   │
    │   • Friends       │       │   • File Metadata  │
    │                   │       │   • File Sharing   │
    └───────────────────┘       └────────────────────┘
```

---

## Request Flow: File Upload

```
┌────────────┐
│   Client   │
└─────┬──────┘
      │
      │ 1. Select file (test.pdf)
      │
      ├─→ FormData: file=test.pdf
      │
      │ 2. POST /api/student/library/upload
      │    Headers: Cookie: connect.sid=...
      │
┌─────▼──────────────────────────────────────────────────┐
│                   Express Middleware                    │
│                                                          │
│  Step 1: CORS Check                                     │
│   → Verify origin in allowlist                          │
│   → Set Access-Control-Allow-Credentials: true          │
│                                                          │
│  Step 2: Session Check                                  │
│   → Parse connect.sid cookie                            │
│   → Load session from PostgreSQL                        │
│   → req.session.user = { id, userid, name, email }     │
│                                                          │
│  Step 3: Multer (Memory Storage)                        │
│   → Read file into buffer                               │
│   → Validate file type (PDF, DOCX, etc.)               │
│   → Check size limit (50MB)                             │
│   → req.file = {                                        │
│       buffer: <Buffer...>,                              │
│       originalname: "test.pdf",                         │
│       mimetype: "application/pdf",                      │
│       size: 1024000                                     │
│     }                                                    │
│                                                          │
│  Step 4: requireLogin Middleware                        │
│   → Check if req.session.user exists                    │
│   → If not: 401 Unauthorized                            │
│   → If yes: next()                                      │
└─────┬──────────────────────────────────────────────────┘
      │
      │ 5. Route to studentController.uploadFile
      │
┌─────▼──────────────────────────────────────────────────┐
│           studentController.uploadFile                  │
│                                                          │
│  const userId = req.session.user.id;      // 123       │
│  const userUserId = req.session.user.userid; // "12345"│
│  const fileBuffer = req.file.buffer;                    │
│  const metadata = {                                     │
│    filename: "1733149200000-test.pdf",                 │
│    originalName: "test.pdf",                            │
│    fileType: "application/pdf",                         │
│    fileSize: 1024000                                    │
│  };                                                      │
│                                                          │
│  Call: Student.uploadFile(                             │
│    userId,        // 123                                │
│    userUserId,    // "12345"                            │
│    fileBuffer,                                          │
│    metadata                                             │
│  )                                                       │
└─────┬──────────────────────────────────────────────────┘
      │
      │ 6. Model method
      │
┌─────▼──────────────────────────────────────────────────┐
│              Student.uploadFile (Model)                 │
│                                                          │
│  Step 1: Upload to GridFS                              │
│   uploadToGridFS(fileBuffer, metadata)                 │
│   └─→ GridFSBucket.openUploadStream()                  │
│   └─→ Write buffer to stream                           │
│   └─→ Returns: gridFsFileId                            │
│                                                          │
│  Step 2: Save metadata to MongoDB                      │
│   db.collection('libraryFiles').insertOne({            │
│     ownerPostgresId: 123,                              │
│     ownerUserid: "12345",                              │
│     gridFsFileId: "674a1b2c...",                       │
│     filename: "1733149200000-test.pdf",                │
│     originalName: "test.pdf",                          │
│     fileType: "application/pdf",                        │
│     fileSize: 1024000,                                  │
│     uploadedAt: new Date()                             │
│   })                                                    │
│   └─→ Returns: file document with _id                  │
└─────┬──────────────────────────────────────────────────┘
      │
      │ 7. MongoDB operations
      │
┌─────▼──────────────────────────────────────────────────┐
│                MongoDB Atlas + GridFS                   │
│                                                          │
│  Collection: libraryFiles                              │
│  {                                                       │
│    _id: ObjectId("674a1b2c..."),                       │
│    ownerPostgresId: 123,                               │
│    ownerUserid: "12345",                               │
│    gridFsFileId: "674a1b2c3d4e5f6790",                │
│    filename: "1733149200000-test.pdf",                 │
│    originalName: "test.pdf",                            │
│    fileType: "application/pdf",                         │
│    fileSize: 1024000,                                   │
│    uploadedAt: ISODate("2025-12-02T...")               │
│  }                                                       │
│                                                          │
│  Collection: library_files.files (GridFS)              │
│  {                                                       │
│    _id: ObjectId("674a1b2c3d4e5f6790"),               │
│    length: 1024000,                                     │
│    chunkSize: 261120,                                   │
│    uploadDate: ISODate("..."),                         │
│    filename: "1733149200000-test.pdf",                 │
│    metadata: {                                          │
│      originalName: "test.pdf",                          │
│      fileType: "application/pdf",                       │
│      ownerPostgresId: 123,                             │
│      ownerUserid: "12345"                              │
│    }                                                     │
│  }                                                       │
│                                                          │
│  Collection: library_files.chunks (GridFS)             │
│  [                                                       │
│    {                                                     │
│      _id: ObjectId("..."),                             │
│      files_id: ObjectId("674a1b2c3d4e5f6790"),        │
│      n: 0,                                              │
│      data: Binary("...255KB...")                       │
│    },                                                    │
│    {                                                     │
│      _id: ObjectId("..."),                             │
│      files_id: ObjectId("674a1b2c3d4e5f6790"),        │
│      n: 1,                                              │
│      data: Binary("...255KB...")                       │
│    },                                                    │
│    // ... more chunks                                   │
│  ]                                                       │
└─────┬──────────────────────────────────────────────────┘
      │
      │ 8. Return file metadata
      │
┌─────▼──────────────────────────────────────────────────┐
│                   Response to Client                    │
│                                                          │
│  {                                                       │
│    "success": true,                                     │
│    "message": "File uploaded successfully...",          │
│    "data": {                                            │
│      "_id": "674a1b2c...",                             │
│      "ownerPostgresId": 123,                           │
│      "ownerUserid": "12345",                           │
│      "gridFsFileId": "674a1b2c3d4e5f6790",            │
│      "filename": "1733149200000-test.pdf",             │
│      "originalName": "test.pdf",                        │
│      "fileType": "application/pdf",                     │
│      "fileSize": 1024000,                               │
│      "uploadedAt": "2025-12-02T10:00:00.000Z"          │
│    }                                                     │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## Request Flow: File Download

```
┌────────────┐
│   Client   │
└─────┬──────┘
      │
      │ 1. GET /api/student/library/674a1b2c.../download
      │    Headers: Cookie: connect.sid=...
      │
┌─────▼──────────────────────────────────────────────────┐
│              Express Middleware (Same as above)         │
│   → CORS Check                                          │
│   → Session Check                                       │
│   → requireLogin                                        │
└─────┬──────────────────────────────────────────────────┘
      │
┌─────▼──────────────────────────────────────────────────┐
│          studentController.downloadFile                 │
│                                                          │
│  const { fileId } = req.params;                        │
│  const file = await Student.getFileById(fileId);       │
│  // Returns MongoDB metadata document                   │
└─────┬──────────────────────────────────────────────────┘
      │
┌─────▼──────────────────────────────────────────────────┐
│             Student.getFileById (Model)                 │
│                                                          │
│  db.collection('libraryFiles').findOne({               │
│    _id: new ObjectId(fileId)                           │
│  })                                                      │
│  // Returns file metadata                               │
└─────┬──────────────────────────────────────────────────┘
      │
┌─────▼──────────────────────────────────────────────────┐
│          studentController.downloadFile (cont'd)        │
│                                                          │
│  const { downloadFromGridFS } = require(mongodb.js);   │
│  const stream = downloadFromGridFS(file.gridFsFileId); │
│                                                          │
│  res.setHeader('Content-Type', file.fileType);         │
│  res.setHeader('Content-Disposition',                  │
│    `attachment; filename="${file.originalName}"`);     │
│                                                          │
│  stream.pipe(res);                                      │
└─────┬──────────────────────────────────────────────────┘
      │
┌─────▼──────────────────────────────────────────────────┐
│               MongoDB GridFS Stream                     │
│                                                          │
│  GridFSBucket.openDownloadStream(gridFsFileId)         │
│   └─→ Read library_files.chunks (n=0, n=1, n=2...)    │
│   └─→ Reassemble file from chunks                      │
│   └─→ Stream binary data                               │
└─────┬──────────────────────────────────────────────────┘
      │
      │ 3. Binary stream piped to response
      │
┌─────▼──────┐
│   Client   │
│  Receives  │
│  test.pdf  │
└────────────┘
```

---

## Request Flow: File Sharing

```
┌────────────┐
│  Client A  │  (userid: "12345")
└─────┬──────┘
      │
      │ POST /api/student/library/share
      │ Body: {
      │   "fileId": "674a1b2c...",
      │   "targetUserId": "67890"  ← Client B's userid
      │ }
      │
┌─────▼──────────────────────────────────────────────────┐
│        studentController.shareFileWithFriend            │
│                                                          │
│  const { fileId, targetUserId } = req.body;            │
│  const currentUser = req.session.user;                  │
│  // currentUser.userid = "12345"                        │
│                                                          │
│  await Student.shareFile(                              │
│    fileId,                  // "674a1b2c..."           │
│    currentUser.userid,      // "12345" (sharer)        │
│    targetUserId             // "67890" (recipient)      │
│  )                                                       │
└─────┬──────────────────────────────────────────────────┘
      │
┌─────▼──────────────────────────────────────────────────┐
│              Student.shareFile (Model)                  │
│                                                          │
│  Step 1: Verify file exists in MongoDB                 │
│   db.collection('libraryFiles').findOne({              │
│     _id: new ObjectId(fileId)                          │
│   })                                                     │
│                                                          │
│  Step 2: Verify target user exists in PostgreSQL       │
│   SELECT id FROM students WHERE userid = '67890'       │
│                                                          │
│  Step 3: Check if already shared                       │
│   db.collection('fileShares').findOne({                │
│     fileId: fileId,                                     │
│     sharedWithUserId: "67890"                          │
│   })                                                     │
│                                                          │
│  Step 4: Create share record                           │
│   db.collection('fileShares').insertOne({              │
│     fileId: "674a1b2c...",                             │
│     sharedByUserId: "12345",                           │
│     sharedWithUserId: "67890",                         │
│     sharedAt: new Date()                               │
│   })                                                     │
└─────┬──────────────────────────────────────────────────┘
      │
      │
┌─────▼──────────────────────────────────────────────────┐
│              MongoDB fileShares Collection              │
│                                                          │
│  {                                                       │
│    _id: ObjectId("..."),                               │
│    fileId: "674a1b2c...",                              │
│    sharedByUserId: "12345",                            │
│    sharedWithUserId: "67890",                          │
│    sharedAt: ISODate("2025-12-02T...")                 │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
      │
      │
      │ Now when Client B (userid: "67890") calls:
      │ GET /api/student/library/shared-with-me
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│         Student.getSharedWithMe("67890")                │
│                                                          │
│  Step 1: Find shares for this user                     │
│   shares = db.collection('fileShares').find({          │
│     sharedWithUserId: "67890"                          │
│   })                                                     │
│                                                          │
│  Step 2: Get file metadata for each share              │
│   file = db.collection('libraryFiles').findOne({       │
│     _id: new ObjectId(share.fileId)                    │
│   })                                                     │
│                                                          │
│  Step 3: Enrich with PostgreSQL user info              │
│   owner = SELECT name FROM students                     │
│           WHERE id = file.ownerPostgresId              │
│   sharer = SELECT name FROM students                    │
│            WHERE userid = share.sharedByUserId         │
│                                                          │
│  Returns: Array of enriched file objects               │
└─────────────────────────────────────────────────────────┘
```

---

## Database Linking Strategy

### PostgreSQL Student ↔ MongoDB File
```
PostgreSQL: students table
┌─────┬──────────┬────────────────────┬──────┐
│ id  │ userid   │ name               │ ...  │
├─────┼──────────┼────────────────────┼──────┤
│ 123 │ "12345" │ "Alice Johnson"    │ ...  │
│ 456 │ "67890" │ "Bob Smith"        │ ...  │
└─────┴──────────┴────────────────────┴──────┘
        │          │
        │          │
        │          └───────────────────┐
        │                              │
        └──────────────┐               │
                       │               │
                       ▼               ▼
MongoDB: libraryFiles collection
┌──────────────────┬──────────────────┬───────────────┬──────────┐
│ _id              │ ownerPostgresId  │ ownerUserid   │ filename │
├──────────────────┼──────────────────┼───────────────┼──────────┤
│ "674a1b2c..."    │ 123 ◄────────────┤ "12345" ◄─────┤ file.pdf │
│ "674a1b2c999"    │ 456              │ "67890"       │ doc.docx │
└──────────────────┴──────────────────┴───────────────┴──────────┘

MongoDB: fileShares collection
┌──────────────────┬────────────────┬──────────────────┐
│ fileId           │ sharedByUserId │ sharedWithUserId │
├──────────────────┼────────────────┼──────────────────┤
│ "674a1b2c..."    │ "12345" ◄──────┤ "67890" ◄────────┤
│                  │ (Alice)        │ (Bob)            │
└──────────────────┴────────────────┴──────────────────┘
                            │                │
                            └────┐      ┐────┘
                                 │      │
                                 ▼      ▼
                         Both reference PostgreSQL
                         student.userid values
```

---

## Session Flow

```
┌────────────┐
│   Client   │
└─────┬──────┘
      │
      │ 1. POST /api/auth/login
      │    { email, password }
      │
┌─────▼──────────────────────────────────────────────────┐
│              authController.login                       │
│                                                          │
│  • Verify email/password in PostgreSQL                 │
│  • If valid:                                            │
│    req.session.user = {                                │
│      id: 123,                                           │
│      userid: "12345",                                  │
│      name: "Alice",                                     │
│      email: "alice@example.com"                        │
│    }                                                     │
│  • express-session saves to PostgreSQL sessions table  │
└─────┬──────────────────────────────────────────────────┘
      │
      │ 2. Response includes Set-Cookie header
      │    Set-Cookie: connect.sid=s%3A....; HttpOnly
      │
┌─────▼──────┐
│   Client   │
│  (stores   │
│   cookie)  │
└─────┬──────┘
      │
      │ 3. Subsequent requests include cookie
      │    Cookie: connect.sid=s%3A....
      │
┌─────▼──────────────────────────────────────────────────┐
│              express-session middleware                 │
│                                                          │
│  • Parse connect.sid cookie                            │
│  • Load session from PostgreSQL sessions table         │
│  • Attach to req.session                               │
│  • req.session.user now available                      │
└─────┬──────────────────────────────────────────────────┘
      │
      │ 4. requireLogin middleware checks
      │    if (req.session.user) { next() }
      │
┌─────▼──────────────────────────────────────────────────┐
│              studentController methods                  │
│                                                          │
│  Can access:                                            │
│  • req.session.user.id        (PostgreSQL id)          │
│  • req.session.user.userid    (PostgreSQL userid)      │
│  • req.session.user.name                               │
│  • req.session.user.email                              │
│                                                          │
│  Use these to link:                                     │
│  • MongoDB files (ownerPostgresId, ownerUserid)        │
│  • MongoDB shares (sharedByUserId, sharedWithUserId)   │
└─────────────────────────────────────────────────────────┘
```

---

## File Storage: Disk vs GridFS

### Before (Disk Storage) ❌
```
┌────────────────────────────────────┐
│  backend/uploads/                  │
│  ├─ 1733149200-document.pdf       │
│  ├─ 1733149300-image.jpg          │
│  └─ 1733149400-video.mp4          │
└────────────────────────────────────┘
         │
         │ File path stored in PostgreSQL
         │
         ▼
┌────────────────────────────────────┐
│  PostgreSQL: library table         │
│  ┌─────┬──────────┬─────────────┐ │
│  │ id  │ filename │ file_path   │ │
│  ├─────┼──────────┼─────────────┤ │
│  │ 1   │ doc.pdf  │ /uploads/...│ │
│  └─────┴──────────┴─────────────┘ │
└────────────────────────────────────┘

Issues:
• Disk space management
• Backup complexity
• Scalability limits
• Server dependency
```

### After (GridFS) ✅
```
┌────────────────────────────────────────────────────┐
│          MongoDB Atlas (Cloud)                      │
│                                                      │
│  Collection: library_files.files                   │
│  ┌────────────┬────────┬──────────────┐           │
│  │ _id        │ length │ uploadDate   │           │
│  ├────────────┼────────┼──────────────┤           │
│  │ 674a1b2... │ 1MB    │ 2025-12-02   │           │
│  └────────────┴────────┴──────────────┘           │
│       │                                             │
│       │ Split into 255KB chunks                    │
│       ▼                                             │
│  Collection: library_files.chunks                  │
│  ┌────────────┬────────┬───┬──────────┐           │
│  │ files_id   │ n      │ data (255KB) │           │
│  ├────────────┼────────┼───┼──────────┤           │
│  │ 674a1b2... │ 0      │ <Binary>     │           │
│  │ 674a1b2... │ 1      │ <Binary>     │           │
│  │ 674a1b2... │ 2      │ <Binary>     │           │
│  │ 674a1b2... │ 3      │ <Binary>     │           │
│  └────────────┴────────┴───┴──────────┘           │
└────────────────────────────────────────────────────┘
         │
         │ gridFsFileId reference
         ▼
┌────────────────────────────────────────────────────┐
│  MongoDB: libraryFiles (Metadata)                  │
│  ┌─────────────┬────────────────┬───────────────┐ │
│  │ _id         │ gridFsFileId   │ originalName  │ │
│  ├─────────────┼────────────────┼───────────────┤ │
│  │ 674a1b2c... │ 674a1b2...     │ document.pdf  │ │
│  └─────────────┴────────────────┴───────────────┘ │
└────────────────────────────────────────────────────┘

Benefits:
✅ Cloud storage (MongoDB Atlas)
✅ Automatic chunking
✅ Scalable to any size
✅ Built-in replication
✅ No disk management
✅ Easy backup/restore
```

---

## Summary

**Key Architecture Points**:

1. **Dual Database**: PostgreSQL (users) + MongoDB (files)
2. **Session-Based Auth**: PostgreSQL sessions link everything
3. **GridFS Storage**: Files chunked and stored in cloud
4. **User Linking**: Both `student.id` and `student.userid` used
5. **File Sharing**: Uses PostgreSQL userids for friend identification
6. **Memory Upload**: Multer memoryStorage → GridFS (no disk writes)

**Data Flow**:
```
Client → Express → Session Check → Controller → Model → Database
                                                    ├─→ PostgreSQL (users)
                                                    └─→ MongoDB (files)
```

**Storage Strategy**:
```
User Data:       PostgreSQL
File Data:       MongoDB GridFS
File Metadata:   MongoDB Collections
File Sharing:    MongoDB (refs PostgreSQL userids)
Sessions:        PostgreSQL
```
