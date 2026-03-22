const mongoose = require('mongoose');

const candidateProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  headline: { type: String, default: '' },
  summary: { type: String, default: '' },
  location: { type: String, default: '' },
  phone: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  github: { type: String, default: '' },
  portfolio: { type: String, default: '' },
  availability: { type: String, default: 'Open to work' },
  profile_picture: { type: String, default: '' },
  completion_percent: { type: Number, default: 0 },
  is_submitted: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CandidateProfile', candidateProfileSchema);
