const express = require('express');
const Progress = require('../models/Progress');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// POST /api/analysis/:studentId - Generate simple analysis report
router.post('/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    const records = await Progress.find({ student: studentId }).select('subject averageScore');
    if (!records.length) {
      return res.json({
        summary: 'No progress records found',
        weakAreas: [],
        suggestions: ['Attend revision sessions', 'Set a weekly study routine']
      });
    }

    // Compute per-subject averages
    const subjectTotals = new Map();
    const subjectCounts = new Map();
    for (const rec of records) {
      const s = rec.subject;
      subjectTotals.set(s, (subjectTotals.get(s) || 0) + (rec.averageScore || 0));
      subjectCounts.set(s, (subjectCounts.get(s) || 0) + 1);
    }
    const subjectAverages = Array.from(subjectTotals.entries()).map(([s, total]) => ({
      subject: s,
      avg: total / (subjectCounts.get(s) || 1)
    }));

    const overallAverage = subjectAverages.reduce((sum, x) => sum + x.avg, 0) / subjectAverages.length;
    const weakAreas = subjectAverages.filter(x => x.avg < overallAverage || x.avg < 50).map(x => x.subject);

    // Sample improvement tips
    const tips = [
      'Practice flashcards 15 minutes daily',
      'Complete past papers each weekend',
      'Schedule short focused study blocks (Pomodoro)',
      'Attend teacher office hours for difficult topics',
      'Form a small peer study group'
    ];

    // Build suggestions
    const suggestions = [];
    if (overallAverage < 50) suggestions.push('Focus on core concepts; review class notes daily');
    if (weakAreas.length) suggestions.push(`Allocate extra practice time to: ${weakAreas.join(', ')}`);
    suggestions.push(...tips.slice(0, 3));

    res.json({
      overallAverage: Number(overallAverage.toFixed(1)),
      perSubject: subjectAverages.map(x => ({ subject: x.subject, avg: Number(x.avg.toFixed(1)) })),
      weakAreas,
      suggestions
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


