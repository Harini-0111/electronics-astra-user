const pool = require('../config/db');

(async () => {
  try {
    const result = await pool.query("SELECT id, name, email, password, is_verified, created_at FROM students ORDER BY created_at DESC LIMIT 20");
    console.log('Found', result.rows.length, 'rows:');
    console.table(result.rows.map(r => ({ id: r.id, name: r.name, email: r.email, is_verified: r.is_verified, created_at: r.created_at })));
    // print hashed passwords separately for debugging (do NOT commit these values)
    console.log('\nHashed passwords (for debugging):');
    result.rows.forEach(r => console.log(r.email + ' -> ' + (r.password ? r.password : '<no password>')));
    process.exit(0);
  } catch (err) {
    console.error('Error querying students table:', err.message || err);
    process.exit(1);
  }
})();
