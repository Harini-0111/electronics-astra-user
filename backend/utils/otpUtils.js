// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate OTP expiry time (10 minutes from now)
const generateOTPExpiry = () => {
  const now = new Date();
  return new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
};

module.exports = {
  generateOTP,
  generateOTPExpiry,
};
