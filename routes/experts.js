const express = require('express');
const router = express.Router();
const db = require('../database');

// GET: Return Expert Info for Display Cards
router.get('/cards', async (req, res) => {
  try {
    const sql = `
      SELECT 
        u.id AS expert_id,
        u.name,
        u.description,
        s.id AS skill_id, 
        s.skill_name,
        s.hourly_rate,
        s.status
      FROM users u
      JOIN skills s ON u.id = s.expert_id
      WHERE u.role = 'expert' AND u.approved = 1 AND s.status = 'Approved'
    `;

    const [rows] = await db.execute(sql);

    // Group skills by expert
    const expertMap = new Map();

    for (const row of rows) {
      const id = row.expert_id;

      if (!expertMap.has(id)) {
        expertMap.set(id, {
          id,
          name: row.name,
          description: row.description,
          skillDataAttr: [],
          time: "Flexible",
          price: row.hourly_rate,
          image: "/images/0684456b-aa2b-4631-86f7-93ceaf33303c.jpg"
        });
      }

      expertMap.get(id).skillDataAttr.push({
        skill_id: row.skill_id,
        skill_name: row.skill_name,
      });
    }

    // Final formatting
    const formatted = Array.from(expertMap.values()).map(expert => ({
      ...expert,
      skillDataAttr: JSON.stringify(expert.skillDataAttr) // Send as JSON string
    }));

    res.json(formatted);

  } catch (err) {
    console.error('Error fetching expert cards:', err);
    res.status(500).json({ error: 'Failed to load expert cards' });
  }
});

// GET: Get experts by skill
router.get('/by-skill/:skillSlug', async (req, res) => {
  try {
    const { skillSlug } = req.params;
    const skillName = skillSlug.replace(/-/g, ' ');

    const sql = `
      SELECT 
        u.id AS expert_id,
        u.name,
        u.description,
        s.id AS skill_id, 
        s.skill_name,
        s.hourly_rate,
        s.status,
        COUNT(sr.id) AS session_count,
        AVG(sf.rating) AS avg_rating
      FROM users u
      JOIN skills s ON u.id = s.expert_id
      LEFT JOIN session_requests sr ON s.id = sr.skill_id AND sr.status = 'completed'
      LEFT JOIN session_feedback sf ON sr.id = sf.session_id
      WHERE u.role = 'expert' 
        AND u.approved = 1 
        AND s.status = 'Approved'
        AND LOWER(s.skill_name) LIKE ?
      GROUP BY u.id, s.id
      ORDER BY avg_rating DESC, session_count DESC
    `;

    const [rows] = await db.execute(sql, [`%${skillName}%`]);

    // Group skills by expert
    const expertMap = new Map();

    for (const row of rows) {
      const id = row.expert_id;

      if (!expertMap.has(id)) {
        expertMap.set(id, {
          id,
          name: row.name,
          description: row.description,
          skillDataAttr: [],
          time: "Flexible",
          price: row.hourly_rate,
          image: "/images/0684456b-aa2b-4631-86f7-93ceaf33303c.jpg",
          session_count: row.session_count,
          avg_rating: row.avg_rating ? parseFloat(row.avg_rating).toFixed(1) : 'No rating'
        });
      }

      expertMap.get(id).skillDataAttr.push({
        skill_id: row.skill_id,
        skill_name: row.skill_name,
      });
    }

    // Final formatting
    const formatted = Array.from(expertMap.values()).map(expert => ({
      ...expert,
      skillDataAttr: JSON.stringify(expert.skillDataAttr)
    }));

    res.json(formatted);

  } catch (err) {
    console.error('Error fetching experts by skill:', err);
    res.status(500).json({ error: 'Failed to load experts by skill' });
  }
});

// GET: Search experts by name or skill
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const sql = `
      SELECT 
        u.id AS expert_id,
        u.name,
        u.description,
        s.id AS skill_id, 
        s.skill_name,
        s.hourly_rate,
        s.status,
        COUNT(sr.id) AS session_count,
        AVG(sf.rating) AS avg_rating
      FROM users u
      JOIN skills s ON u.id = s.expert_id
      LEFT JOIN session_requests sr ON s.id = sr.skill_id AND sr.status = 'completed'
      LEFT JOIN session_feedback sf ON sr.id = sf.session_id
      WHERE u.role = 'expert' 
        AND u.approved = 1 
        AND s.status = 'Approved'
        AND (LOWER(u.name) LIKE ? OR LOWER(s.skill_name) LIKE ?)
      GROUP BY u.id, s.id
      ORDER BY avg_rating DESC, session_count DESC
    `;

    const searchTerm = `%${query.toLowerCase()}%`;
    const [rows] = await db.execute(sql, [searchTerm, searchTerm]);

    // Group skills by expert
    const expertMap = new Map();

    for (const row of rows) {
      const id = row.expert_id;

      if (!expertMap.has(id)) {
        expertMap.set(id, {
          id,
          name: row.name,
          description: row.description,
          skillDataAttr: [],
          time: "Flexible",
          price: row.hourly_rate,
          image: "/images/0684456b-aa2b-4631-86f7-93ceaf33303c.jpg",
          session_count: row.session_count,
          avg_rating: row.avg_rating ? parseFloat(row.avg_rating).toFixed(1) : 'No rating'
        });
      }

      expertMap.get(id).skillDataAttr.push({
        skill_id: row.skill_id,
        skill_name: row.skill_name,
      });
    }

    // Final formatting
    const formatted = Array.from(expertMap.values()).map(expert => ({
      ...expert,
      skillDataAttr: JSON.stringify(expert.skillDataAttr)
    }));

    res.json(formatted);

  } catch (err) {
    console.error('Error searching experts:', err);
    res.status(500).json({ error: 'Failed to search experts' });
  }
});

