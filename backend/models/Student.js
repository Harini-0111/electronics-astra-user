const pool = require('../config/db');

class Student {
  // Create the students table (if it doesn't exist)
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
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
    } catch (err) {
      console.error('Error creating students table:', err);
    }
  }

  // Register a new student (store with OTP) — supports optional phone/address/date_of_birth
  static async register(name, email, hashedPassword, otp, otpExpiry, phone = null, address = null, date_of_birth = null) {
    const query = `
      INSERT INTO students (name, email, password, phone, address, date_of_birth, otp, otp_expiry, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)
      RETURNING id, name, email, phone, address, date_of_birth, is_verified
    `;
    try {
      const result = await pool.query(query, [name, email, hashedPassword, phone, address, date_of_birth, otp, otpExpiry]);
      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') { // Unique constraint violation
        throw new Error('Email already registered');
      }
      throw err;
    }
  }

  // Find student by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM students WHERE email = $1';
    const result = await pool.query(query, [email]);
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

  // Check if email exists
  static async emailExists(email) {
    const query = 'SELECT id FROM students WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows.length > 0;
  }

  // Get profile (all fields)
  static async getProfile(id) {
    const query = `
      SELECT id, name, email, phone, address, date_of_birth, is_verified, created_at, updated_at
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
}

module.exports = Student;
