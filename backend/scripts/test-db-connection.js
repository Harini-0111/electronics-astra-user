const pool = require('../config/db');

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Postgres connected. Server time:', res.rows[0].now);
    process.exit(0);
  } catch (err) {
    console.error('Postgres connection failed:', err.message || err);
    process.exit(1);
  }
})();
