const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  degree: { type: String },
  field_of_study: { type: String },
  institution: { type: String },
  start_year: { type: String },
  end_year: { type: String },
  grade: { type: String }
});

module.exports = mongoose.model('Education', educationSchema);
