const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const Experience = require('../models/Experience');
const Skill = require('../models/Skill');
const Project = require('../models/Project');
const Education = require('../models/Education');
const Shortlist = require('../models/Shortlist');
const Interview = require('../models/Interview');

const RecruiterProfile = require('../models/RecruiterProfile');
const Notification = require('../models/Notification');

// Middleware: ensure recruiter role
function requireRecruiter(req, res, next) {
  if (req.user.role !== 'recruiter') {
    return res.status(403).json({ error: 'Recruiter access only' });
  }
  next();
}

// Middleware: ensure recruiter has a completed profile
async function requireCompletedProfile(req, res, next) {
  if (req.user.role !== 'recruiter') {
    return res.status(403).json({ error: 'Recruiter access only' });
  }
  try {
    const profile = await RecruiterProfile.findOne({ user_id: req.user.id });
    if (!profile || !profile.is_completed) {
      return res.status(403).json({ error: 'Please complete your recruiter company profile first.' });
    }
    next();
  } catch (err) {
    console.error('requireCompletedProfile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getCandidateFull(userId) {
  const user = await User.findById(userId).select('_id name email');
  const profile = await CandidateProfile.findOne({ user_id: userId }) || {};
  const experiences = await Experience.find({ user_id: userId }).sort({ sort_order: 1 });
  const skills = await Skill.find({ user_id: userId });
  const projects = await Project.find({ user_id: userId }).sort({ sort_order: 1 });
  const education = await Education.find({ user_id: userId }).sort({ end_year: -1 });
  const interview = await Interview.findOne({ user_id: userId }) || null;
  return { 
    user: user ? { id: user._id, name: user.name, email: user.email } : null, 
    profile, 
    experiences, 
    skills, 
    projects, 
    education,
    interview
  };
}

// GET /api/recruiter/candidates
router.get('/candidates', auth, requireCompletedProfile, async (req, res) => {
  try {
    const { search = '', skill = '', sort = 'newest', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let profileQuery = { is_submitted: 1 };
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const matchingUsers = await User.find({ name: searchRegex, role: 'candidate' }).select('_id');
      const userIds = matchingUsers.map(u => u._id);
      
      profileQuery.$or = [
        { headline: searchRegex },
        { summary: searchRegex },
        { user_id: { $in: userIds } }
      ];
    }
    
    if (skill) {
      const skillRegex = new RegExp(skill, 'i');
      const matchingSkills = await Skill.find({ name: skillRegex }).select('user_id');
      const skilledUserIds = matchingSkills.map(s => s.user_id);
      profileQuery.user_id = { ...(profileQuery.user_id || {}), $in: skilledUserIds };
    }

    let sortOption = { updated_at: -1 };
    if (sort === 'completion') sortOption = { completion_percent: -1 };

    const profiles = await CandidateProfile.find(profileQuery)
      .sort(sortOption)
      .skip(offset)
      .limit(parseInt(limit))
      .populate('user_id', 'name email');

    const total = await CandidateProfile.countDocuments(profileQuery);

    const enriched = await Promise.all(profiles.map(async p => {
      if (!p.user_id) return null;
      const u = p.user_id;
      const skills = await Skill.find({ user_id: u._id }).limit(6);
      const isShortlisted = await Shortlist.findOne({ recruiter_id: req.user.id, candidate_id: u._id });
      const interview = await Interview.findOne({ user_id: u._id });
      
      const is_interview_completed = interview ? interview.status === 'completed' : false;
      const interview_score = (interview && interview.evaluation) ? interview.evaluation.score : null;
      const validated_badges = (interview && interview.evaluation) ? interview.evaluation.validated_badges : [];

      return {
        id: u._id,
        name: u.name,
        email: u.email,
        headline: p.headline,
        summary: p.summary,
        location: p.location,
        completion_percent: p.completion_percent,
        is_submitted: p.is_submitted,
        updated_at: p.updated_at,
        skills,
        is_shortlisted: !!isShortlisted,
        is_interview_completed,
        interview_score,
        validated_badges
      };
    }));

    res.json({ candidates: enriched.filter(Boolean), total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recruiter/candidates/:id
router.get('/candidates/:id', auth, requireCompletedProfile, async (req, res) => {
  try {
    const full = await getCandidateFull(req.params.id);
    const isShortlisted = await Shortlist.findOne({ recruiter_id: req.user.id, candidate_id: req.params.id });
    res.json({ ...full, shortlist: isShortlisted || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/recruiter/shortlist
router.post('/shortlist', auth, requireCompletedProfile, async (req, res) => {
  try {
    const { candidate_id, note = '', status = 'shortlisted' } = req.body;
    const existing = await Shortlist.findOne({ recruiter_id: req.user.id, candidate_id });
    if (existing) {
      await Shortlist.deleteOne({ _id: existing._id });
      // Delete candidate notification as well to synchronize state
      await Notification.deleteOne({ recruiter_id: req.user.id, user_id: candidate_id });
      return res.json({ success: true, action: 'removed' });
    }
    
    // Create Shortlist record
    await Shortlist.create({ recruiter_id: req.user.id, candidate_id, note, status });

    // Retrieve company profile details to populate notification snapshot
    const rp = await RecruiterProfile.findOne({ user_id: req.user.id });
    if (rp) {
      await Notification.create({
        user_id: candidate_id,
        recruiter_id: req.user.id,
        recruiter_name: rp.recruiter_name,
        company_name: rp.company_name,
        company_website: rp.company_website,
        linkedin_company_page: rp.linkedin_company_page,
        official_email: rp.official_email,
        recruiter_linkedin: rp.recruiter_linkedin,
        company_logo: rp.company_logo,
        message: "Congratulations! Your profile has been shortlisted by a recruiter based on your skills and experience. The recruiter is interested in your profile and may contact you regarding potential opportunities."
      });
    }

    res.json({ success: true, action: 'added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recruiter/shortlisted
router.get('/shortlisted', auth, requireCompletedProfile, async (req, res) => {
  try {
    const shortlists = await Shortlist.find({ recruiter_id: req.user.id })
      .sort({ created_at: -1 })
      .populate('candidate_id', 'name email');

    const enriched = await Promise.all(shortlists.map(async s => {
      if (!s.candidate_id) return null;
      const u = s.candidate_id;
      const cp = await CandidateProfile.findOne({ user_id: u._id });
      const skills = await Skill.find({ user_id: u._id }).limit(6);
      
      return {
        id: u._id,
        name: u.name,
        email: u.email,
        headline: cp ? cp.headline : '',
        summary: cp ? cp.summary : '',
        location: cp ? cp.location : '',
        completion_percent: cp ? cp.completion_percent : 0,
        note: s.note,
        status: s.status,
        shortlisted_at: s.created_at,
        skills
      };
    }));

    res.json({ candidates: enriched.filter(Boolean) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recruiter/compare?ids=1,2,3
router.get('/compare', auth, requireCompletedProfile, async (req, res) => {
  try {
    const ids = (req.query.ids || '').split(',').filter(Boolean).slice(0, 4);
    const profiles = await Promise.all(ids.map(id => getCandidateFull(id)));
    res.json({ profiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recruiter/profile — get recruiter's own company profile
router.get('/profile', auth, requireRecruiter, async (req, res) => {
  try {
    const profile = await RecruiterProfile.findOne({ user_id: req.user.id });
    res.json(profile || null);
  } catch (err) {
    console.error('Get recruiter profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/recruiter/profile — save / update company profile
router.post('/profile', auth, requireRecruiter, async (req, res) => {
  try {
    const {
      company_name,
      company_website,
      company_logo,
      company_tagline,
      company_description,
      industry_type,
      company_size,
      company_type,
      headquarters_location,
      office_locations,
      company_contact_number,
      company_contact_email,
      recruiter_name,
      recruiter_designation,
      official_email,
      recruiter_linkedin,
      linkedin_company_page,
      twitter_profile,
      facebook_page,
      instagram_profile,
      work_culture,
      employee_benefits,
      work_model
    } = req.body;

    const validator = require('validator');

    // 1. Mandatory Validations
    if (!company_name || !company_name.trim()) {
      return res.status(400).json({ error: 'Company Name is required' });
    }
    if (!company_website || !company_website.trim() || !validator.isURL(company_website)) {
      return res.status(400).json({ error: 'A valid Company Website URL is required' });
    }
    if (!company_logo || !company_logo.trim()) {
      return res.status(400).json({ error: 'Company Logo is required' });
    }
    if (!company_tagline || !company_tagline.trim()) {
      return res.status(400).json({ error: 'Company Tagline / Slogan is required' });
    }
    if (!company_description || !company_description.trim()) {
      return res.status(400).json({ error: 'About Us / Company Description is required' });
    }
    
    if (!industry_type || !industry_type.trim()) {
      return res.status(400).json({ error: 'Industry Type is required' });
    }
    if (!company_size || !['1-10', '11-50', '51-200', '201-500', '500+'].includes(company_size)) {
      return res.status(400).json({ error: 'A valid Company Size selection is required' });
    }
    if (!company_type || !['Startup', 'Private Company', 'Public Company', 'Agency', 'Non-Profit', 'Enterprise', 'Other'].includes(company_type)) {
      return res.status(400).json({ error: 'A valid Company Type selection is required' });
    }
    
    if (!headquarters_location || !headquarters_location.trim()) {
      return res.status(400).json({ error: 'Headquarters Location is required' });
    }
    if (!Array.isArray(office_locations) || office_locations.length === 0) {
      return res.status(400).json({ error: 'At least one Office Location is required' });
    }
    if (!company_contact_number || !company_contact_number.trim()) {
      return res.status(400).json({ error: 'Company Contact Number is required' });
    }
    if (!company_contact_email || !company_contact_email.trim() || !validator.isEmail(company_contact_email)) {
      return res.status(400).json({ error: 'A valid Company Contact Email is required' });
    }
    
    if (!recruiter_name || !recruiter_name.trim()) {
      return res.status(400).json({ error: 'Recruiter Name is required' });
    }
    if (!recruiter_designation || !recruiter_designation.trim()) {
      return res.status(400).json({ error: 'Recruiter Designation is required' });
    }
    if (!official_email || !official_email.trim() || !validator.isEmail(official_email)) {
      return res.status(400).json({ error: 'A valid Official Company Email is required' });
    }
    
    const checkURLFormat = (url, label) => {
      if (!url || !url.trim()) return false;
      let clean = url.trim();
      if (!/^https?:\/\//i.test(clean)) clean = 'https://' + clean;
      return validator.isURL(clean);
    };

    if (!recruiter_linkedin || !checkURLFormat(recruiter_linkedin, 'Recruiter LinkedIn')) {
      return res.status(400).json({ error: 'A valid Recruiter LinkedIn Profile URL is required' });
    }
    if (!linkedin_company_page || !checkURLFormat(linkedin_company_page, 'LinkedIn Company Page')) {
      return res.status(400).json({ error: 'A valid LinkedIn Company Page URL is required' });
    }
    if (!work_culture || !work_culture.trim()) {
      return res.status(400).json({ error: 'Work Culture Description is required' });
    }
    if (!work_model || !['Remote', 'Hybrid', 'On-Site'].includes(work_model)) {
      return res.status(400).json({ error: 'A valid Work Model selection is required' });
    }

    // 2. Optional Social Links URL Validations
    const checkURL = (url, label) => {
      if (url && url.trim()) {
        let cleanUrl = url.trim();
        // Add protocol if missing to allow standard URL validation
        if (!/^https?:\/\//i.test(cleanUrl)) {
          cleanUrl = 'https://' + cleanUrl;
        }
        if (!validator.isURL(cleanUrl)) {
          throw new Error(`Invalid URL format for ${label}`);
        }
      }
    };

    try {
      checkURL(recruiter_linkedin, 'LinkedIn Profile');
      checkURL(linkedin_company_page, 'LinkedIn Company Page');
      checkURL(twitter_profile, 'Twitter/X Profile');
      checkURL(facebook_page, 'Facebook Page');
      checkURL(instagram_profile, 'Instagram Profile');
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    // 3. Save/Update Profile
    const profileData = {
      company_name: company_name.trim(),
      company_website: company_website.trim(),
      company_logo: company_logo || '',
      company_tagline: company_tagline ? company_tagline.trim() : '',
      company_description: company_description ? company_description.trim() : '',
      industry_type: industry_type ? industry_type.trim() : '',
      company_size: company_size || '',
      company_type: company_type || '',
      headquarters_location: headquarters_location ? headquarters_location.trim() : '',
      office_locations: Array.isArray(office_locations) ? office_locations : [],
      company_contact_number: company_contact_number ? company_contact_number.trim() : '',
      company_contact_email: company_contact_email ? company_contact_email.trim() : '',
      recruiter_name: recruiter_name.trim(),
      recruiter_designation: recruiter_designation.trim(),
      official_email: official_email.trim(),
      recruiter_linkedin: recruiter_linkedin ? recruiter_linkedin.trim() : '',
      linkedin_company_page: linkedin_company_page ? linkedin_company_page.trim() : '',
      twitter_profile: twitter_profile ? twitter_profile.trim() : '',
      facebook_page: facebook_page ? facebook_page.trim() : '',
      instagram_profile: instagram_profile ? instagram_profile.trim() : '',
      work_culture: work_culture ? work_culture.trim() : '',
      employee_benefits: employee_benefits ? employee_benefits.trim() : '',
      work_model: work_model || '',
      is_completed: true,
      updated_at: Date.now()
    };

    const updatedProfile = await RecruiterProfile.findOneAndUpdate(
      { user_id: req.user.id },
      profileData,
      { upsert: true, new: true }
    );

    // Also update the User's name if it was changed/provided
    if (recruiter_name.trim()) {
      await User.findByIdAndUpdate(req.user.id, { name: recruiter_name.trim() });
    }

    res.json({ success: true, profile: updatedProfile });
  } catch (err) {
    console.error('Save recruiter profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
