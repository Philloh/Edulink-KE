const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  term: {
    type: String,
    required: true,
    enum: ['Term 1', 'Term 2', 'Term 3']
  },
  year: {
    type: Number,
    required: true,
    default: new Date().getFullYear()
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  assessments: [{
    name: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    maxScore: {
      type: Number,
      default: 100
    },
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['quiz', 'test', 'exam', 'assignment', 'project'],
      required: true
    },
    comments: String
  }],
  overallGrade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'F', 'P', 'F'],
    default: null
  },
  averageScore: {
    type: Number,
    min: 0,
    max: 100
  },
  attendance: {
    present: {
      type: Number,
      default: 0
    },
    absent: {
      type: Number,
      default: 0
    },
    late: {
      type: Number,
      default: 0
    }
  },
  behavior: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    comments: String,
    improvements: [String],
    strengths: [String]
  },
  teacherComments: {
    type: String,
    maxlength: 1000
  },
  parentFeedback: {
    type: String,
    maxlength: 1000
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
progressSchema.index({ student: 1, subject: 1, term: 1, year: 1 });
progressSchema.index({ teacher: 1, class: 1 });

module.exports = mongoose.model('Progress', progressSchema);
