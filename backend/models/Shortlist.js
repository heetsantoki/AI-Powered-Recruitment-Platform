const mongoose = require('mongoose');

const shortlistSchema = new mongoose.Schema({
  recruiter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidate_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String, default: '' },
  status: { type: String, default: 'shortlisted' },
  created_at: { type: Date, default: Date.now }
});

// Ensure recruiter can only shortlist a candidate once
shortlistSchema.index({ recruiter_id: 1, candidate_id: 1 }, { unique: true });

module.exports = mongoose.model('Shortlist', shortlistSchema);
