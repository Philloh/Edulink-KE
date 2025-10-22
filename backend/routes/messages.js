const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/messages
// @desc    Get messages for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, priority, isRead } = req.query;
    const query = { 
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id }
      ]
    };

    if (type) query.messageType = type;
    if (priority) query.priority = priority;
    if (isRead !== undefined) query.isRead = isRead === 'true';

    const messages = await Message.find(query)
      .populate('sender', 'firstName lastName email role')
      .populate('recipient', 'firstName lastName email role')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(query);

    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Messages fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages
// @desc    Send message (one-on-one or group). Group sends same message to each recipient. Supports optional threadId.
// @access  Private
router.post('/', auth, [
  body('content').notEmpty().withMessage('Content is required'),
  body('recipient').optional().isMongoId().withMessage('Recipient must be a valid user id'),
  body('recipients').optional().isArray().withMessage('Recipients must be an array of user ids'),
  body('threadId').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, recipient, recipients = [], threadId, subject, messageType = 'general', priority = 'medium', replyTo } = req.body;

    // Normalize recipients: either single recipient or array
    const recipientIds = [];
    if (recipient) recipientIds.push(recipient);
    if (Array.isArray(recipients)) recipientIds.push(...recipients);

    if (recipientIds.length === 0) {
      return res.status(400).json({ message: 'At least one recipient is required' });
    }

    // Validate recipients exist
    const users = await User.find({ _id: { $in: recipientIds } }).select('_id');
    if (users.length !== recipientIds.length) {
      return res.status(400).json({ message: 'One or more recipients not found' });
    }

    // Create messages for each recipient
    const docs = recipientIds.map(id => ({
      sender: req.user._id,
      recipient: id,
      content,
      subject: subject || 'Message',
      messageType,
      priority,
      replyTo,
      threadId
    }));

    const created = await Message.insertMany(docs);

    // Create notifications for recipients
    const notifDocs = created.map(m => ({
      user: m.recipient,
      message: `New message from ${req.user.firstName || 'a user'}`,
      type: 'update',
      meta: { messageId: m._id, threadId: m.threadId }
    }));
    if (notifDocs.length) {
      await Notification.insertMany(notifDocs);
    }

    const populated = await Message.find({ _id: { $in: created.map(m => m._id) } })
      .populate('sender', 'firstName lastName email role')
      .populate('recipient', 'firstName lastName email role');

    res.status(201).json({
      message: 'Messages sent successfully',
      count: populated.length,
      data: populated
    });
  } catch (error) {
    console.error('Message send error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/:threadId
// @desc    Fetch messages by thread
// @access  Private
router.get('/:threadId', auth, async (req, res) => {
  try {
    const { threadId } = req.params;
    if (!threadId) return res.status(400).json({ message: 'threadId is required' });

    const messages = await Message.find({ threadId })
      .sort({ createdAt: 1 })
      .populate('sender', 'firstName lastName email role')
      .populate('recipient', 'firstName lastName email role');

    res.json({ messages });
  } catch (error) {
    console.error('Thread fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/sent
// @desc    Get sent messages
// @access  Private
router.get('/sent', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const messages = await Message.find({ sender: req.user._id })
      .populate('recipient', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({ sender: req.user._id });

    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Sent messages fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/inbox
// @desc    Get received messages
// @access  Private
router.get('/inbox', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const query = { recipient: req.user._id };
    
    if (unread === 'true') {
      query.isRead = false;
    }

    const messages = await Message.find(query)
      .populate('sender', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(query);

    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Inbox fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages
// @desc    Send a new message
// @access  Private
router.post('/', auth, [
  body('recipient').isMongoId().withMessage('Valid recipient ID is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('messageType').optional().isIn(['general', 'academic', 'behavioral', 'attendance', 'emergency']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipient, subject, content, messageType = 'general', priority = 'medium', replyTo } = req.body;

    // Check if recipient exists
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(400).json({ message: 'Recipient not found' });
    }

    const message = new Message({
      sender: req.user._id,
      recipient,
      subject,
      content,
      messageType,
      priority,
      replyTo
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'firstName lastName email role')
      .populate('recipient', 'firstName lastName email role');

    res.status(201).json({
      message: 'Message sent successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Message send error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/:id
// @desc    Get a specific message
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('sender', 'firstName lastName email role')
      .populate('recipient', 'firstName lastName email role')
      .populate('replyTo');

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user has access to this message
    if (message.sender._id.toString() !== req.user._id.toString() && 
        message.recipient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark as read if user is the recipient
    if (message.recipient._id.toString() === req.user._id.toString() && !message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    res.json({ message });
  } catch (error) {
    console.error('Message fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Message read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Message.findByIdAndDelete(req.params.id);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Message delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/stats
// @desc    Get message statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const totalMessages = await Message.countDocuments({
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id }
      ]
    });

    const unreadMessages = await Message.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    const sentMessages = await Message.countDocuments({
      sender: req.user._id
    });

    res.json({
      totalMessages,
      unreadMessages,
      sentMessages
    });
  } catch (error) {
    console.error('Message stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
