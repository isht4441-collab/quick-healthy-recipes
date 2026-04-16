const express = require('express');
const db = require('../db/init');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT day, meal, dish, time FROM timetable_entries WHERE user_id = ?').all(req.userId);
  const data = {};
  rows.forEach(r => {
    data[r.day + '_' + r.meal] = { dish: r.dish, time: r.time };
  });
  res.json(data);
});

const saveTimetable = db.transaction((userId, data) => {
  db.prepare('DELETE FROM timetable_entries WHERE user_id = ?').run(userId);
  const insert = db.prepare('INSERT INTO timetable_entries (user_id, day, meal, dish, time) VALUES (?, ?, ?, ?, ?)');
  for (const [key, value] of Object.entries(data)) {
    const parts = key.split('_');
    const day = parts[0];
    const meal = parts.slice(1).join('_');
    if (value.dish || value.time) {
      insert.run(userId, day, meal, value.dish || '', value.time || '');
    }
  }
});

router.put('/', (req, res) => {
  saveTimetable(req.userId, req.body);
  res.json({ success: true });
});

router.delete('/', (req, res) => {
  db.prepare('DELETE FROM timetable_entries WHERE user_id = ?').run(req.userId);
  res.json({ success: true });
});

module.exports = router;
