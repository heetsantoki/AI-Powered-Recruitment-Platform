const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job_title: { type: String },
  company: { type: String },
  location: { type: String },
  start_date: { type: String },
  end_date: { type: String },
  is_current: { type: Number, default: 0 },
  description: { type: String },
  bullets: [{ type: String }],
  sort_order: { type: Number, default: 0 }
});

module.exports = mongoose.model('Experience', experienceSchema);
