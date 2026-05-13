const mongoose = require('mongoose');

const validator = require('validator');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    validate: [validator.isEmail, 'Invalid email format']
  },
  password: { type: String, required: false }, // Optional for Google Auth users
  googleId: { type: String, required: false },
  role: { type: String, required: true, default: 'candidate', enum: ['candidate', 'recruiter'] },
  name: { type: String, trim: true },
  is_verified: { type: Boolean, default: false },
  otp: { type: String, required: false },
  otp_expires: { type: Date, required: false },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
