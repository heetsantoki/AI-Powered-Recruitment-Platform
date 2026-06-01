const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// GET /api/notifications — Fetch all notifications for the current candidate
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'candidate') {
      return res.status(403).json({ error: 'Candidate access only' });
    }
    const list = await Notification.find({ user_id: req.user.id }).sort({ created_at: -1 });
    res.json(list);
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/notifications/:id/read — Mark a notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { is_read: true },
      { new: true }
    );
    res.json({ success: true, notification: notif });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/notifications/read-all — Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ user_id: req.user.id }, { is_read: true });
    res.json({ success: true });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
