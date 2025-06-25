const express = require("express");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const db = require('../database');
const router = express.Router();
const Activity = require('./activity');

// Multer storage config
const storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

// STUDENT REGISTRATION 
router.post('/register-student', async (req, res) => {
    const { name, email, password, selectedSkills } = req.body;

    // Backend field validation
    if (!name || !email || !password || !selectedSkills) {
        return res.status(400).send('Please fill in all required fields.');
    }

    // Basic email validation (same as frontend)
    const emailRegex = /^[^\s@]+@strathmore\.edu$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send('Email must be a valid @strathmore.edu address.');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO users (name, email, password, role, skills) VALUES (?, ?, ?, 'student', ?)`;

        db.query(sql, [name, email, hashedPassword, selectedSkills], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).send('Email already in use.');
                }
                return res.status(500).send('Database error: ' + err.message);
            }
            const insertedId = result.insertId;
            // Activity logging using Promise
            Activity.create({
                userId: insertedId,
                type: 'New Registration',
                description: `${name} (${email}) registered as student`
            })
            .then(() => {
                res.redirect('/login.html');
            })
            .catch(err => {
                console.error('Error creating activity:', err);
                res.redirect('/login.html');
            });
        });
    } catch (err) {
        res.status(500).send('Server error: ' + err.message);
    }
});

//  EXPERT REGISTRATION 
router.post('/register-expert', upload.array('files'), async (req, res) => {
    const { name, email, password, selectedSkills, description } = req.body;
    const files = req.files;

    // Required fields
    if (!name || !email || !password || !description || !selectedSkills) {
        return res.status(400).send("Please fill in all required fields.");
    }

    // Email format check
    const emailRegex = /^[^\s@]+@strathmore\.edu$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send("Email must be a valid @strathmore.edu address.");
    }

    // Must upload at least one file
    if (!files || files.length === 0) {
        return res.status(400).send("Please upload at least one file.");
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const fileNames = files.map(f => f.filename).join(',');
        const sql = `
            INSERT INTO users (name, email, password, role, skills, description, files)
            VALUES (?, ?, ?, 'expert', ?, ?, ?)
        `;

        db.query(sql, [name, email, hashedPassword, selectedSkills, description, fileNames], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).send('Email already in use.');
                }
                return res.status(500).send('Database error: ' + err.message);
            }
            const insertedId = result.insertId;
            Activity.create({
                userId: insertedId,
                type: 'New Registration',
                description: `${name} (${email}) registered as expert`
            })
            .then(() => {
                res.redirect('/login.html');
            })
            .catch(err => {
                console.error('Error creating activity:', err);
                res.redirect('/login.html');
            });
        });
    } catch (err) {
        res.status(500).send("Server error: " + err.message);
    }
});

// ADMIN REGISTRATION
router.post('/register-admin', async (req, res) => {
    const { name, email, password, adminKey } = req.body;

    // 1. Validate secret key
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
        return res.status(403).send("Invalid admin key");
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@strathmore\.edu$/i;
    if (!emailRegex.test(email)) {
        return res.status(400).send("Must use Strathmore email");
    }

    try {
        // 3. Check if admin exists
        const [existing] = await db.promise().query(
            'SELECT * FROM users WHERE email = ? AND role = "admin"', 
            [email]
        );
        if (existing.length > 0) {
            return res.status(400).send("Admin already exists");
        }

        // 4. Create admin
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.promise().query(
            `INSERT INTO users (name, email, password, role, approved, skills) 
             VALUES (?, ?, ?, 'admin', 1, 'admin')`,
            [name, email, hashedPassword]
        );

        const insertedId = result.insertId;
        // 5. Log activity
        try {
            await Activity.create({
                userId: insertedId,
                type: 'New Registration',
                description: `${name} (${email}) registered as admin`
            });
        } catch (err) {
            console.error("Error creating activity:", err);
        }

        res.status(200).send("Admin created");
    } catch (err) {
        console.error("Admin creation error:", err);
        res.status(500).send("Database error");
    }
});

// Get pending experts
router.get('/admin/pending-experts', ensureAuthenticated, (req, res) => {
  // Verify admin role
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const sql = `SELECT * FROM users WHERE role = 'expert' AND approved = 0`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// Update user status (approve, reject, suspend, delete)
router.put('/admin/users/:id/status', ensureAuthenticated, async (req, res) => {
    // Verify admin role
    if (req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const userId = req.params.id;
    const { status } = req.body;

    try {
        // Ensure status is valid
        if (![-1, 0, 1].includes(Number(status))) {
            return res.status(400).send("Invalid status value");
        }

        // Update user status
        const [result] = await db.promise().query(
            'UPDATE users SET approved = ? WHERE id = ?',
            [status, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).send("User not found");
        }

        res.status(200).send("Status updated");
    } catch (err) {
        console.error("Status update error:", err);
        res.status(500).send("Database error");
    }
});

// GET all users (for admin user management)
router.get('/admin/users', ensureAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        const [users] = await db.promise().query(
            'SELECT id, name, email, role, approved, skills FROM users'
        );
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Database error' });
    }
});


// Auto-approve expert
/* router.put('/api/approve-expert/:id', (req, res) => {
  const expertId = req.params.id;
  const sql = `UPDATE users SET approved = 1 WHERE id = ?`;

  db.query(sql, [expertId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to approve expert' });
    res.json({ success: true });
  });
}); */

// LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).send('Invalid email or password.');
        }

        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).send('Invalid email or password.');
        }

        // Block unapproved experts
        if (user.role === 'expert' && user.approved !== 1) {
            try {
                await Activity.create({
                    userId: user.id,
                    type: 'Blocked Login',
                    description: `${user.name} (${user.email}) attempted login before approval`
                });
            } catch (activityErr) {
                console.error('Failed to log blocked login activity:', activityErr);
            }
            return res.status(403).send('Your account is pending for approval.');
        }

        // Save login session
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        // Role-based redirect
        if (user.role === 'student') {
            return res.redirect('/home.html');
        } else if (user.role === 'expert') {
            return res.redirect('/expert-dashboard.html');
        }else if (user.role === 'admin'){
            req.session.user = { ...user, isAdmin: true };
            return res.redirect('/admin-dashboard.html');
        } else {
            return res.status(400).send('Unknown user role.');
        }

    } catch (error) {
        console.error(error);
        return res.status(500).send('Server error. Please try again.');
    }
});

// logout route
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send('Could not log out.');
    res.redirect('/login.html');
  });
});

// Middleware to check session (for any protected routes)
function ensureAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login.html');
}

// Example protected route (for profile page)
router.get('/profile', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/profile.html'));
});

module.exports = router;