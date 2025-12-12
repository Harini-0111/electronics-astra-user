# Electronics Astra - Student Management System

A full-stack student management system with **dual-database architecture** featuring user authentication, friend management, and a cloud-based file library system.

## 🏗️ Architecture

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Databases**: 
  - **PostgreSQL**: User accounts, authentication, sessions, friend relations
  - **MongoDB + GridFS**: File storage and management (cloud-based)

## ✨ Features

### 👤 User Management
- ✅ User registration with OTP verification
- ✅ Secure login with session-based authentication
- ✅ Profile management (view, update, delete)
- ✅ Password change functionality
- ✅ Forgot password with email recovery

### 👥 Friend System
- ✅ Send friend requests
- ✅ Accept/reject friend requests
- ✅ View friends list
- ✅ View friend profiles

### 📚 Library System (Dual-Database)
- ✅ **Upload files** to MongoDB GridFS (cloud storage)
- ✅ **Download files** with streaming support
- ✅ **Share files** with friends by userid
- ✅ **View all files** from all users
- ✅ **My uploads** - personal file management
- ✅ **Shared with me** - files shared by friends
- ✅ Support for: PDF, DOCX, XLSX, images, videos, ZIP, TXT (50MB max)

## 📁 Project Structure

```
electronics-astra-user/
├── backend/
│   ├── config/
│   │   ├── db.js              # PostgreSQL connection
│   │   ├── mongodb.js         # MongoDB + GridFS utilities
│   │   └── multer.js          # File upload configuration
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   └── studentController.js # Student & library operations
│   ├── models/
│   │   └── Student.js         # Student model (PostgreSQL + MongoDB)
│   ├── routes/
│   │   ├── auth.js            # Auth routes
│   │   └── studentRoutes.js   # Student & library routes
│   ├── utils/
│   │   ├── dbStatus.js        # Database utilities
│   │   └── otpUtils.js        # OTP generation
│   ├── server.js              # Express server
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Nav.jsx        # Navigation bar
│   │   │   ├── Sidebar.jsx    # Sidebar menu
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Library.jsx    # File library interface
│   │   │   ├── FriendProfile.jsx
│   │   │   └── ...
│   │   ├── api/
│   │   │   └── axiosInstance.js
│   │   └── App.jsx
│   └── package.json
│
└── Documentation/
    ├── QUICK_START.md             # 5-minute setup guide
    ├── TESTING_GUIDE.md           # Complete testing instructions
    ├── MONGODB_GRIDFS_SETUP.md    # MongoDB Atlas setup
    ├── BACKEND_CODE_STRUCTURE.md  # Technical details
    ├── ARCHITECTURE_DIAGRAMS.md   # Visual diagrams
    └── test-api-full.ps1          # Automated test script
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- PostgreSQL (running)
- MongoDB (local or Atlas account)

### 1. Clone Repository
```bash
git clone https://github.com/Harini-0111/electronics-astra-user.git
cd electronics-astra-user
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
```env
# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=electronics_astra
PG_USER=postgres
PG_PASSWORD=your_password

# MongoDB (Local or Atlas)
MONGO_URI=mongodb://localhost:27017/electronics-astra
# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/
MONGO_DB_NAME=electronics_astra

# Server
PORT=5001
SESSION_SECRET=your_random_secret_key
JWT_SECRET=your_jwt_secret

# Email (for OTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

Start backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Access Application
- **Frontend**: http://localhost:5173 or http://localhost:3000
- **Backend API**: http://localhost:5001

## 📊 Database Schema

### PostgreSQL Tables
- `students` - User accounts and profiles
- `friends` - Friend relationships
- `friend_requests` - Pending friend requests
- `sessions` - Express sessions

### MongoDB Collections
- `libraryFiles` - File metadata (owner, filename, type, size, etc.)
- `fileShares` - File sharing records
- `library_files.files` - GridFS file metadata
- `library_files.chunks` - GridFS file chunks (255KB each)

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login
POST   /api/auth/verify-otp        # Verify OTP
POST   /api/auth/forgot-password   # Request password reset
POST   /api/auth/reset-password    # Reset password
```

### Student Profile
```
GET    /api/student/profile        # Get profile
PUT    /api/student/profile        # Update profile
DELETE /api/student/profile        # Delete account
PUT    /api/student/change-password # Change password
POST   /api/student/logout         # Logout
GET    /api/student/session-status # Check session
```

