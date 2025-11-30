require('dotenv').config({ path: __dirname + '/../.env' });
const pool = require('../config/db');

(async () => {
  try {
    const queries = [
      `ALTER TABLE students ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`,
      `ALTER TABLE students ADD COLUMN IF NOT EXISTS address VARCHAR(500)`,
      `ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE`,
      `ALTER TABLE students ADD COLUMN IF NOT EXISTS otp VARCHAR(6)`,
      `ALTER TABLE students ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP`,
      `ALTER TABLE students ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE students ADD COLUMN IF NOT EXISTS userid INTEGER UNIQUE`
    ];
    for (const q of queries) {
      await pool.query(q);
      console.log('OK:', q);
    }
    console.log('Columns ensured');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
