const express = require('express');
const router = express.Router();
const db = require('../database');

// Create a new session request
router.post('/api/session-requests', async (req, res) => {
  try {
    const { skill_id, skill_requested, student_id, student_email, expert_id, requested_time, description } = req.body;
    
    const result = await db.execute(
      'INSERT INTO session_requests (skill_id, skill_requested, student_id, student_email, expert_id, requested_time, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [skill_id, skill_requested, student_id, student_email, expert_id, requested_time, description]
    );
    
    res.json({ 
      success: true,
      sessionId: result.insertId 
    });
  } catch (error) {
    console.error('Error creating session request:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

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

  db.execute(updateQuery, [status, expert_completed, sessionId], (err, result) => {
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
    if (req.session && req.session.user) {
      res.json({ 
          loggedIn: true, 
          user: req.session.user,
          sessionData: {
            userId: req.session.user.id,
            userEmail: req.session.user.email
          }
      });
    } else {
      res.json({ loggedIn: false });
    }
});

module.exports = router;
