const db = require('../database');

class Activity {
    static async create({ userId, type, description }) {
        const [result] = await db.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [userId, type, description]
        );
        return result;
    }

    static async getRecent(limit = 10) {
        const [activities] = await db.query(
            `SELECT a.*, u.name as user_name, u.email as user_email 
             FROM activities a
             LEFT JOIN users u ON a.user_id = u.id
             ORDER BY timestamp DESC
             LIMIT ?`,
            [limit]
        );
        return activities;
    }
}

module.exports = Activity;