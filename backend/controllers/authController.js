const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const { generateOTP, generateOTPExpiry } = require('../utils/otpUtils');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send OTP via email
const sendOTPEmail = async (email, otp, name) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Registration - Electronics Astra',
      html: `
        <h2>Welcome to Electronics Astra, ${name}!</h2>
        <p>Your One-Time Password (OTP) for email verification is:</p>
        <h3 style="color: #007bff; font-size: 24px; letter-spacing: 2px;">${otp}</h3>
        <p>This OTP is valid for <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <p><small>Do not share your OTP with anyone.</small></p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('✓ OTP sent to', email);
      return true;
    } catch (err) {
      // Do not throw — store OTP in DB and allow registration to succeed.
      console.error('Warning: failed to send OTP email:', err && err.message ? err.message : err);
      console.error('OTP was stored in DB; use dev helper to read it or configure SMTP.');
      return false;
    }
  } catch (err) {
    // Shouldn't reach here, but log defensively
    console.error('Unexpected error preparing OTP email:', err);
    return false;
  }
};

// Register a new student
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address, date_of_birth } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    // Check if email already exists
    const existingStudent = await Student.findByEmail(email);
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = generateOTPExpiry();

    // Register student with OTP (store optional profile fields)
    const student = await Student.register(name, email, hashedPassword, otp, otpExpiry, phone || null, address || null, date_of_birth || null);

    // Send OTP via email
    await sendOTPEmail(email, otp, name);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Check your email for OTP.',
      data: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        address: student.address,
        date_of_birth: student.date_of_birth,
        isVerified: student.is_verified,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Registration failed',
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validation
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP',
      });
    }

    // Verify OTP
    const student = await Student.verifyOTP(email, otp);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now login.',
      data: {
        id: student.id,
        name: student.name,
        email: student.email,
        isVerified: student.is_verified,
      },
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'OTP verification failed',
    });
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email',
      });
    }

    // Find student
    const student = await Student.findByEmail(email);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Check if already verified
    if (student.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified',
      });
    }

    // Generate new OTP
    const newOtp = generateOTP();
    const newOtpExpiry = generateOTPExpiry();

    // Update OTP in database
    await Student.resendOTP(email, newOtp, newOtpExpiry);

    // Send OTP via email
    await sendOTPEmail(email, newOtp, student.name);

    return res.status(200).json({
      success: true,
      message: 'OTP resent successfully! Check your email.',
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to resend OTP',
    });
  }
};

// Login (after verification)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find student
    const student = await Student.findByEmail(email);
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if verified
    if (!student.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first',
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, student.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }


    // Create server-side session (store minimal info including userid)
    req.session.user = { id: student.id, email: student.email, name: student.name, userid: student.userid };

    return res.status(200).json({
      success: true,
      message: 'Login successful, session created',
      data: {
        id: student.id,
        userid: student.userid,
        name: student.name,
        email: student.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
};
