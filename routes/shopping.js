const express = require('express');
const { getDb, saveDb } = require('../db/init');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const db = await getDb();
  const itemRows = db.exec('SELECT id, text, checked FROM shopping_items WHERE user_id = ? ORDER BY position', [req.userId]);
  const items = (itemRows.length > 0 ? itemRows[0].values : []).map(r => ({ id: r[0], text: r[1], checked: !!r[2] }));

  const noteRows = db.exec('SELECT notes FROM shopping_notes WHERE user_id = ?', [req.userId]);
  const notes = (noteRows.length > 0 && noteRows[0].values.length > 0) ? noteRows[0].values[0][0] : '';

  res.json({ items, notes });
});

router.post('/items', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  const db = await getDb();
  const maxRows = db.exec('SELECT COALESCE(MAX(position), -1) FROM shopping_items WHERE user_id = ?', [req.userId]);
  const maxPos = maxRows.length > 0 ? maxRows[0].values[0][0] : -1;

  db.run('INSERT INTO shopping_items (user_id, text, checked, position) VALUES (?, ?, 0, ?)', [req.userId, text, maxPos + 1]);

  const result = db.exec('SELECT last_insert_rowid() as id');
  const id = result[0].values[0][0];
  saveDb();

  res.json({ id, text, checked: false });
});

router.patch('/items/:id', async (req, res) => {
  const db = await getDb();
  const rows = db.exec('SELECT id FROM shopping_items WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  if (rows.length === 0 || rows[0].values.length === 0) return res.status(404).json({ error: 'Item not found' });

  db.run('UPDATE shopping_items SET checked = ? WHERE id = ?', [req.body.checked ? 1 : 0, req.params.id]);
  saveDb();
  res.json({ success: true });
});

router.delete('/items/:id', async (req, res) => {
  const db = await getDb();
  db.run('DELETE FROM shopping_items WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  saveDb();
  res.json({ success: true });
});

router.delete('/items', async (req, res) => {
  const db = await getDb();
  db.run('DELETE FROM shopping_items WHERE user_id = ?', [req.userId]);
  db.run('DELETE FROM shopping_notes WHERE user_id = ?', [req.userId]);
  saveDb();
  res.json({ success: true });
});

router.put('/notes', async (req, res) => {
  const db = await getDb();
  const { notes } = req.body;
  db.run('DELETE FROM shopping_notes WHERE user_id = ?', [req.userId]);
  db.run('INSERT INTO shopping_notes (user_id, notes) VALUES (?, ?)', [req.userId, notes || '']);
  saveDb();
  res.json({ success: true });
});

module.exports = router;
