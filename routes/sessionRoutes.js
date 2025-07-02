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

// Load sessions on student profile
router.get('/api/sessions', async (req, res) => {
  const { studentId } = req.query;

  if (!studentId) {
    return res.status(400).json({ error: 'Missing studentId' });
  }

  try {
    const [sessions] = await db.execute(
      `SELECT 
        sr.id, sr.skill_requested AS skill, sr.expert_id AS expertId,
        u.name AS expertName, sr.status, sr.requested_time AS scheduledTime,
        sr.student_completed
       FROM session_requests sr
       JOIN users u ON sr.expert_id = u.id
       WHERE sr.student_id = ?`,
      [studentId]
    );

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark session as completed by student
router.put('/session-requests/:id/student-complete', async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.session.user.id;

    // Verify the session belongs to this student
    const [session] = await executeQuery(
      'SELECT student_id FROM session_requests WHERE id = ?',
      [id]
    );

    if (!session || session.student_id !== studentId) {
      return res.status(404).json({ error: 'Session not found or not authorized' });
    }

    // Update student_completed flag
    await db.execute(
      'UPDATE session_requests SET student_completed = TRUE WHERE id = ?',
      [id]
    );

    // Check if both parties have completed
    const [sessionStatus] = await executeQuery(
      'SELECT student_completed, expert_completed FROM session_requests WHERE id = ?',
      [id]
    );

    const bothCompleted = sessionStatus.student_completed && sessionStatus.expert_completed;

    if (bothCompleted) {
      await db.execute(
        'UPDATE session_requests SET status = "COMPLETED" WHERE id = ?',
        [id]
      );
    }

    res.json({ success: true, status: bothCompleted ? 'COMPLETED' : 'IN_PROGRESS' });

  } catch (error) {
    console.error('Error completing session by student:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});



module.exports = router;
