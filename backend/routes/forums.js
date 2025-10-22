const express = require('express');
const { body, validationResult } = require('express-validator');
const Forum = require('../models/Forum');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/forums - Create forum post (supports anonymous)
router.post('/', auth, [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('isAnonymous').optional().isBoolean(),
  body('schoolId').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, isAnonymous = false, schoolId } = req.body;
    const post = await Forum.create({
      title,
      content,
      isAnonymous,
      schoolId,
      author: req.user._id,
    });

    const populated = await Forum.findById(post._id)
      .populate('author', 'firstName lastName email role');

    res.status(201).json({ message: 'Forum post created', data: populated });
  } catch (error) {
    console.error('Forum create error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/forums - List forums with optional filters (schoolId)
router.get('/', auth, async (req, res) => {
  try {
    const { schoolId } = req.query;
    const filter = {};
    if (schoolId) filter.schoolId = schoolId;

    const forums = await Forum.find(filter)
      .sort({ createdAt: -1 })
      .populate('author', 'firstName lastName email role');

    res.json({ forums });
  } catch (error) {
    console.error('Forum list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


