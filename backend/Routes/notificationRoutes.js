const express = require('express');
const router = express.Router();
const Notification = require('../Models/Notification');
const { protect } = require('../Middleware/authMiddleware');

// Get current user's notifications
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({
      unreadCount: await Notification.countDocuments({ user: req.user._id, isRead: false }),
      items: notifications
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark one notification as read
// Mark all as read (place BEFORE param routes to avoid conflicts)
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark one notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;


