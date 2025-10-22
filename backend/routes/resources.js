const express = require('express');
const { body, validationResult } = require('express-validator');
const Resource = require('../models/Resource');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/resources
// @desc    Get resources
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      category, 
      subject, 
      class: userClass,
      targetAudience,
      search 
    } = req.query;

    let query = { isActive: true };

    // Filter by class
    if (userClass) {
      query.class = userClass;
    } else if (req.user.role === 'student') {
      query.class = req.user.class;
    }

    // Filter by type
    if (type) query.type = type;

    // Filter by category
    if (category) query.category = category;

    // Filter by subject
    if (subject) query.subject = subject;

    // Filter by target audience
    if (targetAudience) {
      query.targetAudience = { $in: [targetAudience, 'all'] };
    } else {
      // Default audience filtering based on user role
      if (req.user.role === 'student') {
        query.targetAudience = { $in: ['students', 'all'] };
      } else if (req.user.role === 'parent') {
        query.targetAudience = { $in: ['parents', 'all'] };
      } else if (req.user.role === 'teacher') {
        query.targetAudience = { $in: ['teachers', 'all'] };
      }
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const resources = await Resource.find(query)
      .populate('uploadedBy', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Resource.countDocuments(query);

    res.json({
      resources,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Resources fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/resources
// @desc    Create a new resource
// @access  Private (Teachers only)
router.post('/', auth, authorize('teacher'), [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('type').isIn(['document', 'video', 'audio', 'image', 'link', 'assignment', 'homework']).withMessage('Invalid type'),
  body('category').isIn(['academic', 'general', 'announcement', 'homework', 'study_material']).withMessage('Invalid category'),
  body('class').notEmpty().withMessage('Class is required'),
  body('subject').optional().notEmpty().withMessage('Subject cannot be empty'),
  body('targetAudience').optional().isIn(['all', 'parents', 'students', 'teachers']).withMessage('Invalid target audience')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      type,
      category,
      subject,
      class: userClass,
      targetAudience = 'all',
      tags = [],
      externalUrl,
      file,
      attachments = []
    } = req.body;

    const resource = new Resource({
      title,
      description,
      type,
      category,
      subject,
      class: userClass,
      uploadedBy: req.user._id,
      targetAudience,
      tags,
      externalUrl,
      file,
      attachments
    });

    await resource.save();

    const populatedResource = await Resource.findById(resource._id)
      .populate('uploadedBy', 'firstName lastName email role');

    res.status(201).json({
      message: 'Resource created successfully',
      data: populatedResource
    });
  } catch (error) {
    console.error('Resource creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/resources/:id
// @desc    Get a specific resource
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName email role');

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (!resource.isActive) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Check access permissions
    if (resource.targetAudience !== 'all') {
      if (req.user.role === 'student' && resource.targetAudience !== 'students') {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (req.user.role === 'parent' && resource.targetAudience !== 'parents') {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (req.user.role === 'teacher' && resource.targetAudience !== 'teachers') {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Increment view count
    resource.viewCount += 1;
    await resource.save();

    res.json({ resource });
  } catch (error) {
    console.error('Resource fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/resources/:id
// @desc    Update a resource
// @access  Private (Teachers only)
router.put('/:id', auth, authorize('teacher'), async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (resource.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      title,
      description,
      type,
      category,
      subject,
      class: userClass,
      targetAudience,
      tags,
      externalUrl,
      file,
      attachments,
      isActive
    } = req.body;

    if (title) resource.title = title;
    if (description) resource.description = description;
    if (type) resource.type = type;
    if (category) resource.category = category;
    if (subject) resource.subject = subject;
    if (userClass) resource.class = userClass;
    if (targetAudience) resource.targetAudience = targetAudience;
    if (tags) resource.tags = tags;
    if (externalUrl) resource.externalUrl = externalUrl;
    if (file) resource.file = file;
    if (attachments) resource.attachments = attachments;
    if (isActive !== undefined) resource.isActive = isActive;

    await resource.save();

    const updatedResource = await Resource.findById(resource._id)
      .populate('uploadedBy', 'firstName lastName email role');

    res.json({
      message: 'Resource updated successfully',
      data: updatedResource
    });
  } catch (error) {
    console.error('Resource update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/resources/:id
// @desc    Delete a resource
// @access  Private (Teachers only)
router.delete('/:id', auth, authorize('teacher'), async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (resource.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    resource.isActive = false;
    await resource.save();

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Resource delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/resources/categories
// @desc    Get resource categories
// @access  Private
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await Resource.distinct('category', { isActive: true });
    const types = await Resource.distinct('type', { isActive: true });
    const subjects = await Resource.distinct('subject', { isActive: true });

    res.json({
      categories,
      types,
      subjects
    });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/resources/stats/overview
// @desc    Get resource statistics
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    let query = { isActive: true };

    if (req.user.role === 'teacher') {
      query.uploadedBy = req.user._id;
    }

    const totalResources = await Resource.countDocuments(query);
    const totalViews = await Resource.aggregate([
      { $match: query },
      { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
    ]);
    const totalDownloads = await Resource.aggregate([
      { $match: query },
      { $group: { _id: null, totalDownloads: { $sum: '$downloadCount' } } }
    ]);

    res.json({
      totalResources,
      totalViews: totalViews[0]?.totalViews || 0,
      totalDownloads: totalDownloads[0]?.totalDownloads || 0
    });
  } catch (error) {
    console.error('Resource stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
