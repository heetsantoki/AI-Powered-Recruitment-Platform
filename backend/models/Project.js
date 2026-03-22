const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  tech_stack: [{ type: String }],
  live_url: { type: String },
  github_url: { type: String },
  sort_order: { type: Number, default: 0 }
});

module.exports = mongoose.model('Project', projectSchema);
