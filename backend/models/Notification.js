const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recruiter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { 
    type: String, 
    required: true,
    default: "Congratulations! Your profile has been shortlisted by a recruiter based on your skills and experience. The recruiter is interested in your profile and may contact you regarding potential opportunities."
  },
  recruiter_name: { type: String, required: true },
  company_name: { type: String, required: true },
  company_website: { type: String, default: '' },
  linkedin_company_page: { type: String, default: '' },
  official_email: { type: String, default: '' },
  recruiter_linkedin: { type: String, default: '' },
  company_logo: { type: String, default: '' },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
