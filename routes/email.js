const express = require('express');
const nodemailer = require('nodemailer');
const db = require('../db/init');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

router.post('/shopping', async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: 'Recipient email is required' });

  const items = db.prepare('SELECT text, checked FROM shopping_items WHERE user_id = ? ORDER BY position').all(req.userId);
  const noteRow = db.prepare('SELECT notes FROM shopping_notes WHERE user_id = ?').get(req.userId);

  let body = 'SHOPPING LIST\n=============\n\n';
  if (items.length > 0) {
    items.forEach(item => {
      body += (item.checked ? '[x] ' : '[ ] ') + item.text + '\n';
    });
  } else {
    body += '(No items added)\n';
  }
  if (noteRow && noteRow.notes) {
    body += '\n\nNOTES\n=====\n' + noteRow.notes + '\n';
  }
  body += '\n\n---\nSent from Quick & Healthy Recipes';

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: 'My Shopping List - Quick & Healthy Recipes',
      text: body
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email. Check your SMTP settings.' });
  }
});

router.post('/timetable', async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: 'Recipient email is required' });

  const rows = db.prepare('SELECT day, meal, dish, time FROM timetable_entries WHERE user_id = ?').all(req.userId);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const meals = ['breakfast', 'lunch', 'dinner'];
  const dataMap = {};
  rows.forEach(r => { dataMap[r.day + '_' + r.meal] = r; });

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
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: 'My Meal Timetable - Quick & Healthy Recipes',
      text: body
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email. Check your SMTP settings.' });
  }
});

module.exports = router;
