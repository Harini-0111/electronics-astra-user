const pool = require('../config/db');
const crypto = require('crypto');

class Student {
  // Create the students table (if it doesn't exist)
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        userid INTEGER UNIQUE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address VARCHAR(500),
        date_of_birth DATE,
        otp VARCHAR(6),
        otp_expiry TIMESTAMP,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    try {
      await pool.query(query);
      console.log('✓ Students table created/verified');
      // Ensure userid column exists (for older installations where table existed)
      try {
        await pool.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS userid INTEGER UNIQUE`);
        // Create friend requests and friends tables
        await pool.query(`
          CREATE TABLE IF NOT EXISTS friend_requests (
            id SERIAL PRIMARY KEY,
            from_student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
            to_student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS friends (
            id SERIAL PRIMARY KEY,
            student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
            friend_student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (student_id, friend_student_id)
          )
        `);

        // Create library tables
        await pool.query(`
          CREATE TABLE IF NOT EXISTS library (
            id SERIAL PRIMARY KEY,
            owner_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
            filename VARCHAR(255) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            file_type VARCHAR(100),
            file_path VARCHAR(500) NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS library_shares (
            id SERIAL PRIMARY KEY,
            file_id INTEGER REFERENCES library(id) ON DELETE CASCADE,
            shared_by_user_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
            shared_with_user_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
            shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✓ Library tables created/verified');
      } catch (err) {
        // If ALTER fails, log but continue
        console.warn('Warning: could not ensure userid column exists:', err && err.message ? err.message : err);
      }
    } catch (err) {
      console.error('Error creating students table:', err);
    }
  }

  // Register a new student (store with OTP) — supports optional phone/address/date_of_birth
  static async register(name, email, hashedPassword, otp, otpExpiry, phone = null, address = null, date_of_birth = null) {
    // Generate a unique 5-digit numeric userid using secure random
    let userid;
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // crypto.randomInt is secure; generate between 10000 and 99999 inclusive
      userid = crypto.randomInt(10000, 100000);
      // Check uniqueness
      const exists = await pool.query('SELECT id FROM students WHERE userid = $1', [userid]);
      if (exists.rows.length === 0) break;
      userid = null;
    }
    if (!userid) {
      throw new Error('Failed to generate unique userid, try again');
    }

    const query = `
      INSERT INTO students (name, email, password, phone, address, date_of_birth, otp, otp_expiry, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)
      RETURNING id, userid, name, email, phone, address, date_of_birth, is_verified
    `;
    try {
      const result = await pool.query(query, [name, email, hashedPassword, phone, address, date_of_birth, otp, otpExpiry]);
      return result.rows[0];
    } catch (err) {
      // Handle unique constraints (email or userid) gracefully
      if (err.code === '23505') { // Unique constraint violation
        // Could be email conflict
        throw new Error('Email already registered');
      }
      throw err;
    }
  }

  // Assign a unique 5-digit userid to a student (used after verification)
  static async assignUserid(studentId) {
    let userid;
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      userid = crypto.randomInt(10000, 100000);
      const exists = await pool.query('SELECT id FROM students WHERE userid = $1', [userid]);
      if (exists.rows.length === 0) break;
      userid = null;
    }
    if (!userid) throw new Error('Failed to generate unique userid');

    const result = await pool.query(
      `UPDATE students SET userid = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, userid, name, email`,
      [userid, studentId]
    );
    if (result.rows.length === 0) throw new Error('Student not found');
    return result.rows[0];
  }

  // Send a friend request from one student to another (by target userid)
  static async sendFriendRequest(fromStudentId, targetUserid) {
    // Find target student id
    const target = await pool.query('SELECT id FROM students WHERE userid = $1', [targetUserid]);
    if (target.rows.length === 0) throw new Error('Target user not found');
    const toStudentId = target.rows[0].id;

    // Prevent sending to self
    if (toStudentId === fromStudentId) throw new Error('Cannot send friend request to yourself');

    // Check if already friends
    const existingFriend = await pool.query('SELECT id FROM friends WHERE student_id = $1 AND friend_student_id = $2', [fromStudentId, toStudentId]);
    if (existingFriend.rows.length > 0) throw new Error('Already friends');

    // Check if pending request exists
    const pending = await pool.query(
      'SELECT id FROM friend_requests WHERE from_student_id = $1 AND to_student_id = $2 AND status = $3',
      [fromStudentId, toStudentId, 'pending']
    );
    if (pending.rows.length > 0) throw new Error('Friend request already sent');

    const result = await pool.query(
      'INSERT INTO friend_requests (from_student_id, to_student_id, status) VALUES ($1, $2, $3) RETURNING id, from_student_id, to_student_id, status, created_at',
      [fromStudentId, toStudentId, 'pending']
    );
    return result.rows[0];
  }

