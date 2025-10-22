const express = require('express');
const { body, validationResult } = require('express-validator');
const Progress = require('../models/Progress');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/progress
// @desc    Get progress records
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { student, subject, term, year, class: userClass } = req.query;
    let query = {};

    if (req.user.role === 'student') {
      query.student = req.user._id;
    } else if (req.user.role === 'parent') {
      // Get progress for parent's children
      const children = await User.find({ _id: { $in: req.user.parentOf } });
      query.student = { $in: children.map(child => child._id) };
    } else if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    }

    if (student) query.student = student;
    if (subject) query.subject = subject;
    if (term) query.term = term;
    if (year) query.year = year;
    if (userClass) query.class = userClass;

    const progress = await Progress.find(query)
      .populate('student', 'firstName lastName email class studentId')
      .populate('teacher', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ progress });
  } catch (error) {
    console.error('Progress fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/progress
// @desc    Create progress record
// @access  Private (Teachers only)
router.post('/', auth, authorize('teacher'), [
  body('student').isMongoId().withMessage('Valid student ID is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('term').isIn(['Term 1', 'Term 2', 'Term 3']).withMessage('Invalid term'),
  body('class').notEmpty().withMessage('Class is required'),
  body('assessments').isArray().withMessage('Assessments must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { student, subject, term, year, class: userClass, assessments, attendance, behavior, teacherComments } = req.body;

    // Check if student exists
    const studentUser = await User.findById(student);
    if (!studentUser || studentUser.role !== 'student') {
      return res.status(400).json({ message: 'Student not found' });
    }

    // Calculate average score
    let averageScore = 0;
    if (assessments && assessments.length > 0) {
      const totalScore = assessments.reduce((sum, assessment) => sum + assessment.score, 0);
      averageScore = totalScore / assessments.length;
    }

    // Determine overall grade
    let overallGrade = 'F';
    if (averageScore >= 80) overallGrade = 'A';
    else if (averageScore >= 70) overallGrade = 'B';
    else if (averageScore >= 60) overallGrade = 'C';
    else if (averageScore >= 50) overallGrade = 'D';

    const progress = new Progress({
      student,
      teacher: req.user._id,
      subject,
      term,
      year: year || new Date().getFullYear(),
      class: userClass,
      assessments,
      averageScore,
      overallGrade,
      attendance: attendance || { present: 0, absent: 0, late: 0 },
      behavior: behavior || { rating: 3, comments: '', improvements: [], strengths: [] },
      teacherComments
    });

    await progress.save();

    const populatedProgress = await Progress.findById(progress._id)
      .populate('student', 'firstName lastName email class studentId')
      .populate('teacher', 'firstName lastName email');

    res.status(201).json({
      message: 'Progress record created successfully',
      data: populatedProgress
    });
  } catch (error) {
    console.error('Progress creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/progress/simple
// @desc    Create simple progress entry from (studentId, subject, score, notes, date)
// @access  Private (Teachers only)
router.post('/simple', auth, authorize('teacher'), [
  body('studentId').isMongoId().withMessage('Valid student ID is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('score').isFloat({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  body('date').optional().isISO8601().toDate(),
  body('notes').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, subject, score, notes, date } = req.body;

    // Verify student exists and is role student
    const studentUser = await User.findById(studentId);
    if (!studentUser || studentUser.role !== 'student') {
      return res.status(400).json({ message: 'Student not found' });
    }

    // Build a minimal assessments array
    const assessment = {
      name: 'Assessment',
      score: Number(score),
      maxScore: 100,
      date: date ? new Date(date) : new Date(),
      type: 'test',
      comments: notes || ''
    };

    // Compute average and grade
    const averageScore = assessment.score;
    let overallGrade = 'F';
    if (averageScore >= 80) overallGrade = 'A';
    else if (averageScore >= 70) overallGrade = 'B';
    else if (averageScore >= 60) overallGrade = 'C';
    else if (averageScore >= 50) overallGrade = 'D';

    const progress = new Progress({
      student: studentId,
      teacher: req.user._id,
      subject,
      term: 'Term 1',
      year: new Date().getFullYear(),
      class: studentUser.class || 'N/A',
      assessments: [assessment],
      averageScore,
      overallGrade,
      teacherComments: notes || ''
    });

    await progress.save();

    const populated = await Progress.findById(progress._id)
      .populate('student', 'firstName lastName email class studentId')
      .populate('teacher', 'firstName lastName email');

    res.status(201).json({ message: 'Progress entry created', data: populated });
  } catch (error) {
    console.error('Progress simple create error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/progress/student/:studentId
// @desc    Fetch student history with chart-ready data
// @access  Private
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;

    const records = await Progress.find({ student: studentId })
      .sort({ createdAt: 1 })
      .select('subject assessments averageScore createdAt');

    // Build chart data: timeseries per subject and overall timeline
    const subjects = {};
    const timeline = [];

    for (const rec of records) {
      const date = rec.createdAt;
      // Use averageScore as point; also include each assessment point
      if (!subjects[rec.subject]) subjects[rec.subject] = [];
      subjects[rec.subject].push({ date, score: rec.averageScore || 0 });

      timeline.push({ date, score: rec.averageScore || 0 });
    }

    // Compute overall average and per-subject average
    const subjectAverages = Object.fromEntries(
      Object.entries(subjects).map(([subj, arr]) => {
        const avg = arr.length ? (arr.reduce((s, p) => s + p.score, 0) / arr.length) : 0;
        return [subj, Number(avg.toFixed(1))];
      })
    );
    const overallAverage = timeline.length ? Number((timeline.reduce((s, p) => s + p.score, 0) / timeline.length).toFixed(1)) : 0;

    res.json({
      records,
      charts: {
        subjects,
        timeline,
        subjectAverages,
        overallAverage,
      }
    });
  } catch (error) {
    console.error('Progress history fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/progress/:id
// @desc    Update progress record
// @access  Private (Teachers only)
router.put('/:id', auth, authorize('teacher'), async (req, res) => {
  try {
    const progress = await Progress.findById(req.params.id);

    if (!progress) {
      return res.status(404).json({ message: 'Progress record not found' });
    }

    if (progress.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { assessments, attendance, behavior, teacherComments } = req.body;

    // Update assessments if provided
    if (assessments) {
      progress.assessments = assessments;
      
      // Recalculate average score
      if (assessments.length > 0) {
        const totalScore = assessments.reduce((sum, assessment) => sum + assessment.score, 0);
        progress.averageScore = totalScore / assessments.length;
        
        // Update overall grade
        if (progress.averageScore >= 80) progress.overallGrade = 'A';
        else if (progress.averageScore >= 70) progress.overallGrade = 'B';
        else if (progress.averageScore >= 60) progress.overallGrade = 'C';
        else if (progress.averageScore >= 50) progress.overallGrade = 'D';
        else progress.overallGrade = 'F';
      }
    }

    if (attendance) progress.attendance = { ...progress.attendance, ...attendance };
    if (behavior) progress.behavior = { ...progress.behavior, ...behavior };
    if (teacherComments) progress.teacherComments = teacherComments;

    await progress.save();

    const updatedProgress = await Progress.findById(progress._id)
      .populate('student', 'firstName lastName email class studentId')
      .populate('teacher', 'firstName lastName email');

    res.json({
      message: 'Progress record updated successfully',
      data: updatedProgress
    });
  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/progress/:id/publish
// @desc    Publish progress record
// @access  Private (Teachers only)
router.put('/:id/publish', auth, authorize('teacher'), async (req, res) => {
  try {
    const progress = await Progress.findById(req.params.id);

    if (!progress) {
      return res.status(404).json({ message: 'Progress record not found' });
    }

    if (progress.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    progress.isPublished = true;
    progress.publishedAt = new Date();
    await progress.save();

    res.json({ message: 'Progress record published successfully' });
  } catch (error) {
    console.error('Progress publish error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/progress/:id/feedback
// @desc    Add parent feedback
// @access  Private (Parents only)
router.post('/:id/feedback', auth, authorize('parent'), [
  body('parentFeedback').notEmpty().withMessage('Parent feedback is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const progress = await Progress.findById(req.params.id);

    if (!progress) {
      return res.status(404).json({ message: 'Progress record not found' });
    }

    // Check if parent has access to this student's progress
    const student = await User.findById(progress.student);
    if (!student || !req.user.parentOf.includes(student._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    progress.parentFeedback = req.body.parentFeedback;
    await progress.save();

    res.json({ message: 'Parent feedback added successfully' });
  } catch (error) {
    console.error('Parent feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/progress/:id
// @desc    Get specific progress record
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const progress = await Progress.findById(req.params.id)
      .populate('student', 'firstName lastName email class studentId')
      .populate('teacher', 'firstName lastName email');

    if (!progress) {
      return res.status(404).json({ message: 'Progress record not found' });
    }

    // Check access permissions
    if (req.user.role === 'student' && progress.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'parent') {
      const student = await User.findById(progress.student);
      if (!student || !req.user.parentOf.includes(student._id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (req.user.role === 'teacher' && progress.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ progress });
  } catch (error) {
    console.error('Progress fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/progress/stats/overview
// @desc    Get progress statistics
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      query.student = req.user._id;
    } else if (req.user.role === 'parent') {
      const children = await User.find({ _id: { $in: req.user.parentOf } });
      query.student = { $in: children.map(child => child._id) };
    } else if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    }

    const totalRecords = await Progress.countDocuments(query);
    const publishedRecords = await Progress.countDocuments({ ...query, isPublished: true });
    const averageScore = await Progress.aggregate([
      { $match: query },
      { $group: { _id: null, avgScore: { $avg: '$averageScore' } } }
    ]);

    res.json({
      totalRecords,
      publishedRecords,
      averageScore: averageScore[0]?.avgScore || 0
    });
  } catch (error) {
    console.error('Progress stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
