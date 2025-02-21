const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const Recording = require('../models/Recording');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio and video files are allowed.'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// @route   POST api/recordings
// @desc    Upload a new recording
// @access  Private
router.post('/', auth, upload.single('recording'), async (req, res) => {
  try {
    const { title, type, duration } = req.body;
    
    const recording = new Recording({
      user: req.user.id,
      title,
      fileUrl: req.file.path,
      type,
      duration: parseFloat(duration)
    });

    await recording.save();
    res.json(recording);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/recordings
// @desc    Get all recordings for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const recordings = await Recording.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(recordings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/recordings/progress
// @desc    Get user's progress data
// @access  Private
router.get('/progress', auth, async (req, res) => {
  try {
    const recordings = await Recording.find({ user: req.user.id })
      .sort({ createdAt: 1 })
      .select('createdAt scores');

    // Process recordings into progress data
    const progressData = {
      dates: [],
      scores: {
        clarity: [],
        fluency: [],
        confidence: []
      }
    };

    recordings.forEach(recording => {
      progressData.dates.push(recording.createdAt.toISOString().split('T')[0]);
      progressData.scores.clarity.push(recording.scores?.clarity || 0);
      progressData.scores.fluency.push(recording.scores?.fluency || 0);
      progressData.scores.confidence.push(recording.scores?.confidence || 0);
    });

    res.json(progressData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/recordings/stats
// @desc    Get user's recording statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const recordings = await Recording.find({ user: req.user.id });
    
    // Calculate statistics
    const totalRecordings = recordings.length;
    let totalDuration = 0;
    let totalScores = 0;
    let scoreCount = 0;

    recordings.forEach(recording => {
      totalDuration += recording.duration || 0;
      
      if (recording.scores) {
        const scores = [
          recording.scores.clarity || 0,
          recording.scores.fluency || 0,
          recording.scores.confidence || 0
        ];
        totalScores += scores.reduce((a, b) => a + b, 0) / scores.length;
        scoreCount++;
      }
    });

    const averageScore = scoreCount > 0 ? totalScores / scoreCount : 0;

    // Calculate improvement rate (comparing last 5 recordings with first 5)
    let improvementRate = 0;
    if (recordings.length >= 10) {
      const firstFive = recordings.slice(0, 5);
      const lastFive = recordings.slice(-5);
      
      const firstFiveAvg = firstFive.reduce((acc, rec) => {
        const scores = rec.scores ? Object.values(rec.scores) : [0];
        return acc + (scores.reduce((a, b) => a + b, 0) / scores.length);
      }, 0) / 5;

      const lastFiveAvg = lastFive.reduce((acc, rec) => {
        const scores = rec.scores ? Object.values(rec.scores) : [0];
        return acc + (scores.reduce((a, b) => a + b, 0) / scores.length);
      }, 0) / 5;

      improvementRate = ((lastFiveAvg - firstFiveAvg) / firstFiveAvg) * 100;
    }

    res.json({
      totalRecordings,
      averageScore,
      improvementRate,
      practiceTime: totalDuration
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/recordings/:id
// @desc    Get recording by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.id);
    
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Check user owns the recording
    if (recording.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    res.json(recording);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Recording not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/recordings/:id
// @desc    Delete a recording
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.id);
    
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Check user owns the recording
    if (recording.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await recording.remove();
    res.json({ message: 'Recording removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Recording not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
