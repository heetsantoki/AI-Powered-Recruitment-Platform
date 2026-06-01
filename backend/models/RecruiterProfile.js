const mongoose = require('mongoose');

const recruiterProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  company_name: { type: String, required: true, trim: true },
  company_website: { type: String, required: true, trim: true },
  company_logo: { type: String, required: true }, // Logo is mandatory
  company_tagline: { type: String, required: true, trim: true },
  company_description: { type: String, required: true, trim: true },
  
  industry_type: { type: String, required: true, trim: true },
  company_size: { 
    type: String, 
    enum: ['1-10', '11-50', '51-200', '201-500', '500+'], 
    required: true
  },
  company_type: { 
    type: String, 
    enum: ['Startup', 'Private Company', 'Public Company', 'Agency', 'Non-Profit', 'Enterprise', 'Other'], 
    required: true
  },
  
  headquarters_location: { type: String, required: true, trim: true },
  office_locations: { 
    type: [String], 
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'At least one office location is required.'
    },
    required: true
  },
  company_contact_number: { type: String, required: true, trim: true },
  company_contact_email: { type: String, required: true, trim: true },
  
  recruiter_name: { type: String, required: true, trim: true },
  recruiter_designation: { type: String, required: true, trim: true },
  official_email: { type: String, required: true, trim: true },
  recruiter_linkedin: { type: String, required: true, trim: true },
  
  linkedin_company_page: { type: String, required: true, trim: true },
  twitter_profile: { type: String, default: '', trim: true }, // Optional
  facebook_page: { type: String, default: '', trim: true }, // Optional
  instagram_profile: { type: String, default: '', trim: true }, // Optional
  work_culture: { type: String, required: true, trim: true },
  employee_benefits: { type: String, default: '', trim: true }, // Optional
  work_model: { 
    type: String, 
    enum: ['Remote', 'Hybrid', 'On-Site'], 
    required: true 
  },
  
  is_completed: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RecruiterProfile', recruiterProfileSchema);
