const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['audio', 'video'],
    required: true
  },
  duration: {
    type: Number,  // in seconds
    required: true
  },
  transcript: {
    type: String
  },
  feedback: {
    clarity: {
      score: Number,
      suggestions: [String]
    },
    tone: {
      score: Number,
      suggestions: [String]
    },
    fluency: {
      score: Number,
      suggestions: [String],
      wordsPerMinute: Number,
      fillerWordCount: Number
    },
    confidence: {
      score: Number,
      suggestions: [String]
    },
    videoAnalysis: {
      facialExpressions: {
        type: Map,
        of: Number
      },
      bodyLanguage: {
        type: Map,
        of: Number
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Recording', recordingSchema);
