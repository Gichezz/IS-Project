const express = require('express');
const router = express.Router();
const db = require('../database');
const Activity = require('./activity');

function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ message: 'Admin access required' });
}

// Get dashboard stats
router.get('/stats', isAdmin, async (req, res) => {
    try {
        // Get total users count
        const [allUsers] = await db.query(
            'SELECT COUNT(*) as count FROM users'
        );

        // Get pending experts count
        const [pendingExperts] = await db.query(
            'SELECT COUNT(*) as count FROM users WHERE role = "expert" AND approved = 0'
        );
        
        // Get total experts count
        const [totalExperts] = await db.query(
            'SELECT COUNT(*) as count FROM users WHERE role = "expert" AND approved = 1'
        );

        // Get pending skill approvals
        const [pendingSkills] = await db.query(
            "SELECT COUNT(*) AS count FROM skills WHERE status = 'Pending'"
        );

        // Get total revenue from mpesa_payments
        const [revenueRows] = await db.query(
            'SELECT SUM(amount) as total FROM mpesa_payments'
        );
        const totalRevenue = revenueRows[0].total || 0;

        // Get recent activities
        const recentActivities = await Activity.getRecent(5);
        
        res.json({
            pendingExperts: pendingExperts[0].count,
            totalExperts: totalExperts[0].count,
            pendingSkills: pendingSkills[0].count,
            allUsers: allUsers[0].count,
            totalRevenue,
            recentActivities
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get pending experts
router.get('/pending-experts', isAdmin, async (req, res) => {
    try {
        const [experts] = await db.query(
            'SELECT * FROM users WHERE role = "expert" AND approved = 0'
        );
        res.json(experts || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update expert status
router.put('/experts/:id/status', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { approved } = req.body;
        
        // Update expert status
        await db.query(
            'UPDATE users SET approved = ? WHERE id = ?',
            [approved ? 1 : 0, id]
        );
        
        // Get user info for activity log
        const [user] = await db.query(
            'SELECT name, email FROM users WHERE id = ?',
            [id]
        );
        
        // Log the activity
        const activityType = approved ? 'Expert Approved' : 'Expert Rejected';
        const description = `${user[0].name} (${user[0].email}) was ${approved ? 'approved' : 'rejected'}`;
        
        await Activity.create({
            userId: id,
            type: activityType,
            description
        });

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Soft delete/suspend user
router.put('/users/:id/status', isAdmin, async (req, res) => {
    try{
        const { status } = req.body; // 'active', 'suspended', or 'deleted'
        
        await db.query(
            `UPDATE users 
            SET approved = CASE 
                WHEN ? = 'deleted' THEN -1 
                WHEN ? = 'suspended' THEN 0
                ELSE 1 
            END
            WHERE id = ?`,
            [status, status, req.params.id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// View all users
router.get('/users', isAdmin, async (req, res) => {
    const [users] = await db.query(`
        SELECT id, name, email, role, approved, 
               DATE_FORMAT(created_at, '%Y-%m-%d') as join_date
        FROM users
        ORDER BY created_at DESC
    `);
    res.json(users);
});

// Get pending skills
router.get('/skills', isAdmin, async (req, res) => {
    try {
        const { filter = 'pending' } = req.query; // Default: 'pending'
        
        let query = `
            SELECT s.*, u.email AS expert_email
            FROM skills s
            JOIN users u ON s.expert_id = u.id
        `;

        if (filter !== 'all') {
            query += ` WHERE s.status = ?`;
            const [skills] = await db.query(query, [filter.charAt(0).toUpperCase() + filter.slice(1)]);
            res.json(skills);
        } else {
            const [skills] = await db.query(query);
            res.json(skills);
        }
    } catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
});

// Update skill status
router.put('/skills/:id/status', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;
        
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        // Update skill status
        await db.query(
            'UPDATE skills SET status = ? WHERE id = ?',
            [status, id]
        );

        // Get skill info for activity log
        const [skillRows] = await db.query(
            'SELECT skill_name, expert_id FROM skills WHERE id = ?',
            [id]
        );

        if (!skillRows.length) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        const skill = skillRows[0];

        // Log this activity
        await Activity.create({
            userId: skill.expert_id,
            type: `Skill ${status}`,
            description: `"${skill.skill_name}" was ${status.toLowerCase()}`
        });

        // Notify expert
        await notifyExpert(id, status, reason);

        res.json({ 
            success: true,
            message: `Skill ${status.toLowerCase()} successfully`
        });
    } catch (error) {
        console.error('Error updating skill status:', error);
        res.status(500).json({ error: 'Failed to update skill status' });
    }
});

const notifyExpert = async (skillId, action, reason = '') => {
    // Get skill and expert info
    const [skillRows] = await db.query(
        'SELECT skill_name, expert_id FROM skills WHERE id = ?', 
        [skillId]
    );

    if (skillRows.length === 0) {
        throw new Error(`Skill with ID ${skillId} not found`);
    }

    const skill = skillRows[0];

    const [expertRows] = await db.query(
        'SELECT id, email FROM users WHERE id = ?', 
        [skill.expert_id]
    );

    if (expertRows.length === 0) {
        throw new Error(`Expert with ID ${skill.expert_id} not found`);
    }

    const expert = expertRows[0];

    // Save to database
    await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [expert.id, `Your skill "${skill.skill_name}" was ${action}. ${reason}`]
    );
};

module.exports = router;