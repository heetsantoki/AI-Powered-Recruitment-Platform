const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CandidateProfile = require('../models/CandidateProfile');
const Experience = require('../models/Experience');
const Skill = require('../models/Skill');
const Project = require('../models/Project');
const Education = require('../models/Education');
const User = require('../models/User');

// Calculate completion percent based on filled sections
async function calcCompletion(userId) {
  const profile = await CandidateProfile.findOne({ user_id: userId });
  if (!profile) return 0;

  let score = 0;
  const weights = { basic: 20, experience: 20, skills: 20, projects: 20, education: 20 };

  const basicFields = ['headline', 'summary', 'location'];
  const filledBasic = basicFields.filter(f => profile[f] && profile[f].trim()).length;
  score += Math.round((filledBasic / basicFields.length) * weights.basic);

  const expCount = await Experience.countDocuments({ user_id: userId });
  if (expCount > 0) score += weights.experience;

  const skillCount = await Skill.countDocuments({ user_id: userId });
  if (skillCount >= 3) score += weights.skills;
  else if (skillCount > 0) score += Math.round((skillCount / 3) * weights.skills);

  const projCount = await Project.countDocuments({ user_id: userId });
  if (projCount > 0) score += weights.projects;

  const eduCount = await Education.countDocuments({ user_id: userId });
  if (eduCount > 0) score += weights.education;

  return Math.min(score, 100);
}

// GET /api/profile — get own full profile
router.get('/', auth, async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ user_id: req.user.id }) || {};
    const user = await User.findById(req.user.id).select('_id name email');
    const experiences = await Experience.find({ user_id: req.user.id }).sort({ sort_order: 1, _id: -1 });
    const skills = await Skill.find({ user_id: req.user.id });
    const projects = await Project.find({ user_id: req.user.id }).sort({ sort_order: 1, _id: -1 });
    const education = await Education.find({ user_id: req.user.id }).sort({ end_year: -1 });

    const normalizedUser = user ? { id: user._id, name: user.name, email: user.email } : null;

    res.json({
      user: normalizedUser,
      profile,
      experiences,
      skills,
      projects,
      education
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/profile/basic
router.put('/basic', auth, async (req, res) => {
  try {
    const { headline, summary, location, phone, linkedin, github, portfolio, availability, name } = req.body;

    if (name) {
      await User.findByIdAndUpdate(req.user.id, { name });
    }

    await CandidateProfile.findOneAndUpdate(
      { user_id: req.user.id },
      { headline, summary, location, phone, linkedin, github, portfolio, availability, updated_at: Date.now() },
      { upsert: true, new: true }
    );

    const completion = await calcCompletion(req.user.id);
    await CandidateProfile.findOneAndUpdate({ user_id: req.user.id }, { completion_percent: completion });

    res.json({ success: true, completion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/profile/experience
router.put('/experience', auth, async (req, res) => {
  try {
    const { experiences } = req.body;
    await Experience.deleteMany({ user_id: req.user.id });
    
    if (experiences && experiences.length > 0) {
      const docs = experiences.map((e, i) => ({
        user_id: req.user.id,
        job_title: e.job_title,
        company: e.company,
        location: e.location,
        start_date: e.start_date,
        end_date: e.end_date || null,
        is_current: e.is_current ? 1 : 0,
        description: e.description,
        bullets: e.bullets || [],
        sort_order: i
      }));
      await Experience.insertMany(docs);
    }

    const completion = await calcCompletion(req.user.id);
    await CandidateProfile.findOneAndUpdate({ user_id: req.user.id }, { completion_percent: completion });
    res.json({ success: true, completion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/profile/skills
router.put('/skills', auth, async (req, res) => {
  try {
    const { skills } = req.body;
    await Skill.deleteMany({ user_id: req.user.id });
    
    if (skills && skills.length > 0) {
      const docs = skills.map((s) => ({
        user_id: req.user.id,
        name: s.name,
        level: s.level || 'Intermediate',
        category: s.category || 'Technical'
      }));
      await Skill.insertMany(docs);
    }

    const completion = await calcCompletion(req.user.id);
    await CandidateProfile.findOneAndUpdate({ user_id: req.user.id }, { completion_percent: completion });
    res.json({ success: true, completion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/profile/projects
router.put('/projects', auth, async (req, res) => {
  try {
    const { projects } = req.body;
    await Project.deleteMany({ user_id: req.user.id });
    
    if (projects && projects.length > 0) {
      const docs = projects.map((p, i) => ({
        user_id: req.user.id,
        title: p.title,
        description: p.description,
        tech_stack: p.tech_stack || [],
        live_url: p.live_url,
        github_url: p.github_url,
        sort_order: i
      }));
      await Project.insertMany(docs);
    }

    const completion = await calcCompletion(req.user.id);
    await CandidateProfile.findOneAndUpdate({ user_id: req.user.id }, { completion_percent: completion });
    res.json({ success: true, completion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/profile/education
router.put('/education', auth, async (req, res) => {
  try {
    const { education } = req.body;
    await Education.deleteMany({ user_id: req.user.id });
    
    if (education && education.length > 0) {
      const docs = education.map((e) => ({
        user_id: req.user.id,
        degree: e.degree,
        field_of_study: e.field_of_study,
        institution: e.institution,
        start_year: e.start_year,
        end_year: e.end_year,
        grade: e.grade
      }));
      await Education.insertMany(docs);
    }

    const completion = await calcCompletion(req.user.id);
    await CandidateProfile.findOneAndUpdate({ user_id: req.user.id }, { completion_percent: completion });
    res.json({ success: true, completion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/profile/submit
router.post('/submit', auth, async (req, res) => {
  try {
    await CandidateProfile.findOneAndUpdate({ user_id: req.user.id }, { is_submitted: 1, updated_at: Date.now() });
    res.json({ success: true, message: 'Profile submitted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
