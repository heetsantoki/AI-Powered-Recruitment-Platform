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
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = await User.create({ email, password: hash, role, name, is_verified: false, otp, otp_expires });

    // Create empty profile for candidates
    if (role === 'candidate') {
      await CandidateProfile.create({ user_id: user._id, completion_percent: 0 });
    }

    try {
      const sendEmail = require('../utils/sendEmail');
      await sendEmail({
        email: user.email,
        subject: 'Verify your AI Recruitment account',
        message: `Your verification code is: ${otp}\n\nIt expires in 10 minutes.`,
      });
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Even if email fails, we tell frontend we require OTP (it might be logged to console in dev)
    }

    res.status(201).json({ requires_otp: true, email: user.email });
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

    if (user.is_verified === false) {
      // User hasn't verified OTP yet. Generate new OTP and send it.
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otp_expires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      try {
        const sendEmail = require('../utils/sendEmail');
        await sendEmail({
          email: user.email,
          subject: 'Verify your AI Recruitment account',
          message: `Your verification code is: ${otp}\n\nIt expires in 10 minutes.`,
        });
      } catch (err) {
        console.error('Failed to send OTP email:', err);
      }

      return res.status(403).json({ requires_otp: true, email: user.email, error: 'Please verify your email to login' });
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

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.is_verified) {
      return res.status(400).json({ error: 'User already verified' });
    }

    if (user.otp !== otp) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    if (new Date() > user.otp_expires) {
      return res.status(401).json({ error: 'OTP has expired. Please log in again to receive a new one.' });
    }

    user.is_verified = true;
    user.otp = undefined;
    user.otp_expires = undefined;
    await user.save();

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
    console.error('Verify OTP error:', err);
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
        user.is_verified = true;
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

    user = await User.create({ email, name, role, googleId, is_verified: true });

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

module.exports = router;
