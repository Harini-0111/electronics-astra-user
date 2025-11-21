const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const [,, email, plain] = process.argv;

if (!email || !plain) {
  console.error('Usage: node scripts/comparePassword.js <email> <password>');
  process.exit(1);
}

(async () => {
  try {
    const res = await pool.query('SELECT password FROM students WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      console.log('No user found with email:', email);
      process.exit(0);
    }
    const hash = res.rows[0].password;
    const ok = await bcrypt.compare(plain, hash);
    console.log('Email:', email);
    console.log('Password match:', ok);
    if (!ok) console.log('Note: passwords are case-sensitive and must match exactly.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
