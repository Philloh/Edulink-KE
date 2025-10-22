const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['document', 'video', 'audio', 'image', 'link', 'assignment', 'homework'],
    required: true
  },
  category: {
    type: String,
    enum: ['academic', 'general', 'announcement', 'homework', 'study_material'],
    required: true
  },
  subject: {
    type: String,
    trim: true
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  file: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  },
  externalUrl: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  targetAudience: {
    type: String,
    enum: ['all', 'parents', 'students', 'teachers'],
    default: 'all'
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiryDate: {
    type: Date
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }]
}, {
  timestamps: true
});

// Index for efficient queries
resourceSchema.index({ class: 1, subject: 1, category: 1 });
resourceSchema.index({ uploadedBy: 1, createdAt: -1 });
resourceSchema.index({ isActive: 1, isPublic: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
