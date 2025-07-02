const express = require('express');
const router = express.Router();
const db = require('../database');

// Get user by ID (used for profile)
router.get('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const [rows] = await db.execute(
      'SELECT id, name, email, role, skills FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];

    // Get favorite skills 
    let favoriteSkills = [];
    if (user.skills) {
      try {
        favoriteSkills = JSON.parse(user.skills);
        if (!Array.isArray(favoriteSkills)) {
          favoriteSkills = user.skills.split(',').map(skill => skill.trim());
        }
      } catch {
        favoriteSkills = user.skills.split(',').map(skill => skill.trim());
      }
    }


    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      favoriteSkills: user.role === 'student' ? favoriteSkills : undefined
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
