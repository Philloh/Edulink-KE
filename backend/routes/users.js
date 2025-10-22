const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/:id
// @desc    Fetch user profile by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid user ID format',
        error: 'INVALID_ID'
      });
    }

    // Find user by ID (exclude password)
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        message: 'User account is deactivated',
        error: 'USER_DEACTIVATED'
      });
    }

    res.json({
      message: 'User profile retrieved successfully',
      user
    });

  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({
      message: 'Server error while fetching user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      message: 'Profile retrieved successfully',
      user: req.user
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      message: 'Server error while fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('schoolId').optional().notEmpty().withMessage('School ID cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, phone, schoolId, class: userClass } = req.body;
    const updateData = {};

    // Build update object with only provided fields
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (schoolId) updateData.schoolId = schoolId;
    if (userClass) updateData.class = userClass;

    // Prevent updating email to existing email
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(409).json({
          message: 'Email already exists',
          error: 'DUPLICATE_EMAIL'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
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
      message: 'Server error during profile update',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/users/search
// @desc    Search users by name or email
// @access  Private
router.get('/search', auth, [
  body('query').notEmpty().withMessage('Search query is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { query, role } = req.query;

    // Build search filter
    const searchFilter = {
      isActive: true,
      _id: { $ne: req.user._id } // Exclude current user
    };

    // Add role filter if provided
    if (role && ['parent', 'teacher', 'student'].includes(role)) {
      searchFilter.role = role;
    }

    // Add text search for name or email
    if (query) {
      searchFilter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ];
    }

    const users = await User.find(searchFilter)
      .select('-password')
      .limit(20) // Limit results
      .sort({ name: 1 });

    res.json({
      message: 'Users search completed',
      count: users.length,
      users
    });

  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({
      message: 'Server error during user search',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/users/school/:schoolId
// @desc    Get all users in a specific school
// @access  Private (teachers and admins only)
router.get('/school/:schoolId', auth, authorize(['teacher', 'admin']), async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { role } = req.query;

    const filter = {
      schoolId,
      isActive: true,
      _id: { $ne: req.user._id }
    };

    // Add role filter if provided
    if (role && ['parent', 'teacher', 'student'].includes(role)) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ role: 1, name: 1 });

    res.json({
      message: 'School users retrieved successfully',
      count: users.length,
      schoolId,
      users
    });

  } catch (error) {
    console.error('School users fetch error:', error);
    res.status(500).json({
      message: 'Server error while fetching school users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Deactivate user account (soft delete)
// @access  Private (admin only)
router.delete('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid user ID format',
        error: 'INVALID_ID'
      });
    }

    // Prevent self-deletion
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        message: 'Cannot deactivate your own account',
        error: 'SELF_DEACTIVATION_NOT_ALLOWED'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Soft delete - deactivate instead of hard delete
    user.isActive = false;
    await user.save();

    res.json({
      message: 'User account deactivated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: false
      }
    });

  } catch (error) {
    console.error('User deactivation error:', error);
    res.status(500).json({
      message: 'Server error during user deactivation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;