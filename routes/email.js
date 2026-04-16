const express = require('express');
const { Resend } = require('resend');
const { getDb } = require('../db/init');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/shopping', async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: 'Recipient email is required' });

  const db = await getDb();
  const itemRows = db.exec('SELECT text, checked FROM shopping_items WHERE user_id = ? ORDER BY position', [req.userId]);
  const items = itemRows.length > 0 ? itemRows[0].values : [];

  const noteRows = db.exec('SELECT notes FROM shopping_notes WHERE user_id = ?', [req.userId]);
  const notes = (noteRows.length > 0 && noteRows[0].values.length > 0) ? noteRows[0].values[0][0] : '';

  let body = 'SHOPPING LIST\n=============\n\n';
  if (items.length > 0) {
    items.forEach(r => { body += (r[1] ? '[x] ' : '[ ] ') + r[0] + '\n'; });
  } else {
    body += '(No items added)\n';
  }
  if (notes) {
    body += '\n\nNOTES\n=====\n' + notes + '\n';
  }
  body += '\n\n---\nSent from Quick & Healthy Recipes';

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'Quick Recipes <onboarding@resend.dev>',
      to,
      subject: 'My Shopping List - Quick & Healthy Recipes',
      text: body
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

router.post('/timetable', async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: 'Recipient email is required' });

  const db = await getDb();
  const rows = db.exec('SELECT day, meal, dish, time FROM timetable_entries WHERE user_id = ?', [req.userId]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const meals = ['breakfast', 'lunch', 'dinner'];
  const dataMap = {};
  if (rows.length > 0) {
    rows[0].values.forEach(r => { dataMap[r[0] + '_' + r[1]] = { dish: r[2], time: r[3] }; });
  }

  let body = 'MEAL TIMETABLE\n==============\n\n';
  days.forEach(day => {
    body += day.toUpperCase() + '\n';
    meals.forEach(meal => {
      const entry = dataMap[day + '_' + meal];
      const dish = entry ? entry.dish || '(not set)' : '(not set)';
      const time = entry ? entry.time || '' : '';
      const label = meal.charAt(0).toUpperCase() + meal.slice(1);
      body += '  ' + label + ': ' + dish;
      if (time) body += ' at ' + time;
      body += '\n';
    });
    body += '\n';
  });
  body += '---\nSent from Quick & Healthy Recipes';

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'Quick Recipes <onboarding@resend.dev>',
      to,
      subject: 'My Meal Timetable - Quick & Healthy Recipes',
      text: body
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

module.exports = router;
