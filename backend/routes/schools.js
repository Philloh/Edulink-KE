const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const School = require('../models/School');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/schools
// @desc    Create/register a new school
// @access  Public (schools need to be registered before users can sign up)
router.post('/', [
  body('name').notEmpty().withMessage('School name is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('type').isIn(['public', 'private']).withMessage('Type must be public or private'),
  body('emisCode').optional().isString(),
  body('contactEmail').optional().isEmail().withMessage('Invalid email'),
  body('contactPhone').optional().isString(),
  body('address').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        message: 'Database not connected. Please try again later.',
        error: 'DATABASE_UNAVAILABLE'
      });
    }

    const school = await School.create(req.body);
    res.status(201).json({ message: 'School registered successfully', data: school });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'EMIS code already exists', error: 'DUPLICATE_EMIS' });
    }
    console.error('School creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/schools
// @desc    List schools with optional filters
// @access  Public (needed for teacher signup school selection)
router.get('/', async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        message: 'Database not connected. Please try again later.',
        error: 'DATABASE_UNAVAILABLE'
      });
    }

    const { q, type } = req.query;
    const filter = { isActive: true };
    if (type && ['public', 'private'].includes(type)) filter.type = type;
    if (q) filter.name = { $regex: q, $options: 'i' };
    const schools = await School.find(filter).sort({ name: 1 }).limit(200);
    res.json({ message: 'Schools fetched', data: schools });
  } catch (error) {
    console.error('School list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


