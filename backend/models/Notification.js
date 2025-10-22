const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['alert', 'update'], default: 'update' },
  read: { type: Boolean, default: false },
  meta: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);


