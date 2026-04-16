const express = require('express');
const path = require('path');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 3000;

const resend = new Resend(process.env.RESEND_API_KEY);
const fromAddress = process.env.RESEND_FROM || 'Quick Recipes <onboarding@resend.dev>';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Send shopping list email
app.post('/api/email/shopping', async (req, res) => {
  const { to, body } = req.body;
  if (!to || !body) return res.status(400).json({ error: 'Email and body required' });

  try {
    await resend.emails.send({
      from: fromAddress,
      to,
      subject: 'My Shopping List - Quick & Healthy Recipes',
      text: body
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Send timetable email
app.post('/api/email/timetable', async (req, res) => {
  const { to, body } = req.body;
  if (!to || !body) return res.status(400).json({ error: 'Email and body required' });

  try {
    await resend.emails.send({
      from: fromAddress,
      to,
      subject: 'My Meal Timetable - Quick & Healthy Recipes',
      text: body
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