### Friends
```
POST   /api/student/friends/request # Send friend request
POST   /api/student/friends/accept  # Accept request
GET    /api/student/friends/requests # View pending requests
GET    /api/student/friends         # List friends
GET    /api/student/friend-profile/:userid # View friend profile
```

### Library (MongoDB GridFS)
```
POST   /api/student/library/upload         # Upload file
GET    /api/student/library                # Get all files
GET    /api/student/library/my-uploads     # Get user's files
GET    /api/student/library/:fileId/download # Download file
POST   /api/student/library/share          # Share with friend
GET    /api/student/library/shared-with-me # Get shared files
```

## 🧪 Testing

### Automated Testing
```powershell
# Run complete test suite
.\test-api-full.ps1
```

### Manual Testing
```bash
# Health check
curl http://localhost:5001/api/health

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -c cookies.txt

# Upload file
curl -X POST http://localhost:5001/api/student/library/upload \
  -b cookies.txt \
  -F "file=@test.pdf"

# Get files
curl http://localhost:5001/api/student/library -b cookies.txt
```

See **TESTING_GUIDE.md** for complete testing instructions.

## 🔒 Security Features

- ✅ Session-based authentication (HttpOnly cookies)
- ✅ Password hashing with bcrypt
- ✅ CORS with credential handling
- ✅ File type validation
- ✅ File size limits (50MB)
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **QUICK_START.md** | 5-minute setup guide |
| **TESTING_GUIDE.md** | Complete testing instructions with examples |
| **MONGODB_GRIDFS_SETUP.md** | MongoDB Atlas cloud setup guide |
| **BACKEND_CODE_STRUCTURE.md** | Technical implementation details |
| **ARCHITECTURE_DIAGRAMS.md** | Visual system architecture diagrams |
| **IMPLEMENTATION_SUMMARY.md** | Feature summary and status |
| **CHECKLIST.md** | Setup verification checklist |

## 🛠️ Tech Stack

### Backend
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **MongoDB** - Document database
- **GridFS** - Large file storage
- **express-session** - Session management
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Nodemailer** - Email service

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client

## 🌟 Key Highlights

### Dual-Database Architecture
This project showcases a **hybrid database approach**:
- **PostgreSQL** handles relational data (users, friends, sessions)
- **MongoDB + GridFS** handles file storage (scalable, cloud-based)
- Both databases work seamlessly together through PostgreSQL `student.id` and `student.userid` linking

### GridFS Benefits
- ✅ **Automatic chunking** - Files split into 255KB chunks
- ✅ **Scalable** - Handles files larger than 16MB (BSON limit)
- ✅ **Streaming** - Efficient download without loading entire file
- ✅ **Cloud-ready** - Works with MongoDB Atlas
- ✅ **No disk management** - Files stored in database

## 🚀 Deployment

### Backend (Node.js + Express)
- Deploy to: Heroku, Railway, Render, AWS EC2
- Set environment variables
- Configure PostgreSQL (e.g., Heroku Postgres)
- Configure MongoDB Atlas connection

### Frontend (React + Vite)
- Build: `npm run build`
- Deploy to: Vercel, Netlify, GitHub Pages
- Update API baseURL for production

## 🐛 Troubleshooting

### Server won't start
- Check `.env` file exists with correct values
- Verify PostgreSQL is running
- Check MongoDB connection (local or Atlas)
- Run `npm install` in backend folder

### File upload fails
- Check file size < 50MB
- Verify file type is allowed
- Ensure user is logged in (session cookie)
- Check MongoDB connection

### Database connection errors
- **PostgreSQL**: Verify credentials, check if service is running
- **MongoDB**: Check URI format, Atlas network access, credentials

See **TESTING_GUIDE.md** for detailed troubleshooting.

## 📄 License

This project is for educational purposes.

## 👥 Contributors

- **Harini** - Project Developer

## 📞 Support

For issues or questions:
1. Check documentation files
2. Review **TESTING_GUIDE.md** for common solutions
3. Check server logs for errors
4. Verify database connections

---

## 🎯 Current Status

✅ **Backend**: Fully implemented  
✅ **Frontend**: Operational  
✅ **Dual-Database**: PostgreSQL + MongoDB integrated  
✅ **File Storage**: GridFS cloud storage ready  
✅ **Authentication**: Session-based auth working  
✅ **Friend System**: Complete  
✅ **Library System**: Upload, download, share functional  

**System is production-ready!** 🎉

---

**Branch**: `harinibranch`  
**Last Updated**: December 2, 2025
