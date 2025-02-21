const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Recording = require('../models/Recording');

// @route   GET api/dashboard/progress
// @desc    Get user's progress data
// @access  Private
router.get('/progress', auth, async (req, res) => {
  try {
    const recordings = await Recording.find({ user: req.user.id })
      .sort({ createdAt: 1 })
      .select('createdAt analysis');

    // Process recordings to extract progress data
    const progressData = {
      dates: [],
      scores: {
        clarity: [],
        fluency: [],
        confidence: []
      }
    };

    recordings.forEach(recording => {
      progressData.dates.push(
        new Date(recording.createdAt).toLocaleDateString()
      );
      
      if (recording.analysis) {
        progressData.scores.clarity.push(recording.analysis.clarity.score * 100);
        progressData.scores.fluency.push(recording.analysis.fluency.score * 100);
        progressData.scores.confidence.push(recording.analysis.confidence.score * 100);
      }
    });

    res.json(progressData);
  } catch (err) {
    console.error('Error fetching progress data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/dashboard/stats
// @desc    Get user's statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const recordings = await Recording.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalRecordings = recordings.length;
    let totalScore = 0;
    let totalDuration = 0;

    recordings.forEach(recording => {
      if (recording.analysis) {
        const avgScore = (
          recording.analysis.clarity.score +
          recording.analysis.fluency.score +
          recording.analysis.confidence.score
        ) / 3;
        totalScore += avgScore;
      }
      totalDuration += recording.duration || 0;
    });

    // Calculate improvement rate (comparing last 5 with first 5 recordings)
    let improvementRate = 0;
    if (totalRecordings >= 10) {
      const firstFive = recordings.slice(-5);
      const lastFive = recordings.slice(0, 5);
      
      const firstFiveAvg = firstFive.reduce((acc, rec) => {
        if (rec.analysis) {
          return acc + (
            rec.analysis.clarity.score +
            rec.analysis.fluency.score +
            rec.analysis.confidence.score
          ) / 3;
        }
        return acc;
      }, 0) / 5;

      const lastFiveAvg = lastFive.reduce((acc, rec) => {
        if (rec.analysis) {
          return acc + (
            rec.analysis.clarity.score +
            rec.analysis.fluency.score +
            rec.analysis.confidence.score
          ) / 3;
        }
        return acc;
      }, 0) / 5;

      improvementRate = ((lastFiveAvg - firstFiveAvg) / firstFiveAvg) * 100;
    }

    const stats = {
      totalRecordings,
      averageScore: totalRecordings > 0 ? (totalScore / totalRecordings) * 100 : 0,
      improvementRate,
      practiceTime: Math.round(totalDuration / 60) // Convert to minutes
    };

    res.json(stats);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
