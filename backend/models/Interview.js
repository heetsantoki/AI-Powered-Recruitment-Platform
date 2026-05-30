const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  role: { type: String, required: true },
  status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
  current_question_index: { type: Number, default: 0 },
  chat_history: [
    {
      sender: { type: String, enum: ['ai', 'candidate'], required: true },
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  evaluation: {
    score: { type: Number },
    feedback: { type: String },
    strengths: [{ type: String }],
    growth_areas: [{ type: String }],
    validated_badges: [{ type: String }],
    conducted_at: { type: Date }
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interview', interviewSchema);
