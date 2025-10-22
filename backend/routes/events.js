const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/events - Create event
router.post('/', auth, [
  body('title').notEmpty().withMessage('Title is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('attendees').optional().isArray(),
  body('schoolId').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, date, description, schoolId, attendees = [] } = req.body;
    const event = await Event.create({
      title,
      date: new Date(date),
      description,
      schoolId,
      attendees,
      createdBy: req.user._id,
    });

    // Notify attendees
    if (attendees.length > 0) {
      const notifications = attendees.map(userId => ({
        user: userId,
        message: `New event: ${title}`,
        type: 'update',
        meta: { eventId: event._id, schoolId }
      }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json({ message: 'Event created', data: event });
  } catch (error) {
    console.error('Event create error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/events - Fetch by school/user
router.get('/', auth, async (req, res) => {
  try {
    const { schoolId, mine } = req.query;
    const filter = {};
    if (schoolId) filter.schoolId = schoolId;
    if (mine === 'true') filter.attendees = req.user._id;

    const events = await Event.find(filter)
      .sort({ date: 1 })
      .populate('attendees', 'firstName lastName email role')
      .populate('createdBy', 'firstName lastName email role');

    res.json({ events });
  } catch (error) {
    console.error('Event fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


