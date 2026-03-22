const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  level: { type: String, default: 'Intermediate' },
  category: { type: String, default: 'Technical' }
});

module.exports = mongoose.model('Skill', skillSchema);
