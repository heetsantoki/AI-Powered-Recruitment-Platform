const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const validator = require('validator');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'ai_recruitment_secret';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'candidate' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!['candidate', 'recruiter'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const user = await User.create({ email, password: hash, role, name });

    // Create empty profile for candidates
    if (role === 'candidate') {
      await CandidateProfile.create({ user_id: user._id, completion_percent: 0 });
    }

    const token = jwt.sign({ id: user._id, email, role, name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, email, role, name } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = bcrypt.compareSync(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, email: user.email, role: user.role, name: user.name }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email role name created_at');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'Token is required' });

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ email });
    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      const token = jwt.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: user._id, email: user.email, role: user.role, name: user.name } });
    }

    // User not found, needs role
    res.status(202).json({ requires_role: true, email, name, googleId });
  } catch (err) {
    console.error('Google Auth error:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// POST /api/auth/google/register
router.post('/google/register', async (req, res) => {
  try {
    const { idToken, role } = req.body;
    if (!idToken || !role) return res.status(400).json({ error: 'Token and role are required' });
    if (!['candidate', 'recruiter'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ email });
    if (user) return res.status(409).json({ error: 'User already exists' });

    user = await User.create({ email, name, role, googleId });

    if (role === 'candidate') {
      await CandidateProfile.create({ user_id: user._id, completion_percent: 0 });
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, email: user.email, role: user.role, name: user.name } });
  } catch (err) {
    console.error('Google Auth Register error:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});
