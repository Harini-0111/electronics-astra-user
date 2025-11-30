// Ensure dotenv loads the backend/.env when this script is run from repo root
require('dotenv').config({ path: __dirname + '/../.env' });
const pool = require('../config/db');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node getOtpAndUserid.js <email>');
  process.exit(1);
}

(async () => {
  try {
    const res = await pool.query('SELECT otp, userid FROM students WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      console.log(JSON.stringify({ error: 'not_found' }));
      process.exit(0);
    }
    const row = res.rows[0];
    console.log(JSON.stringify({ otp: row.otp, userid: row.userid }));
    process.exit(0);
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
})();
