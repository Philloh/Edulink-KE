const express = require('express');
const { body, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/notifications - Send notification
router.post('/', auth, [
  body('userId').isMongoId().withMessage('Valid userId is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').optional().isIn(['alert', 'update'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, message, type = 'update', meta } = req.body;
    const notif = await Notification.create({ user: userId, message, type, meta });
    res.status(201).json({ message: 'Notification sent', data: notif });
  } catch (error) {
    console.error('Notification send error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/notifications/:userId - List unread notifications for a user
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ user: userId, read: false })
      .sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (error) {
    console.error('Notification list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


