const express = require('express');
const router = express.Router();
const db = require('../database');

// GET: Return All Available Skills for Display
router.get('/available', async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT 
        s.skill_name,
        s.id AS skill_id,
        COUNT(DISTINCT s.expert_id) AS expert_count,
        AVG(s.hourly_rate) AS avg_rate
      FROM skills s
      JOIN users u ON s.expert_id = u.id
      WHERE u.role = 'expert' 
        AND u.approved = 1 
        AND s.status = 'Approved'
      GROUP BY s.skill_name, s.id
      ORDER BY expert_count DESC, s.skill_name ASC
    `;

    const [rows] = await db.execute(sql);

    // Format the response
    const skills = rows.map(row => ({
      id: row.skill_id,
      name: row.skill_name,
      expert_count: row.expert_count,
      avg_rate: Math.round(row.avg_rate || 0),
      slug: row.skill_name.toLowerCase().replace(/\s+/g, '-')
    }));

    res.json(skills);

  } catch (err) {
    console.error('Error fetching available skills:', err);
    res.status(500).json({ error: 'Failed to load available skills' });
  }
});

// GET: Get skills by category or search
router.get('/search', async (req, res) => {
  try {
    const { category, query } = req.query;
    let sql = `
      SELECT DISTINCT 
        s.skill_name,
        s.id AS skill_id,
        COUNT(DISTINCT s.expert_id) AS expert_count,
        AVG(s.hourly_rate) AS avg_rate
      FROM skills s
      JOIN users u ON s.expert_id = u.id
      WHERE u.role = 'expert' 
        AND u.approved = 1 
        AND s.status = 'Approved'
    `;

    const params = [];

    if (category) {
      sql += ` AND s.skill_name LIKE ?`;
      params.push(`%${category}%`);
    }

    if (query) {
      sql += ` AND (s.skill_name LIKE ? OR s.description LIKE ?)`;
      params.push(`%${query}%`, `%${query}%`);
    }

    sql += ` GROUP BY s.skill_name, s.id ORDER BY expert_count DESC, s.skill_name ASC`;

    const [rows] = await db.execute(sql, params);

    const skills = rows.map(row => ({
      id: row.skill_id,
      name: row.skill_name,
      expert_count: row.expert_count,
      avg_rate: Math.round(row.avg_rate || 0),
      slug: row.skill_name.toLowerCase().replace(/\s+/g, '-')
    }));

    res.json(skills);

  } catch (err) {
    console.error('Error searching skills:', err);
    res.status(500).json({ error: 'Failed to search skills' });
  }
});

// GET: Get skill details by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        s.*,
        COUNT(DISTINCT s.expert_id) AS expert_count,
        AVG(s.hourly_rate) AS avg_rate,
        MIN(s.hourly_rate) AS min_rate,
        MAX(s.hourly_rate) AS max_rate
      FROM skills s
      JOIN users u ON s.expert_id = u.id
      WHERE s.id = ? 
        AND u.role = 'expert' 
        AND u.approved = 1 
        AND s.status = 'Approved'
      GROUP BY s.skill_name
    `;

    const [rows] = await db.execute(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const skill = rows[0];
    res.json({
      id: skill.skill_id,
      name: skill.skill_name,
      expert_count: skill.expert_count,
      avg_rate: Math.round(skill.avg_rate || 0),
      min_rate: Math.round(skill.min_rate || 0),
      max_rate: Math.round(skill.max_rate || 0),
      slug: skill.skill_name.toLowerCase().replace(/\s+/g, '-')
    });

  } catch (err) {
    console.error('Error fetching skill details:', err);
    res.status(500).json({ error: 'Failed to load skill details' });
  }
});

// GET: Get popular skills (top skills by expert count)
router.get('/popular/:limit', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 8;
    
    const sql = `
      SELECT DISTINCT 
        s.skill_name,
        s.id AS skill_id,
        COUNT(DISTINCT s.expert_id) AS expert_count,
        AVG(s.hourly_rate) AS avg_rate
      FROM skills s
      JOIN users u ON s.expert_id = u.id
      WHERE u.role = 'expert' 
        AND u.approved = 1 
        AND s.status = 'Approved'
      GROUP BY s.skill_name, s.id
      ORDER BY expert_count DESC, s.skill_name ASC
      LIMIT ?
    `;

    const [rows] = await db.execute(sql, [limit]);

    const skills = rows.map(row => ({
      id: row.skill_id,
      name: row.skill_name,
      expert_count: row.expert_count,
      avg_rate: Math.round(row.avg_rate || 0),
      slug: row.skill_name.toLowerCase().replace(/\s+/g, '-')
    }));

    res.json(skills);

  } catch (err) {
    console.error('Error fetching popular skills:', err);
    res.status(500).json({ error: 'Failed to load popular skills' });
  }
});

// GET: Get skills statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const sql = `
      SELECT 
        COUNT(DISTINCT s.skill_name) AS total_skills,
        COUNT(DISTINCT s.expert_id) AS total_experts,
        AVG(s.hourly_rate) AS avg_rate,
        MIN(s.hourly_rate) AS min_rate,
        MAX(s.hourly_rate) AS max_rate
      FROM skills s
      JOIN users u ON s.expert_id = u.id
      WHERE u.role = 'expert' 
        AND u.approved = 1 
        AND s.status = 'Approved'
    `;

    const [rows] = await db.execute(sql);
    const stats = rows[0];

    res.json({
      total_skills: stats.total_skills,
      total_experts: stats.total_experts,
      avg_rate: Math.round(stats.avg_rate || 0),
      min_rate: Math.round(stats.min_rate || 0),
      max_rate: Math.round(stats.max_rate || 0)
    });

  } catch (err) {
    console.error('Error fetching skills statistics:', err);
    res.status(500).json({ error: 'Failed to load skills statistics' });
  }
});

module.exports = router; 