  // Accept a friend request: toStudentId accepts request from fromStudentId
  static async acceptFriendRequest(toStudentId, fromStudentId) {
    // Find pending request
    const reqRes = await pool.query(
      'SELECT id FROM friend_requests WHERE from_student_id = $1 AND to_student_id = $2 AND status = $3',
      [fromStudentId, toStudentId, 'pending']
    );
    if (reqRes.rows.length === 0) throw new Error('Friend request not found');
    const requestId = reqRes.rows[0].id;

    // Mark request accepted
    await pool.query('UPDATE friend_requests SET status = $1 WHERE id = $2', ['accepted', requestId]);

    // Insert into friends table both directions
    await pool.query('INSERT INTO friends (student_id, friend_student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [fromStudentId, toStudentId]);
    await pool.query('INSERT INTO friends (student_id, friend_student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [toStudentId, fromStudentId]);

    // Return the friendship record
    const friendRecord = await pool.query('SELECT id, student_id, friend_student_id, created_at FROM friends WHERE student_id = $1 AND friend_student_id = $2', [fromStudentId, toStudentId]);
    return friendRecord.rows[0];
  }

  // Get incoming friend requests for a student
  static async getFriendRequests(studentId) {
    const query = `
      SELECT fr.id, fr.from_student_id, s.userid as from_userid, s.name as from_name, fr.created_at
      FROM friend_requests fr
      JOIN students s ON s.id = fr.from_student_id
      WHERE fr.to_student_id = $1 AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `;
    const result = await pool.query(query, [studentId]);
    return result.rows;
  }

  // Get friends list for a student
  static async getFriends(studentId) {
    const query = `
      SELECT f.friend_student_id as id, s.userid, s.name, s.email, s.phone, s.address
      FROM friends f
      JOIN students s ON s.id = f.friend_student_id
      WHERE f.student_id = $1
      ORDER BY f.created_at DESC
    `;
    const result = await pool.query(query, [studentId]);
    return result.rows;
  }

  // Find student by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM students WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Find student by userid (5-digit numeric code)
  static async findByUserId(userid) {
    const query = 'SELECT * FROM students WHERE userid = $1';
    const result = await pool.query(query, [userid]);
    return result.rows[0];
  }

  // Find student by ID
  static async findById(id) {
    const query = 'SELECT * FROM students WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Verify OTP and mark student as verified
  static async verifyOTP(email, otp) {
    const query = `
      UPDATE students
      SET is_verified = TRUE, otp = NULL, otp_expiry = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE email = $1 AND otp = $2 AND otp_expiry > CURRENT_TIMESTAMP
      RETURNING id, name, email, is_verified
    `;
    try {
      const result = await pool.query(query, [email, otp]);
      if (result.rows.length === 0) {
        throw new Error('Invalid or expired OTP');
      }
      return result.rows[0];
    } catch (err) {
      throw err;
    }
  }

  // Check OTP validity without modifying verification state (used for password reset flow)
  static async checkOTP(email, otp) {
    const query = `
      SELECT id FROM students
      WHERE email = $1 AND otp = $2 AND otp_expiry > CURRENT_TIMESTAMP
    `;
    const result = await pool.query(query, [email, otp]);
    return result.rows.length > 0;
  }

  // Resend OTP (update OTP and expiry)
  static async resendOTP(email, newOtp, newOtpExpiry) {
    const query = `
      UPDATE students
      SET otp = $1, otp_expiry = $2, updated_at = CURRENT_TIMESTAMP
      WHERE email = $3
      RETURNING id, name, email, is_verified
    `;
    try {
      const result = await pool.query(query, [newOtp, newOtpExpiry, email]);
      if (result.rows.length === 0) {
        throw new Error('Student not found');
      }
      return result.rows[0];
    } catch (err) {
      throw err;
    }
  }

  // Reset password using OTP (email + otp) -> set new hashed password
  static async resetPasswordByOTP(email, otp, newHashedPassword) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const selectQ = `SELECT id FROM students WHERE email = $1 AND otp = $2 AND otp_expiry > CURRENT_TIMESTAMP`;
      const sel = await client.query(selectQ, [email, otp]);
      if (sel.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('Invalid or expired OTP');
      }
      const studentId = sel.rows[0].id;
      const updQ = `UPDATE students SET password = $1, otp = NULL, otp_expiry = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email`;
      const upd = await client.query(updQ, [newHashedPassword, studentId]);
      await client.query('COMMIT');
      return upd.rows[0];
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (e) {}
      throw err;
    } finally {
      client.release();
    }
  }

  // Check if email exists
  static async emailExists(email) {
    const query = 'SELECT id FROM students WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows.length > 0;
  }

  // Get profile (all fields)
  static async getProfile(id) {
    const query = `
      SELECT id, userid, name, email, phone, address, date_of_birth, is_verified, created_at, updated_at
      FROM students
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      throw new Error('Student not found');
    }
    return result.rows[0];
  }

  // Update profile (name, phone, address, date_of_birth)
  static async updateProfile(id, updateData) {
    const { name, phone, address, date_of_birth } = updateData;
    const query = `
      UPDATE students
      SET name = COALESCE($1, name),
          phone = COALESCE($2, phone),
          address = COALESCE($3, address),
          date_of_birth = COALESCE($4, date_of_birth),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, email, phone, address, date_of_birth, is_verified, created_at, updated_at
    `;
    try {
      const result = await pool.query(query, [name, phone, address, date_of_birth, id]);
      if (result.rows.length === 0) {
        throw new Error('Student not found');
      }
      return result.rows[0];
    } catch (err) {
      throw err;
    }
  }

  // Delete profile (account deletion)
  static async deleteProfile(id) {
    const query = 'DELETE FROM students WHERE id = $1 RETURNING id, email';
    try {
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) {
        throw new Error('Student not found');
      }
      return result.rows[0];
    } catch (err) {
      throw err;
    }
  }

  // Change password (update password by student ID)
  static async changePassword(id, newHashedPassword) {
    const query = `
      UPDATE students
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email
    `;
    try {
      const result = await pool.query(query, [newHashedPassword, id]);
      if (result.rows.length === 0) {
        throw new Error('Student not found');
      }
      return result.rows[0];
    } catch (err) {
      throw err;
    }
  }

  // ============ LIBRARY METHODS (MongoDB + GridFS) ============

  // ============ RESOURCES (MongoDB + GridFS, PDF/JPG/PNG) ============

  /**
   * Upload resource file to GridFS and metadata to MongoDB
   * @param {number} ownerPostgresId
   * @param {string} ownerUserid
   * @param {Buffer} fileBuffer
   * @param {{filename:string, originalName:string, fileType:string, fileSize:number}} fileMetadata
   */
  static async uploadResourceFile(ownerPostgresId, ownerUserid, fileBuffer, fileMetadata) {
    const { getDB, uploadToGridFS } = require('../config/mongodb');
    const db = getDB();

    const gridFsFileId = await uploadToGridFS(fileBuffer, {
      filename: fileMetadata.filename,
      originalName: fileMetadata.originalName,
      fileType: fileMetadata.fileType,
      ownerPostgresId,
      ownerUserid,
      tag: 'resource'
    });

    const doc = {
      ownerPostgresId,
      ownerUserid,
      gridFsFileId: gridFsFileId.toString(),
      filename: fileMetadata.filename,
      originalName: fileMetadata.originalName,
      fileType: fileMetadata.fileType,
      fileSize: fileMetadata.fileSize,
      uploadedAt: new Date(),
    };

    const result = await db.collection('resourcesFiles').insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  /**
   * List all resources newest first, enriched with uploader info
   */
  static async getAllResourceFiles() {
    const { getDB } = require('../config/mongodb');
    const db = getDB();

    const files = await db.collection('resourcesFiles')
      .find({})
      .sort({ uploadedAt: -1 })
      .toArray();

    const enriched = await Promise.all(files.map(async (file) => {
      const ownerQuery = 'SELECT name, userid FROM students WHERE id = $1';
      const ownerRes = await pool.query(ownerQuery, [file.ownerPostgresId]);
      const owner = ownerRes.rows[0] || {};

      return {
        ...file,
        fileId: file._id.toString(),
        owner_name: owner.name,
        owner_userid: owner.userid,
      };
    }));

    return enriched;
  }

  /**
   * Get single resource metadata by id
   */
  static async getResourceFileById(fileId) {
    const { getDB, ObjectId } = require('../config/mongodb');
    const db = getDB();
    const file = await db.collection('resourcesFiles').findOne({ _id: new ObjectId(fileId) });
    return file ? { ...file, fileId: file._id.toString() } : null;
  }

  /**
   * Upload file to MongoDB GridFS
   * @param {number} ownerPostgresId - PostgreSQL student.id
   * @param {string} ownerUserid - PostgreSQL student.userid
   * @param {Buffer} fileBuffer - File buffer
   * @param {Object} fileMetadata - { filename, originalName, fileType, fileSize }
   * @returns {Promise<Object>} - Created file metadata document
   */
  static async uploadFile(ownerPostgresId, ownerUserid, fileBuffer, fileMetadata) {
    const { getDB, uploadToGridFS } = require('../config/mongodb');
    const db = getDB();
    
    // Upload file to GridFS
    const gridFsFileId = await uploadToGridFS(fileBuffer, {
      filename: fileMetadata.filename,
      originalName: fileMetadata.originalName,
      fileType: fileMetadata.fileType,
      ownerPostgresId,
      ownerUserid
    });

    // Save metadata to libraryFiles collection
    const fileDoc = {
      ownerPostgresId,
      ownerUserid,
      gridFsFileId: gridFsFileId.toString(),
      filename: fileMetadata.filename,
      originalName: fileMetadata.originalName,
      fileType: fileMetadata.fileType,
      fileSize: fileMetadata.fileSize,
      uploadedAt: new Date()
    };

    const result = await db.collection('libraryFiles').insertOne(fileDoc);
    return { ...fileDoc, _id: result.insertedId };
  }

  /**
   * Get all library files from MongoDB
   * @returns {Promise<Array>} - All files with owner info from PostgreSQL
   */
  static async getAllFiles() {
    const { getDB } = require('../config/mongodb');
    const db = getDB();
    
    // Get all files from MongoDB
    const files = await db.collection('libraryFiles')
      .find({})
      .sort({ uploadedAt: -1 })
      .toArray();

    // Enrich with PostgreSQL owner info
    const enrichedFiles = await Promise.all(
      files.map(async (file) => {
        const ownerQuery = 'SELECT name, userid FROM students WHERE id = $1';
        const ownerResult = await pool.query(ownerQuery, [file.ownerPostgresId]);
        const owner = ownerResult.rows[0] || {};

        const fileId = file._id.toString();
        return {
          ...file,
          fileId,
          fileUrl: `/library/${fileId}/download`,
          owner_name: owner.name,
          owner_userid: owner.userid
        };
      })
    );

    return enrichedFiles;
  }

  /**
   * Get files uploaded by specific user
   * @param {number} ownerPostgresId - PostgreSQL student.id
   * @returns {Promise<Array>} - User's uploaded files
   */
  static async getMyUploads(ownerPostgresId) {
    const { getDB } = require('../config/mongodb');
    const db = getDB();
    
    // Get user's files from MongoDB
    const files = await db.collection('libraryFiles')
      .find({ ownerPostgresId })
      .sort({ uploadedAt: -1 })
      .toArray();

    // Enrich with PostgreSQL owner info
    const ownerQuery = 'SELECT name, userid FROM students WHERE id = $1';
    const ownerResult = await pool.query(ownerQuery, [ownerPostgresId]);
    const owner = ownerResult.rows[0] || {};

    return files.map(file => {
      const fileId = file._id.toString();
      return {
        ...file,
        fileId,
        fileUrl: `/library/${fileId}/download`,
        owner_name: owner.name,
        owner_userid: owner.userid
      };
    });
  }

  /**
   * Get file by MongoDB _id
   * @param {string} fileId - MongoDB ObjectId string
   * @returns {Promise<Object>} - File metadata
   */
  static async getFileById(fileId) {
    const { getDB, ObjectId } = require('../config/mongodb');
    const db = getDB();
    
    const file = await db.collection('libraryFiles').findOne({ _id: new ObjectId(fileId) });
    if (!file) return null;

    return {
      ...file,
      fileId: file._id.toString(),
      fileUrl: `/library/${file._id.toString()}/download`
    };
  }

  /**
   * Delete library file (metadata + GridFS) if owner matches
   */
  static async deleteLibraryFile(fileId, ownerPostgresId) {
    const { getDB, ObjectId, deleteFromGridFS } = require('../config/mongodb');
    const db = getDB();

    const file = await db.collection('libraryFiles').findOne({ _id: new ObjectId(fileId) });
    if (!file) throw new Error('File not found');
    if (file.ownerPostgresId !== ownerPostgresId) throw new Error('Not authorized to delete this file');

    await deleteFromGridFS(file.gridFsFileId);
    await db.collection('libraryFiles').deleteOne({ _id: new ObjectId(fileId) });
    return { deleted: true, fileId };
  }

  /**
   * Share file with another user
   * @param {string} fileId - MongoDB file _id
   * @param {string} sharedByUserId - PostgreSQL userid of sharer
   * @param {string} sharedWithUserId - PostgreSQL userid of recipient
   * @returns {Promise<Object>} - Share record
   */
  static async shareFile(fileId, sharedByUserId, sharedWithUserId) {
    const { getDB, ObjectId } = require('../config/mongodb');
    const db = getDB();
    
    // Verify file exists in MongoDB
    const file = await db.collection('libraryFiles').findOne({ _id: new ObjectId(fileId) });
    if (!file) throw new Error('File not found');

    // Verify target user exists in PostgreSQL
    const userCheck = await pool.query('SELECT id FROM students WHERE userid = $1', [sharedWithUserId]);
    if (userCheck.rows.length === 0) throw new Error('Target user not found');

    // Check if already shared
    const existingShare = await db.collection('fileShares').findOne({
      fileId,
      sharedWithUserId
    });
    if (existingShare) throw new Error('File already shared with this user');

    // Create share record in MongoDB
    const shareDoc = {
      fileId,
      sharedByUserId,
      sharedWithUserId,
      sharedAt: new Date()
    };

    const result = await db.collection('fileShares').insertOne(shareDoc);
    return { ...shareDoc, _id: result.insertedId };
  }

  /**
   * Get files shared with a specific user
   * @param {string} userId - PostgreSQL userid
   * @returns {Promise<Array>} - Shared files with metadata
   */
  static async getSharedWithMe(userId) {
    const { getDB, ObjectId } = require('../config/mongodb');
    const db = getDB();
    
    // Get share records for this user
    const shares = await db.collection('fileShares')
      .find({ sharedWithUserId: userId })
      .sort({ sharedAt: -1 })
      .toArray();

    // Get file details and owner info
    const enrichedShares = await Promise.all(
      shares.map(async (share) => {
        const file = await db.collection('libraryFiles').findOne({ _id: new ObjectId(share.fileId) });
        if (!file) return null;

        // Get owner info from PostgreSQL
        const ownerQuery = 'SELECT name, userid FROM students WHERE id = $1';
        const ownerResult = await pool.query(ownerQuery, [file.ownerPostgresId]);
        const owner = ownerResult.rows[0] || {};

        // Get sharer info from PostgreSQL
        const sharerQuery = 'SELECT name FROM students WHERE userid = $1';
        const sharerResult = await pool.query(sharerQuery, [share.sharedByUserId]);
        const sharer = sharerResult.rows[0] || {};

        return {
          ...file,
          fileId: file._id.toString(),
          owner_name: owner.name,
          owner_userid: owner.userid,
          shared_by_name: sharer.name,
          shared_at: share.sharedAt
        };
      })
    );

    return enrichedShares.filter(item => item !== null);
  }
}

module.exports = Student;
