const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Recording = require('../models/Recording');

// @route   POST api/feedback/:recordingId
// @desc    Add or update feedback for a recording
// @access  Private
router.post('/:recordingId', auth, async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.recordingId);
    
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Check user owns the recording
    if (recording.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Update feedback
    recording.feedback = {
      ...recording.feedback,
      ...req.body
    };

    await recording.save();
    res.json(recording);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Recording not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET api/feedback/stats
// @desc    Get user's feedback statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const recordings = await Recording.find({ 
      user: req.user.id,
      feedback: { $exists: true }
    });

    const stats = recordings.reduce((acc, recording) => {
      if (recording.feedback) {
        // Calculate average scores
        acc.clarity = (acc.clarity || 0) + (recording.feedback.clarity?.score || 0);
        acc.tone = (acc.tone || 0) + (recording.feedback.tone?.score || 0);
        acc.fluency = (acc.fluency || 0) + (recording.feedback.fluency?.score || 0);
        acc.confidence = (acc.confidence || 0) + (recording.feedback.confidence?.score || 0);
        acc.totalRecordings++;
      }
      return acc;
    }, { totalRecordings: 0 });

    // Calculate averages
    if (stats.totalRecordings > 0) {
      stats.clarity /= stats.totalRecordings;
      stats.tone /= stats.totalRecordings;
      stats.fluency /= stats.totalRecordings;
      stats.confidence /= stats.totalRecordings;
    }

    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
