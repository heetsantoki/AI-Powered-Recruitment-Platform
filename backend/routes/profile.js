const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db/database');

// Calculate completion percent based on filled sections
function calcCompletion(userId) {
  const profile = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(userId);
  if (!profile) return 0;

  let score = 0;
  const weights = { basic: 20, experience: 20, skills: 20, projects: 20, education: 20 };

  const basicFields = ['headline', 'summary', 'location'];
  const filledBasic = basicFields.filter(f => profile[f] && profile[f].trim()).length;
  score += Math.round((filledBasic / basicFields.length) * weights.basic);

  const expCount = db.prepare('SELECT COUNT(*) as c FROM experiences WHERE user_id = ?').get(userId).c;
  if (expCount > 0) score += weights.experience;

  const skillCount = db.prepare('SELECT COUNT(*) as c FROM skills WHERE user_id = ?').get(userId).c;
  if (skillCount >= 3) score += weights.skills;
  else if (skillCount > 0) score += Math.round((skillCount / 3) * weights.skills);

  const projCount = db.prepare('SELECT COUNT(*) as c FROM projects WHERE user_id = ?').get(userId).c;
  if (projCount > 0) score += weights.projects;

  const eduCount = db.prepare('SELECT COUNT(*) as c FROM education WHERE user_id = ?').get(userId).c;
  if (eduCount > 0) score += weights.education;

  return Math.min(score, 100);
}

// GET /api/profile — get own full profile
router.get('/', auth, (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.user.id);
    const experiences = db.prepare('SELECT * FROM experiences WHERE user_id = ? ORDER BY sort_order, id DESC').all(req.user.id);
    const skills = db.prepare('SELECT * FROM skills WHERE user_id = ?').all(req.user.id);
    const projects = db.prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY sort_order, id DESC').all(req.user.id);
    const education = db.prepare('SELECT * FROM education WHERE user_id = ? ORDER BY end_year DESC').all(req.user.id);

    // Parse JSON fields
    const parsedExperiences = experiences.map(e => ({
      ...e,
      bullets: e.bullets ? JSON.parse(e.bullets) : []
    }));
    const parsedProjects = projects.map(p => ({
      ...p,
      tech_stack: p.tech_stack ? JSON.parse(p.tech_stack) : []
    }));

    res.json({
      user,
      profile: profile || {},
      experiences: parsedExperiences,
      skills,
      projects: parsedProjects,
      education
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/profile/basic
router.put('/basic', auth, (req, res) => {
  try {
    const { headline, summary, location, phone, linkedin, github, portfolio, availability, name } = req.body;

    // Update user name
    if (name) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user.id);
    }

    const existing = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
    if (existing) {
      db.prepare(`
        UPDATE candidate_profiles SET headline=?, summary=?, location=?, phone=?, linkedin=?, github=?, portfolio=?, availability=?, updated_at=CURRENT_TIMESTAMP
        WHERE user_id=?
      `).run(headline, summary, location, phone, linkedin, github, portfolio, availability, req.user.id);
    } else {
      db.prepare(`
        INSERT INTO candidate_profiles (user_id, headline, summary, location, phone, linkedin, github, portfolio, availability)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(req.user.id, headline, summary, location, phone, linkedin, github, portfolio, availability);
    }

    const completion = calcCompletion(req.user.id);
    db.prepare('UPDATE candidate_profiles SET completion_percent = ? WHERE user_id = ?').run(completion, req.user.id);

    res.json({ success: true, completion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/profile/experience
router.put('/experience', auth, (req, res) => {
  try {
    const { experiences } = req.body;
    db.prepare('DELETE FROM experiences WHERE user_id = ?').run(req.user.id);
    const stmt = db.prepare(`
      INSERT INTO experiences (user_id, job_title, company, location, start_date, end_date, is_current, description, bullets, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    experiences.forEach((e, i) => {
      stmt.run(req.user.id, e.job_title, e.company, e.location, e.start_date, e.end_date || null, e.is_current ? 1 : 0, e.description, JSON.stringify(e.bullets || []), i);
    });
    const completion = calcCompletion(req.user.id);
    db.prepare('UPDATE candidate_profiles SET completion_percent = ? WHERE user_id = ?').run(completion, req.user.id);
    res.json({ success: true, completion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/profile/skills
router.put('/skills', auth, (req, res) => {
  try {
    const { skills } = req.body;
    db.prepare('DELETE FROM skills WHERE user_id = ?').run(req.user.id);
    const stmt = db.prepare('INSERT INTO skills (user_id, name, level, category) VALUES (?, ?, ?, ?)');
    skills.forEach(s => stmt.run(req.user.id, s.name, s.level || 'Intermediate', s.category || 'Technical'));
    const completion = calcCompletion(req.user.id);
    db.prepare('UPDATE candidate_profiles SET completion_percent = ? WHERE user_id = ?').run(completion, req.user.id);
    res.json({ success: true, completion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/profile/projects
router.put('/projects', auth, (req, res) => {
  try {
    const { projects } = req.body;
    db.prepare('DELETE FROM projects WHERE user_id = ?').run(req.user.id);
    const stmt = db.prepare(`
      INSERT INTO projects (user_id, title, description, tech_stack, live_url, github_url, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    projects.forEach((p, i) => stmt.run(req.user.id, p.title, p.description, JSON.stringify(p.tech_stack || []), p.live_url, p.github_url, i));
    const completion = calcCompletion(req.user.id);
    db.prepare('UPDATE candidate_profiles SET completion_percent = ? WHERE user_id = ?').run(completion, req.user.id);
    res.json({ success: true, completion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/profile/education
router.put('/education', auth, (req, res) => {
  try {
    const { education } = req.body;
    db.prepare('DELETE FROM education WHERE user_id = ?').run(req.user.id);
    const stmt = db.prepare(`
      INSERT INTO education (user_id, degree, field_of_study, institution, start_year, end_year, grade)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    education.forEach(e => stmt.run(req.user.id, e.degree, e.field_of_study, e.institution, e.start_year, e.end_year, e.grade));
    const completion = calcCompletion(req.user.id);
    db.prepare('UPDATE candidate_profiles SET completion_percent = ? WHERE user_id = ?').run(completion, req.user.id);
    res.json({ success: true, completion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/profile/submit
router.post('/submit', auth, (req, res) => {
  try {
    db.prepare('UPDATE candidate_profiles SET is_submitted = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(req.user.id);
    res.json({ success: true, message: 'Profile submitted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
