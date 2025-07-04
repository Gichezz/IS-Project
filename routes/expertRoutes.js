const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');


const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'proof-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Max 5 files
  }
});

// Helper function to execute queries
async function executeQuery(sql, params) {
  try {
    const [rows] = await db.execute(sql, params);
    return rows;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
}
// Helper Function to delete skill files
async function deleteSkillFiles(filePaths) {
    try {
        if (!filePaths) return;
        
        const files = filePaths.split(',');
        for (const file of files) {
            const filePath = path.join(__dirname, '../', file.trim());
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted file: ${filePath}`);
            }
        }
    } catch (err) {
        console.error('Error deleting skill files:', err);
    }
}

// Middleware to check if user is an expert
router.use((req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'expert') {
    return res.status(403).json({ error: 'Access denied. Expert authorization required.' });
  }
  next();
});

// 1. Session Requests Endpoints

// Get all session requests for an expert
router.get('/session-requests', async (req, res) => {
  try {
    const expertId = req.session.user.id;
    
    const sql = `
      SELECT sr.*, u.email AS student_email, 
             (SELECT rating FROM session_feedback WHERE session_id = sr.id) AS rating
      FROM session_requests sr
      JOIN users u ON sr.student_id = u.id
      WHERE sr.expert_id = ? OR (sr.expert_id IS NULL AND sr.status = 'pending')
      ORDER BY sr.requested_time DESC
    `;
    
    const sessions = await executeQuery(sql, [expertId]);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching session requests:', error);
    res.status(500).json({ error: 'Failed to fetch session requests' });
  }
});

// Update session request (accept/reject/reschedule)
router.put('/session-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, requested_time } = req.body;
    const expertId = req.session.user.id;
    
    let sql = 'UPDATE session_requests SET ';
    const params = [];
    
    if (status) {
      sql += 'status = ?';
      params.push(status);
      
      if (status === 'accepted') {
        sql += ', expert_id = ?';
        params.push(expertId);
      }
    }
    
    if (requested_time) {
      if (params.length > 0) sql += ', ';
      sql += 'requested_time = ?';
      params.push(new Date(requested_time));
    }
    
    sql += ' WHERE id = ?';
    params.push(id);
    
    await db.execute(sql, params);
    res.json({ success: true, message: 'Session updated successfully' });
  } catch (error) {
    console.error('Error updating session request:', error);
    res.status(500).json({ error: 'Failed to update session request' });
  }
});

// Mark session as completed by expert
router.put('/session-requests/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const expertId = req.session.user.id;
    
    // Verify the session belongs to this expert
    const [session] = await executeQuery(
      'SELECT expert_id FROM session_requests WHERE id = ?',
      [id]
    );
    
    if (!session || session.expert_id !== expertId) {
      return res.status(404).json({ error: 'Session not found or not authorized' });
    }
    
    // Update expert_completed flag
    await db.execute(
      'UPDATE session_requests SET expert_completed = TRUE WHERE id = ?',
      [id]
    );
    
    // Check if both parties have completed the session
    const [sessionStatus] = await executeQuery(
      'SELECT student_completed, expert_completed FROM session_requests WHERE id = ?',
      [id]
    );
    
    let paymentProcessed = false;
    if (sessionStatus.student_completed && sessionStatus.expert_completed) {
      await db.execute(
        'UPDATE session_requests SET status = "COMPLETED" WHERE id = ?',
        [id]
      );
      // Process payment
      paymentProcessed = true;
    }
    
    res.json({ success: true, payment_processed: paymentProcessed });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

// Get feedback for a session
router.get('/session-requests/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const expertId = req.session.user.id;
    
    // Verify the session belongs to this expert
    const [session] = await executeQuery(
      'SELECT expert_id FROM session_requests WHERE id = ?',
      [id]
    );
    
    if (!session || session.expert_id !== expertId) {
      return res.status(404).json({ error: 'Session not found or not authorized' });
    }
    
    const [feedback] = await executeQuery(`
      SELECT sf.*, u.email AS student_email, sr.skill_requested AS skill_name
      FROM session_feedback sf
      JOIN session_requests sr ON sf.session_id = sr.id
      JOIN users u ON sr.student_id = u.id
      WHERE sf.session_id = ?
    `, [id]);
    
    if (feedback) {
      res.json(feedback);
    } else {
      res.status(404).json({ error: 'Feedback not found' });
    }
  } catch (error) {
    console.error('Error fetching session feedback:', error);
    res.status(500).json({ error: 'Failed to fetch session feedback' });
  }
});

// 2. Skills Endpoints

// Get all skills for an expert
router.get('/skills', async (req, res) => {
  try {
    const expertId = req.session.user.id;
    
    const skills = await executeQuery(`
      SELECT s.*, 
             COUNT(sr.id) AS students_taught,
             AVG(sf.rating) AS average_rating
      FROM skills s
      LEFT JOIN session_requests sr ON s.id = sr.skill_id AND sr.status = 'completed'
      LEFT JOIN session_feedback sf ON sf.session_id = sr.id
      WHERE s.expert_id = ? AND s.status = 'Approved'
      GROUP BY s.id
    `, [expertId]);
    
    res.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

// Add new skill
router.post('/skills', upload.array('proof_files', 5), async (req, res) => {
  try {

    const expertId = req.session.user.id;
    const { skill_name, hourly_rate, description } = req.body;
    const proofFiles = req.files.map(file => `/uploads/${file.filename}`);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
     const skillId = uuidv4();

 const result = await executeQuery(
  'INSERT INTO skills (id, expert_id, skill_name, hourly_rate, description, proof_files, status) VALUES (?, ?, ?, ?, ?, ?, "Pending")',
   [skillId, expertId, skill_name, hourly_rate, description, proofFiles.join(',')]
);


    if (result.affectedRows === 1) {
        return res.json({
            success: true,
            skill_id: skillId,
            message: 'Skill added successfully'
        });
    } else {
        throw new Error('Database insertion failed');
    }
  } catch (error) {
    res.status(500).json({
       error: 'Failed to add skill', 
       details: error.message
      });
  }
});

// Update skill
router.put('/skills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const expertId = req.session.user.id;
    const { skill_name, hourly_rate, description, status } = req.body;
    
    // Verify the skill belongs to this expert
    const [skill] = await executeQuery(
      'SELECT expert_id FROM skills WHERE id = ?',
      [id]
    );
    
    if (!skill || skill.expert_id !== expertId) {
      return res.status(404).json({ error: 'Skill not found or not authorized' });
    }

    // Prevent modifying approved/rejected skills (experts can only edit pending skills)
     if (skill.status !== 'Pending') {
      return res.status(400).json({ 
        error: 'Only pending skills can be modified by experts' 
      });
    }

    await executeQuery(
      'UPDATE skills SET skill_name = ?, hourly_rate = ?, description = ?, proof_files = ? WHERE id = ?',
      [skill_name, hourly_rate, description, id]
    );
    
    res.json({ success: true, message: 'Skill updated successfully' });
  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

// Delete skill
router.delete('/skills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const expertId = req.session.user.id;
    
    // Verify the skill belongs to this expert
    const [skill] = await executeQuery(
      'SELECT proof_files FROM skills WHERE id = ? AND expert_id = ?',
      [id, expertId]
    );
    
    if (!skill || skill.length === 0) {
      return res.status(404).json({ error: 'Skill not found or not authorized' });
    }
    
    // Check if there are any sessions with this skill
    const [sessions] = await executeQuery(
      'SELECT COUNT(*) AS count FROM session_requests WHERE skill_id = ?',
      [id]
    );
    
    if (sessions.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete skill with active or past sessions' 
      });
    }
    // Delete the skill record
    await executeQuery('DELETE FROM skills WHERE id = ?', [id]);

    // Delete associated files
    if (skill[0].proof_files) {
        await deleteSkillFiles(skill[0].proof_files);
    }

    res.json({ success: true, message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

// View pending skills
router.get('/skills/pending', async (req, res) => {
  try {
    const expertId = req.session.user.id;
    const skills = await executeQuery(
      'SELECT * FROM skills WHERE expert_id = ? AND status = "Pending"',
      [expertId]
    );
    res.json(skills);
  } catch (error) {
    console.error('Error fetching pending skills:', error);
    res.status(500).json({ error: 'Failed to fetch pending skills' });
  }
});

// 3. Feedback Endpoints

// Get all feedback for an expert
router.get('/feedback', async (req, res) => {
  try {
    const expertId = req.session.user.id;
    
    const feedback = await executeQuery(`
      SELECT sf.*, u.email AS student_email, sr.skill_requested AS skill_name
      FROM session_feedback sf
      JOIN session_requests sr ON sf.session_id = sr.id
      JOIN users u ON sr.student_id = u.id
      WHERE sr.expert_id = ?
      ORDER BY sf.created_at DESC
    `, [expertId]);
    
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Get all notifications for expert
router.get('/notifications', async (req, res) => {
  try {
    const expertId = req.session.user.id;
    const notifications = await executeQuery(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [expertId]
    );
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const expertId = req.session.user.id;

    // Verify ownership
    const [notification] = await executeQuery(
      'SELECT user_id FROM notifications WHERE id = ?',
      [id]
    );
    
    if (!notification || notification.user_id !== expertId) {
      return res.status(404).json({ error: 'Notification not found or unauthorized' });
    }

    await executeQuery(
      'UPDATE notifications SET is_read = TRUE WHERE id = ?',
      [id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Delete notification
router.delete('/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const expertId = req.session.user.id;

    // Verify ownership
    const [notification] = await executeQuery(
      'SELECT user_id FROM notifications WHERE id = ?',
      [id]
    );
    
    if (!notification || notification.user_id !== expertId) {
      return res.status(404).json({ error: 'Notification not found or unauthorized' });
    }

    await executeQuery(
      'DELETE FROM notifications WHERE id = ?',
      [id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;