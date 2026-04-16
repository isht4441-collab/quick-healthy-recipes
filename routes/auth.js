const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/init');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = await getDb();

    // Check if user already exists
    const existing = db.exec('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, passwordHash]);

    const result = db.exec('SELECT last_insert_rowid() as id');
    const userId = result[0].values[0][0];

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, userId, email });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await getDb();

    const rows = db.exec('SELECT id, email, password_hash FROM users WHERE email = ?', [email]);
    if (rows.length === 0 || rows[0].values.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const [userId, userEmail, passwordHash] = rows[0].values[0];
    const valid = await bcrypt.compare(password, passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, userId, email: userEmail });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
