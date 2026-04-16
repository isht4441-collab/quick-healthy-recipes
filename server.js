require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/shopping', require('./routes/shopping'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/email', require('./routes/email'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function start() {
  await getDb();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start();
