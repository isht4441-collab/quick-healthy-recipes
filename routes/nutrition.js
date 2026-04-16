const express = require('express');
const { getDb } = require('../db/init');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/nutrition?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'start and end query params required (YYYY-MM-DD)' });
    }

    const db = await getDb();
    const rows = db.exec(
      `SELECT id, date, meal_type, recipe_name, calories, protein, carbs, fat, created_at
       FROM nutrition_logs
       WHERE user_id = ? AND date >= ? AND date <= ?
       ORDER BY date ASC, created_at ASC`,
      [req.userId, start, end]
    );

    if (rows.length === 0) return res.json([]);

    const columns = rows[0].columns;
    const logs = rows[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });

    res.json(logs);
  } catch (err) {
    console.error('Get nutrition logs error:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// POST /api/nutrition
router.post('/', async (req, res) => {
  try {
    const { date, meal_type, recipe_name, calories, protein, carbs, fat } = req.body;
    if (!date || !meal_type || !recipe_name) {
      return res.status(400).json({ error: 'date, meal_type, and recipe_name are required' });
    }

    const db = await getDb();
    db.run(
      `INSERT INTO nutrition_logs (user_id, date, meal_type, recipe_name, calories, protein, carbs, fat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.userId, date, meal_type, recipe_name, calories || 0, protein || 0, carbs || 0, fat || 0]
    );

    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];

    res.status(201).json({ id, date, meal_type, recipe_name, calories: calories || 0, protein: protein || 0, carbs: carbs || 0, fat: fat || 0 });
  } catch (err) {
    console.error('Add nutrition log error:', err);
    res.status(500).json({ error: 'Failed to add log' });
  }
});

// DELETE /api/nutrition/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const existing = db.exec(
      'SELECT id FROM nutrition_logs WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (existing.length === 0 || existing[0].values.length === 0) {
      return res.status(404).json({ error: 'Log entry not found' });
    }

    db.run('DELETE FROM nutrition_logs WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete nutrition log error:', err);
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

// GET /api/nutrition/summary?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/summary', async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'start and end query params required (YYYY-MM-DD)' });
    }

    const db = await getDb();
    const rows = db.exec(
      `SELECT date,
              SUM(calories) as total_calories,
              SUM(protein) as total_protein,
              SUM(carbs) as total_carbs,
              SUM(fat) as total_fat,
              COUNT(*) as meal_count
       FROM nutrition_logs
       WHERE user_id = ? AND date >= ? AND date <= ?
       GROUP BY date
       ORDER BY date ASC`,
      [req.userId, start, end]
    );

    if (rows.length === 0) return res.json([]);

    const columns = rows[0].columns;
    const summary = rows[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });

    res.json(summary);
  } catch (err) {
    console.error('Nutrition summary error:', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;
