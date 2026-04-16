const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb, saveDb } = require('../db/init');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const db = await getDb();

  const existing = db.exec('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0 && existing[0].values.length > 0) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const hash = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, hash]);

  const result = db.exec('SELECT last_insert_rowid() as id');
  const userId = result[0].values[0][0];
  saveDb();

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: userId, email } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = await getDb();

  const rows = db.exec('SELECT id, email, password_hash FROM users WHERE email = ?', [email]);
  if (rows.length === 0 || rows[0].values.length === 0) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const user = { id: rows[0].values[0][0], email: rows[0].values[0][1], password_hash: rows[0].values[0][2] };

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email } });
});

module.exports = router;
