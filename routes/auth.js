const express = require("express");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const db = require('../database');
const router = express.Router();

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
    const { name, email, password } = req.body;

    // Backend field validation
    if (!name || !email || !password) {
        return res.status(400).send('Please fill in all required fields.');
    }

    // Basic email validation (same as frontend)
    const emailRegex = /^[^\s@]+@strathmore\.edu$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send('Email must be a valid @strathmore.edu address.');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'student')`;

        db.query(sql, [name, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).send('Email already in use.');
                }
                return res.status(500).send('Database error: ' + err.message);
            }

            res.redirect('/login.html');
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

            res.redirect('/login.html');
        });
    } catch (err) {
        res.status(500).send("Server error: " + err.message);
    }
});


// LOGIN
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query(`SELECT * FROM users WHERE email = ?`, [email], async (err, results) => {
        if (err || results.length === 0) return res.status(401).send('User not found');

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) return res.status(403).send('Incorrect password');

        // Redirect based on user role
        if (user.role === 'student') {
            res.redirect('/home.html');
        } else if (user.role === 'expert') {
            res.redirect('/expert-landing.html'); // create this file later
        } else {
            res.status(400).send('Unknown User');
        }
    });
});

module.exports = router;