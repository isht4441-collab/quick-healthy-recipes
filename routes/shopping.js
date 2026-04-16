const express = require('express');
const db = require('../db/init');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const items = db.prepare('SELECT id, text, checked FROM shopping_items WHERE user_id = ? ORDER BY position').all(req.userId);
  const row = db.prepare('SELECT notes FROM shopping_notes WHERE user_id = ?').get(req.userId);
  res.json({
    items: items.map(i => ({ ...i, checked: !!i.checked })),
    notes: row ? row.notes : ''
  });
});

router.post('/items', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  const max = db.prepare('SELECT COALESCE(MAX(position), -1) as mx FROM shopping_items WHERE user_id = ?').get(req.userId);
  const result = db.prepare('INSERT INTO shopping_items (user_id, text, checked, position) VALUES (?, ?, 0, ?)').run(req.userId, text, max.mx + 1);

  res.json({ id: result.lastInsertRowid, text, checked: false });
});

router.patch('/items/:id', (req, res) => {
  const item = db.prepare('SELECT id FROM shopping_items WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  db.prepare('UPDATE shopping_items SET checked = ? WHERE id = ?').run(req.body.checked ? 1 : 0, req.params.id);
  res.json({ success: true });
});

router.delete('/items/:id', (req, res) => {
  db.prepare('DELETE FROM shopping_items WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ success: true });
});

router.delete('/items', (req, res) => {
  db.prepare('DELETE FROM shopping_items WHERE user_id = ?').run(req.userId);
  db.prepare('DELETE FROM shopping_notes WHERE user_id = ?').run(req.userId);
  res.json({ success: true });
});

router.put('/notes', (req, res) => {
  const { notes } = req.body;
  db.prepare('INSERT OR REPLACE INTO shopping_notes (user_id, notes) VALUES (?, ?)').run(req.userId, notes || '');
  res.json({ success: true });
});

module.exports = router;
