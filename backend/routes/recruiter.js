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

// Middleware: ensure recruiter role
function requireRecruiter(req, res, next) {
  if (req.user.role !== 'recruiter') {
    return res.status(403).json({ error: 'Recruiter access only' });
  }
  next();
}

async function getCandidateFull(userId) {
  const user = await User.findById(userId).select('_id name email');
  const profile = await CandidateProfile.findOne({ user_id: userId }) || {};
  const experiences = await Experience.find({ user_id: userId }).sort({ sort_order: 1 });
  const skills = await Skill.find({ user_id: userId });
  const projects = await Project.find({ user_id: userId }).sort({ sort_order: 1 });
  const education = await Education.find({ user_id: userId }).sort({ end_year: -1 });
  return { 
    user: user ? { id: user._id, name: user.name, email: user.email } : null, 
    profile, 
    experiences, 
    skills, 
    projects, 
    education 
  };
}

// GET /api/recruiter/candidates
router.get('/candidates', auth, requireRecruiter, async (req, res) => {
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
        is_shortlisted: !!isShortlisted
      };
    }));

    res.json({ candidates: enriched.filter(Boolean), total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recruiter/candidates/:id
router.get('/candidates/:id', auth, requireRecruiter, async (req, res) => {
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
router.post('/shortlist', auth, requireRecruiter, async (req, res) => {
  try {
    const { candidate_id, note = '', status = 'shortlisted' } = req.body;
    const existing = await Shortlist.findOne({ recruiter_id: req.user.id, candidate_id });
    if (existing) {
      await Shortlist.deleteOne({ _id: existing._id });
      return res.json({ success: true, action: 'removed' });
    }
    await Shortlist.create({ recruiter_id: req.user.id, candidate_id, note, status });
    res.json({ success: true, action: 'added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recruiter/shortlisted
router.get('/shortlisted', auth, requireRecruiter, async (req, res) => {
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
router.get('/compare', auth, requireRecruiter, async (req, res) => {
  try {
    const ids = (req.query.ids || '').split(',').filter(Boolean).slice(0, 4);
    const profiles = await Promise.all(ids.map(id => getCandidateFull(id)));
    res.json({ profiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