// GET: Get expert details by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.description,
        s.id AS skill_id,
        s.skill_name,
        s.hourly_rate,
        s.description AS skill_description,
        COUNT(sr.id) AS total_sessions,
        AVG(sf.rating) AS avg_rating,
        COUNT(DISTINCT sr.student_id) AS unique_students
      FROM users u
      LEFT JOIN skills s ON u.id = s.expert_id AND s.status = 'Approved'
      LEFT JOIN session_requests sr ON s.id = sr.skill_id AND sr.status = 'completed'
      LEFT JOIN session_feedback sf ON sr.id = sf.session_id
      WHERE u.id = ? AND u.role = 'expert' AND u.approved = 1
      GROUP BY u.id, s.id
    `;

    const [rows] = await db.execute(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Expert not found' });
    }

    // Group skills
    const expert = {
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      description: rows[0].description,
      image: "/images/0684456b-aa2b-4631-86f7-93ceaf33303c.jpg",
      skills: [],
      stats: {
        total_sessions: 0,
        avg_rating: 'No rating',
        unique_students: 0
      }
    };

    rows.forEach(row => {
      if (row.skill_id) {
        expert.skills.push({
          id: row.skill_id,
          name: row.skill_name,
          hourly_rate: row.hourly_rate,
          description: row.skill_description
        });
      }
      
      // Update stats (will be the same for all rows)
      expert.stats.total_sessions = row.total_sessions || 0;
      expert.stats.avg_rating = row.avg_rating ? parseFloat(row.avg_rating).toFixed(1) : 'No rating';
      expert.stats.unique_students = row.unique_students || 0;
    });

    res.json(expert);

  } catch (err) {
    console.error('Error fetching expert details:', err);
    res.status(500).json({ error: 'Failed to load expert details' });
  }
});

// GET: Get top rated experts
router.get('/top-rated/:limit', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;

    const sql = `
      SELECT 
        u.id AS expert_id,
        u.name,
        u.description,
        s.id AS skill_id, 
        s.skill_name,
        s.hourly_rate,
        AVG(sf.rating) AS avg_rating,
        COUNT(sr.id) AS session_count
      FROM users u
      JOIN skills s ON u.id = s.expert_id
      LEFT JOIN session_requests sr ON s.id = sr.skill_id AND sr.status = 'completed'
      LEFT JOIN session_feedback sf ON sr.id = sf.session_id
      WHERE u.role = 'expert' 
        AND u.approved = 1 
        AND s.status = 'Approved'
      GROUP BY u.id, s.id
      HAVING avg_rating IS NOT NULL
      ORDER BY avg_rating DESC, session_count DESC
      LIMIT ?
    `;

    const [rows] = await db.execute(sql, [limit]);

    // Group skills by expert
    const expertMap = new Map();

    for (const row of rows) {
      const id = row.expert_id;

      if (!expertMap.has(id)) {
        expertMap.set(id, {
          id,
          name: row.name,
          description: row.description,
          skillDataAttr: [],
          time: "Flexible",
          price: row.hourly_rate,
          image: "/images/0684456b-aa2b-4631-86f7-93ceaf33303c.jpg",
          avg_rating: parseFloat(row.avg_rating).toFixed(1),
          session_count: row.session_count
        });
      }

      expertMap.get(id).skillDataAttr.push({
        skill_id: row.skill_id,
        skill_name: row.skill_name,
      });
    }

    // Final formatting
    const formatted = Array.from(expertMap.values()).map(expert => ({
      ...expert,
      skillDataAttr: JSON.stringify(expert.skillDataAttr)
    }));

    res.json(formatted);

  } catch (err) {
    console.error('Error fetching top rated experts:', err);
    res.status(500).json({ error: 'Failed to load top rated experts' });
  }
});

// GET: Get experts statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const sql = `
      SELECT 
        COUNT(DISTINCT u.id) AS total_experts,
        COUNT(DISTINCT s.skill_name) AS total_skills,
        AVG(s.hourly_rate) AS avg_rate,
        COUNT(sr.id) AS total_sessions,
        AVG(sf.rating) AS avg_rating
      FROM users u
      LEFT JOIN skills s ON u.id = s.expert_id AND s.status = 'Approved'
      LEFT JOIN session_requests sr ON s.id = sr.skill_id AND sr.status = 'completed'
      LEFT JOIN session_feedback sf ON sr.id = sf.session_id
      WHERE u.role = 'expert' AND u.approved = 1
    `;

    const [rows] = await db.execute(sql);
    const stats = rows[0];

    res.json({
      total_experts: stats.total_experts,
      total_skills: stats.total_skills,
      avg_rate: Math.round(stats.avg_rate || 0),
      total_sessions: stats.total_sessions,
      avg_rating: stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : 'No rating'
    });

  } catch (err) {
    console.error('Error fetching experts statistics:', err);
    res.status(500).json({ error: 'Failed to load experts statistics' });
  }
});

module.exports = router; 