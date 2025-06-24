const express = require('express');
const router = express.Router();
const db = require('../database');

// Update session request status
router.put('/api/session-requests/:id', (req, res) => {
  const sessionId = req.params.id;
  const { status, expert_completed } = req.body;

  const validStatuses = ['accepted', 'rejected', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  const updateQuery = `
    UPDATE session_requests
    SET status = ?, expert_completed = ?
    WHERE id = ?
  `;

  db.query(updateQuery, [status, expert_completed, sessionId], (err, result) => {
    if (err) {
      console.error('Error updating session request:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    return res.json({ success: true, message: 'Session updated successfully' });
  });
});

router.get('/session', (req, res) => {
    if (req.session.user) {
      res.json({ loggedIn: true, user: req.session.user });
    } else {
      res.json({ loggedIn: false });
    }
});

module.exports = router;
