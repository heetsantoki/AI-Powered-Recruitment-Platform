const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db/database');

// Middleware: ensure recruiter role
function requireRecruiter(req, res, next) {
  if (req.user.role !== 'recruiter') {
    return res.status(403).json({ error: 'Recruiter access only' });
  }
  next();
}

function getCandidateFull(userId) {
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(userId);
  const profile = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(userId);
  const experiences = db.prepare('SELECT * FROM experiences WHERE user_id = ? ORDER BY sort_order').all(userId)
    .map(e => ({ ...e, bullets: e.bullets ? JSON.parse(e.bullets) : [] }));
  const skills = db.prepare('SELECT * FROM skills WHERE user_id = ?').all(userId);
  const projects = db.prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY sort_order').all(userId)
    .map(p => ({ ...p, tech_stack: p.tech_stack ? JSON.parse(p.tech_stack) : [] }));
  const education = db.prepare('SELECT * FROM education WHERE user_id = ? ORDER BY end_year DESC').all(userId);
  return { user, profile: profile || {}, experiences, skills, projects, education };
}

// GET /api/recruiter/candidates
router.get('/candidates', auth, requireRecruiter, (req, res) => {
  try {
    const { search = '', skill = '', sort = 'newest', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT DISTINCT u.id, u.name, u.email, cp.headline, cp.summary, cp.location,
             cp.completion_percent, cp.is_submitted, cp.updated_at
      FROM users u
      LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
      WHERE u.role = 'candidate' AND cp.is_submitted = 1
    `;
    const params = [];

    if (search) {
      query += ` AND (u.name LIKE ? OR cp.headline LIKE ? OR cp.summary LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (skill) {
      query += ` AND u.id IN (SELECT user_id FROM skills WHERE name LIKE ?)`;
      params.push(`%${skill}%`);
    }

    if (sort === 'newest') query += ' ORDER BY cp.updated_at DESC';
    else if (sort === 'completion') query += ' ORDER BY cp.completion_percent DESC';
    else if (sort === 'name') query += ' ORDER BY u.name ASC';

    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const candidates = db.prepare(query).all(...params);

    // Attach top skills
    const enriched = candidates.map(c => {
      const skills = db.prepare('SELECT name, level, category FROM skills WHERE user_id = ? LIMIT 6').all(c.id);
      const isShortlisted = db.prepare('SELECT id FROM shortlists WHERE recruiter_id = ? AND candidate_id = ?').get(req.user.id, c.id);
      return { ...c, skills, is_shortlisted: !!isShortlisted };
    });

    const total = db.prepare(`SELECT COUNT(DISTINCT u.id) as c FROM users u LEFT JOIN candidate_profiles cp ON cp.user_id = u.id WHERE u.role = 'candidate' AND cp.is_submitted = 1`).get().c;

    res.json({ candidates: enriched, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recruiter/candidates/:id
router.get('/candidates/:id', auth, requireRecruiter, (req, res) => {
  try {
    const full = getCandidateFull(req.params.id);
    const isShortlisted = db.prepare('SELECT id, note, status FROM shortlists WHERE recruiter_id = ? AND candidate_id = ?').get(req.user.id, req.params.id);
    res.json({ ...full, shortlist: isShortlisted || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/recruiter/shortlist
router.post('/shortlist', auth, requireRecruiter, (req, res) => {
  try {
    const { candidate_id, note = '', status = 'shortlisted' } = req.body;
    const existing = db.prepare('SELECT id FROM shortlists WHERE recruiter_id = ? AND candidate_id = ?').get(req.user.id, candidate_id);
    if (existing) {
      // Toggle: remove if already shortlisted
      db.prepare('DELETE FROM shortlists WHERE recruiter_id = ? AND candidate_id = ?').run(req.user.id, candidate_id);
      return res.json({ success: true, action: 'removed' });
    }
    db.prepare('INSERT INTO shortlists (recruiter_id, candidate_id, note, status) VALUES (?, ?, ?, ?)').run(req.user.id, candidate_id, note, status);
    res.json({ success: true, action: 'added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recruiter/shortlisted
router.get('/shortlisted', auth, requireRecruiter, (req, res) => {
  try {
    const shortlisted = db.prepare(`
      SELECT u.id, u.name, u.email, cp.headline, cp.summary, cp.location,
             cp.completion_percent, s.note, s.status, s.created_at as shortlisted_at
      FROM shortlists s
      JOIN users u ON u.id = s.candidate_id
      LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
      WHERE s.recruiter_id = ?
      ORDER BY s.created_at DESC
    `).all(req.user.id);

    const enriched = shortlisted.map(c => {
      const skills = db.prepare('SELECT name, level, category FROM skills WHERE user_id = ? LIMIT 6').all(c.id);
      return { ...c, skills };
    });

    res.json({ candidates: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recruiter/compare?ids=1,2,3
router.get('/compare', auth, requireRecruiter, (req, res) => {
  try {
    const ids = (req.query.ids || '').split(',').filter(Boolean).slice(0, 4);
    const profiles = ids.map(id => getCandidateFull(id));
    res.json({ profiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
