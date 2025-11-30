require('dotenv').config({ path: __dirname + '/../.env' });
const Student = require('../models/Student');

(async () => {
  try {
    const name = 'UI Debug';
    const email = 'debug+' + Date.now() + '@example.test';
    const hashedPassword = 'hashedpassword';
    const otp = '000000';
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const result = await Student.register(name, email, hashedPassword, otp, otpExpiry, null, null, null);
    console.log('REGISTERED:', JSON.stringify(result));
  } catch (err) {
    console.error('REGISTER ERROR:');
    console.error(err && err.stack ? err.stack : err);
  }
})();
