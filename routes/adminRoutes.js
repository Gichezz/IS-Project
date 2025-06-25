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
        // Get pending experts count
        const [pendingExperts] = await db.promise().query(
            'SELECT COUNT(*) as count FROM users WHERE role = "expert" AND approved = 0'
        );
        
        // Get total experts count
        const [totalExperts] = await db.promise().query(
            'SELECT COUNT(*) as count FROM users WHERE role = "expert" AND approved = 1'
        );
        
        // Get recent activities
        const recentActivities = await Activity.getRecent(5);
        
        res.json({
            pendingExperts: pendingExperts[0].count,
            totalExperts: totalExperts[0].count,
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
        const [experts] = await db.promise().query(
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
        await db.promise().query(
            'UPDATE users SET approved = ? WHERE id = ?',
            [approved ? 1 : 0, id]
        );
        
        // Get user info for activity log
        const [user] = await db.promise().query(
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

module.exports = router;