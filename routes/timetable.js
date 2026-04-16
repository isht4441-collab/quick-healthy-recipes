const express = require('express');
const { getDb, saveDb } = require('../db/init');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const db = await getDb();
  const rows = db.exec('SELECT day, meal, dish, time FROM timetable_entries WHERE user_id = ?', [req.userId]);
  const data = {};
  if (rows.length > 0) {
    rows[0].values.forEach(r => {
      data[r[0] + '_' + r[1]] = { dish: r[2], time: r[3] };
    });
  }
  res.json(data);
});

router.put('/', async (req, res) => {
  const db = await getDb();
  db.run('DELETE FROM timetable_entries WHERE user_id = ?', [req.userId]);
  for (const [key, value] of Object.entries(req.body)) {
    const parts = key.split('_');
    const day = parts[0];
    const meal = parts.slice(1).join('_');
    if (value.dish || value.time) {
      db.run('INSERT INTO timetable_entries (user_id, day, meal, dish, time) VALUES (?, ?, ?, ?, ?)',
        [req.userId, day, meal, value.dish || '', value.time || '']);
    }
  }
  saveDb();
  res.json({ success: true });
});

router.delete('/', async (req, res) => {
  const db = await getDb();
  db.run('DELETE FROM timetable_entries WHERE user_id = ?', [req.userId]);
  saveDb();
  res.json({ success: true });
});

module.exports = router;
