require('dotenv').config();

const vars = [
  'PG_HOST', 'PG_PORT', 'PG_DATABASE', 'PG_USER', 'PG_PASSWORD',
  'PORT', 'JWT_SECRET', 'MONGO_URI', 'EMAIL_USER', 'EMAIL_PASS'
];

console.log('Loaded environment variables (from backend/.env):');
vars.forEach((v) => {
  const val = process.env[v];
  if (val === undefined) {
    console.log(`${v}=<undefined>`);
    return;
  }
  if (v === 'PG_PASSWORD' || v === 'EMAIL_PASS' || v === 'JWT_SECRET') {
    // Print masked value and char codes for debugging
    const masked = val.length > 4 ? val.slice(0, 2) + '*'.repeat(Math.max(0, val.length - 4)) + val.slice(-2) : '*'.repeat(val.length);
    const codes = Array.from(val).map(c => c.charCodeAt(0)).join(' ');
    console.log(`${v}=${masked}  (length=${val.length})`);
    console.log(`  charCodes: ${codes}`);
  } else {
    console.log(`${v}=${val}`);
  }
});

// Quick check for non-ASCII or NBSP in PG_PASSWORD
const pw = process.env.PG_PASSWORD || '';
const hasNonAscii = Array.from(pw).some(c => c.charCodeAt(0) > 127);
if (hasNonAscii) {
  console.warn('\nWarning: PG_PASSWORD contains non-ASCII characters (possible non-breaking spaces).');
}
