const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const School = require('../models/School');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user with role
// @access  Public
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['parent', 'teacher', 'student']).withMessage('Invalid role'),
  body('schoolId').notEmpty().withMessage('School ID is required'),
  body('phone').optional().isMobilePhone(),
  body('childId').optional().isArray().withMessage('Child ID must be an array')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { name, email, password, role, schoolId, phone, childId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        message: 'User already exists with this email',
        error: 'EMAIL_EXISTS'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      schoolId,
      phone,
      childId: childId || []
    });

    // Save user (password will be hashed automatically by pre-save middleware)
    const savedUser = await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: savedUser._id,
        email: savedUser.email,
        role: savedUser.role 
      },
      process.env.JWT_SECRET || 'fallback_jwt_secret',
      { expiresIn: '7d' }
    );

    // Return user data (password excluded by toJSON method)
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: savedUser.toJSON()
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Email already exists',
        error: 'DUPLICATE_EMAIL'
      });
    }

    res.status(500).json({ 
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/auth/teacher/verify
// @desc    Step 1: Verify teacher basic details
// @access  Public
// Remove earlier duplicate simplistic verify handler

// @route   POST /api/auth/teacher/complete
// @desc    Step 2: Complete teacher signup profile
// @access  Public
router.post('/teacher/complete', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('schoolId').notEmpty(),
  body('tscNumber').notEmpty(),
  body('class').notEmpty(),
  body('subjects').isArray({ min: 1 }),
  body('username').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, email, password, schoolId, tscNumber, class: teacherClass, subjects, username } = req.body;

    // Unique checks
    const [emailUsed, usernameUsed, tscUsed] = await Promise.all([
      User.findOne({ email }),
      User.findOne({ username }),
      User.findOne({ tscNumber, role: 'teacher' }),
    ]);

    if (emailUsed) return res.status(409).json({ message: 'Email already in use', error: 'EMAIL_EXISTS' });
    if (usernameUsed) return res.status(409).json({ message: 'Username already in use', error: 'USERNAME_EXISTS' });
    if (tscUsed) return res.status(409).json({ message: 'TSC number already in use', error: 'TSC_IN_USE' });

    const teacher = new User({
      name,
      email,
      password,
      role: 'teacher',
      schoolId,
      class: teacherClass,
      subjects,
      username,
      tscNumber,
    });

    const saved = await teacher.save();

    const token = jwt.sign(
      { userId: saved._id, email: saved.email, role: saved.role },
      process.env.JWT_SECRET || 'fallback_jwt_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({ message: 'Teacher account created', token, user: saved.toJSON() });
  } catch (error) {
    console.error('Teacher complete error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate field', error: 'DUPLICATE' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user and return JWT token
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account is deactivated',
        error: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Check password using bcrypt compare
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id,
          email: user.email,
          role: user.role 
        },
      process.env.JWT_SECRET || 'fallback_jwt_secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/auth/verify-token
// @desc    Verify JWT token
// @access  Public
router.post('/verify-token', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        message: 'Token is required',
        error: 'MISSING_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_jwt_secret');
    res.json({
      message: 'Token is valid',
      decoded
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired',
        error: 'TOKEN_EXPIRED'
      });
    }

    res.status(500).json({
      message: 'Server error during token verification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/auth/teacher/verify
// @desc    Step 1: Verify teacher details (name, school, TSC number)
// @access  Public
router.post('/teacher/verify', [
  body('name').notEmpty().withMessage('Name is required'),
  body('schoolId').notEmpty().withMessage('School ID is required'),
  body('tscNumber').notEmpty().withMessage('TSC number is required'),
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        message: 'Database not connected. Please try again later.',
        error: 'DATABASE_UNAVAILABLE'
      });
    }

    const { name, schoolId, tscNumber, email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        message: 'User already exists with this email',
        error: 'EMAIL_EXISTS'
      });
    }

    // Check if TSC number already exists
    const existingTsc = await User.findOne({ tscNumber });
    if (existingTsc) {
      return res.status(409).json({ 
        message: 'TSC number already registered',
        error: 'TSC_EXISTS'
      });
    }

    // Verify that the school exists and is active
    const school = await School.findOne({ _id: schoolId, isActive: true });
    if (!school) {
      return res.status(400).json({ 
        message: 'Selected school does not exist or is not active',
        error: 'INVALID_SCHOOL'
      });
    }

    // For now, we'll create a temporary verification record
    // In a real system, you'd verify against TSC database
    const verificationData = {
      name,
      schoolId,
      tscNumber,
      email,
      verified: true, // In real system, this would be false until verified
      verificationToken: jwt.sign(
        { name, email, schoolId, tscNumber, type: 'teacher_verification' },
        process.env.JWT_SECRET || 'fallback_jwt_secret',
        { expiresIn: '1h' }
      )
    };

    res.json({
      message: 'Teacher verification successful',
      data: verificationData
    });

  } catch (error) {
    console.error('Teacher verification error:', error);
    res.status(500).json({ 
      message: 'Server error during verification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/auth/teacher/complete
// @desc    Step 2: Complete teacher registration with profile details
// @access  Public
router.post('/teacher/complete', [
  body('verificationToken').notEmpty().withMessage('Verification token is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        message: 'Database not connected. Please try again later.',
        error: 'DATABASE_UNAVAILABLE'
      });
    }

    const { verificationToken, username, password, class: userClass, subjects, phone } = req.body;

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(verificationToken, process.env.JWT_SECRET || 'fallback_jwt_secret');
    } catch (error) {
      return res.status(401).json({ 
        message: 'Invalid or expired verification token',
        error: 'INVALID_TOKEN'
      });
    }

    if (decoded.type !== 'teacher_verification') {
      return res.status(401).json({ 
        message: 'Invalid token type',
        error: 'INVALID_TOKEN_TYPE'
      });
    }

    // Verify that the school still exists and is active
    const school = await School.findOne({ _id: decoded.schoolId, isActive: true });
    if (!school) {
      return res.status(400).json({ 
        message: 'Selected school no longer exists or is not active',
        error: 'INVALID_SCHOOL'
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ 
        message: 'Username already taken',
        error: 'USERNAME_EXISTS'
      });
    }

    // Create the complete user
    const user = new User({
      name: decoded.name,
      email: decoded.email,
      username,
      password,
      role: 'teacher',
      schoolId: decoded.schoolId,
      tscNumber: decoded.tscNumber,
      class: userClass || undefined,
      subjects: Array.isArray(subjects) ? subjects : undefined,
      phone
    });

    const savedUser = await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: savedUser._id,
        email: savedUser.email,
        role: savedUser.role 
      },
      process.env.JWT_SECRET || 'fallback_jwt_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Teacher registration completed successfully',
      token,
      user: savedUser.toJSON()
    });

  } catch (error) {
    console.error('Teacher completion error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Username or TSC number already exists',
        error: 'DUPLICATE_FIELD'
      });
    }

    res.status(500).json({ 
      message: 'Server error during completion',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;