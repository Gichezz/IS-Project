const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require('crypto');
const multer = require("multer");
const path = require("path");
const db = require('../database');
const router = express.Router();
const Activity = require('./activity');
const sendEmail = require('../sendEmail')


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
    console.log("📥 Student Registration Request:", { name, email, password, selectedSkills });

    if (!name || !email || !password || !selectedSkills) {
        return res.status(400).send('Please fill in all required fields.');
    }

    const emailRegex = /^[^\s@]+@strathmore\.edu$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send('Email must be a valid @strathmore.edu address.');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("🔐 Hashed Password:", hashedPassword);

        const sql = `
    INSERT INTO users (id, name, email, password, role, skills)
    VALUES (UUID(), ?, ?, ?, 'student', ?)
`;

        console.log("Registering student...");
        // Insert user
        await db.execute(sql, [name, email, hashedPassword, selectedSkills]);

        // Retrieve inserted UUID
        const [rows] = await db.execute(`SELECT id FROM users WHERE email = ?`, [email]);
        const insertedId = rows[0]?.id;

        // Log activity
        try {
            await Activity.create({
                userId: insertedId,
                type: 'New Registration',
                description: `${name} (${email}) registered as student`
            });
        } catch (activityErr) {
            console.error('Activity log failed:', activityErr);
        }

        return res.redirect('/login.html');
    } catch (err) {
        console.error('Registration error:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).send('Email already in use.');
        }
        return res.status(500).send('Server error: ' + err.message);
    }
});



// EXPERT REGISTRATION 
router.post('/register-expert', upload.array('files'), async (req, res) => {
    const { name, email, password, selectedSkills, description } = req.body;
    const files = req.files;

    console.log("📥 Expert Registration Request:", { name, email, password, selectedSkills, description, files });

    if (!name || !email || !password || !description || !selectedSkills) {
        return res.status(400).send("Please fill in all required fields.");
    }

    const emailRegex = /^[^\s@]+@strathmore\.edu$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send("Email must be a valid @strathmore.edu address.");
    }

    if (!files || files.length === 0) {
        return res.status(400).send("Please upload at least one file.");
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const fileNames = files.map(f => f.filename).join(',');

        console.log("🔐 Hashed Password:", hashedPassword);
        console.log("📎 Uploaded Files:", fileNames);

        const sql = `
            INSERT INTO users (id, name, email, password, role, skills, description, files)
            VALUES (UUID(), ?, ?, ?, 'expert', ?, ?, ?)
        `;

        const [result] = await db.execute(sql, [name, email, hashedPassword, selectedSkills, description, fileNames]);
        console.log("✅ Expert Insert Result:", result);

            // Fetch UUID of newly registered expert
            const [rows] = await db.execute(`SELECT id FROM users WHERE email = ?`, [email]);
            const insertedId = rows[0]?.id; //  This replaces result.insertId

            Activity.create({
                userId: insertedId, //  Use actual UUID
                type: 'New Registration',
                description: `${name} (${email}) registered as expert`
            })
            .then( async () => {
                await sendEmail(
                    email,
                    'Welcome to SkillSwap!',
                    `Hello ${name}, thank you for registering as an expert on SkillSwap. Your account is under review.`,
                    `
                        <h2>Hello ${name},</h2>
                        <p>Thank you for registering as an <strong>expert</strong> on <span style="color:#2ecc71;">SkillSwap</span>.</p>
                        <p>Your account is under review. We'll notify you once approved.</p>
                        <br/>
                        <p>Best,<br/>SkillSwap</p>
                    `
                );
                 res.redirect('/login.html')
            })
            .catch(err => {
                console.error('Error creating activity:', err);
                res.redirect('/login.html');
            });
        
    }
     catch (err) {
        console.error("❌ Expert Registration Error:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).send('Email already in use.');
        }
        return res.status(500).send('Database error: ' + err.message);
    }
});


// ADMIN REGISTRATION
router.post('/register-admin', async (req, res) => {
    const { name, email, password, adminKey } = req.body;
    console.log("📥 Admin Registration Request:", { name, email, password, adminKey });

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
        const [existing] = await db.execute(
            'SELECT * FROM users WHERE email = ? AND role = "admin"', 
            [email]
        );
        if (existing.length > 0) {
            return res.status(400).send("Admin already exists");
        }


        // 4. Create admin
        const hashedPassword = await bcrypt.hash(password, 10); // hash first
        console.log("🔐 Hashed Password (admin):", hashedPassword);

        const [result] = await db.execute(
            `INSERT INTO users (id, name, email, password, role, approved, skills)
            VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, 'admin', 1, 'admin']
        );

        // Retrieve UUID from DB
        const [user] = await db.execute(
        `SELECT id FROM users WHERE email = ? AND role = 'admin'`,
        [email]
        );
        
        // Use correct UUID for activity
        try{
            await Activity.create({
                userId: user[0].id,
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
router.get('/admin/pending-experts', ensureAuthenticated, async (req, res) => {
    try {
        // Verify admin role
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const sql = `SELECT * FROM users WHERE role = 'expert' AND approved = 0`;
        const [results] = await db.execute(sql);

        res.json(results);
    } catch (err) {
    console.error('Error fetching pending experts:', err);
    res.status(500).json({ error: 'Database error' });
  }
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
        const [result] = await db.execute(
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
        const [users] = await db.execute(
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



// GET: Return Expert Info for Display Cards
router.get('/expert-cards', async (req, res) => {
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



// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
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
            return res.status(403).json({ success: false, message: 'Your account is pending approval.' });
        }

        // Save login session
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        // Save the session before sending response
        req.session.save(err => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ success: false, message: 'Login failed.' });
            }
            
            // Return JSON response
            return res.json({
                success: true,
                userId: user.id,
                userEmail: user.email,
                role: user.role
            });
        });


    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// forgot password route
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            // Return success message even if email doesn't exist to prevent email harvesting
            return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
        }

        const user = users[0];

        // Generate secure token and expiry
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour from now

        // Save token to database
        await db.execute(
            'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
            [token, expires, email]
        );

        const resetLink = `http://localhost:3010/resetPassword.html?token=${token}`; // adjust your domain

        const text = `
            Hello ${user.name},

            You requested a password reset. Click the link below to reset your password:
            ${resetLink}

            If you did not request this, you can safely ignore this email.

            - SkillSwap Team
        `;

        const html = `
            <p>Hello ${user.name},</p>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>If you did not request this, you can safely ignore this email.</p>
            <p>- SkillSwap Team</p>
        `;

        await sendEmail(email, 'Password Reset Request', text, html);

        return res.status(200).json({ message: 'A reset link has been sent to your email.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
});

// reset password route
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Missing token or password.' });
    }

    try {
        // Check for user with this reset token and valid expiry
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
            [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }

        const user = rows[0];

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password and clear token fields
        await db.execute(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );

        return res.json({ message: 'Password reset successful.' });
    } catch (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({ message: 'Server error. Please try again.' });
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
// GET: Current Logged-in User
router.get('/current', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: 'Not logged in' });
  }
});


module.exports = router;