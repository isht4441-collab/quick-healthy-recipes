const express = require('express');
const crypto = require('crypto');
const { getDb } = require('../db/init');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All 39 recipes from the website with nutritional data
const RECIPES = [
  // === VEGAN (6) ===
  { name: 'Mango Avocado Salsa Bowl', category: 'vegan', mealType: 'lunch', calories: 320, protein: 5, carbs: 40, fat: 18 },
  { name: 'Spicy Peanut Butter Noodles', category: 'vegan', mealType: 'lunch', calories: 480, protein: 16, carbs: 58, fat: 22 },
  { name: 'Chickpea & Spinach Stir-Fry', category: 'vegan', mealType: 'dinner', calories: 290, protein: 14, carbs: 36, fat: 10 },
  { name: 'Berry Coconut Smoothie Bowl', category: 'vegan', mealType: 'breakfast', calories: 350, protein: 6, carbs: 52, fat: 14 },
  { name: 'Smashed Edamame Toast', category: 'vegan', mealType: 'breakfast', calories: 310, protein: 18, carbs: 32, fat: 12 },
  { name: 'Black Bean & Corn Quesadilla', category: 'vegan', mealType: 'dinner', calories: 420, protein: 15, carbs: 54, fat: 16 },

  // === VEGETARIAN (6) ===
  { name: 'Caprese Flatbread', category: 'vegetarian', mealType: 'lunch', calories: 380, protein: 16, carbs: 38, fat: 18 },
  { name: 'Egg Fried Rice', category: 'vegetarian', mealType: 'dinner', calories: 410, protein: 14, carbs: 56, fat: 14 },
  { name: 'Greek Yoghurt Veggie Wrap', category: 'vegetarian', mealType: 'lunch', calories: 340, protein: 14, carbs: 40, fat: 14 },
  { name: 'Cheesy Garlic Mushrooms on Toast', category: 'vegetarian', mealType: 'breakfast', calories: 360, protein: 16, carbs: 28, fat: 20 },
  { name: 'Halloumi & Pepper Stir-Fry', category: 'vegetarian', mealType: 'dinner', calories: 390, protein: 22, carbs: 18, fat: 24 },
  { name: 'Ricotta & Honey Toast', category: 'vegetarian', mealType: 'breakfast', calories: 350, protein: 12, carbs: 42, fat: 14 },

  // === GLUTEN FREE (6) ===
  { name: 'Lemon Herb Salmon', category: 'glutenfree', mealType: 'dinner', calories: 360, protein: 34, carbs: 2, fat: 24 },
  { name: 'Sweet Potato & Black Bean Tacos', category: 'glutenfree', mealType: 'lunch', calories: 380, protein: 12, carbs: 56, fat: 12 },
  { name: 'Tuna & White Bean Salad', category: 'glutenfree', mealType: 'lunch', calories: 310, protein: 28, carbs: 24, fat: 10 },
  { name: 'Thai Coconut Chicken Soup', category: 'glutenfree', mealType: 'dinner', calories: 420, protein: 30, carbs: 12, fat: 28 },
  { name: 'Prawn & Avocado Rice Paper Rolls', category: 'glutenfree', mealType: 'lunch', calories: 250, protein: 18, carbs: 22, fat: 10 },
  { name: 'Steak & Rocket Salad', category: 'glutenfree', mealType: 'dinner', calories: 340, protein: 32, carbs: 4, fat: 22 },

  // === IRON (4) ===
  { name: 'Seared Liver & Onions', category: 'iron', mealType: 'dinner', calories: 280, protein: 30, carbs: 8, fat: 14 },
  { name: 'Lentil & Spinach Warm Salad', category: 'iron', mealType: 'lunch', calories: 310, protein: 18, carbs: 38, fat: 10 },
  { name: 'Steak Bites with Broccoli', category: 'iron', mealType: 'dinner', calories: 370, protein: 34, carbs: 10, fat: 22 },
  { name: 'Dark Chocolate & Pumpkin Seed Trail Mix', category: 'iron', mealType: 'snack', calories: 290, protein: 8, carbs: 24, fat: 20 },

  // === CALCIUM (4) ===
  { name: 'Yoghurt Parfait with Almonds', category: 'calcium', mealType: 'breakfast', calories: 320, protein: 16, carbs: 36, fat: 14 },
  { name: 'Cheesy Kale & White Bean Saute', category: 'calcium', mealType: 'dinner', calories: 340, protein: 18, carbs: 34, fat: 14 },
  { name: 'Sardines on Toast with Lemon', category: 'calcium', mealType: 'lunch', calories: 330, protein: 22, carbs: 26, fat: 16 },
  { name: 'Tofu & Sesame Stir-Fry', category: 'calcium', mealType: 'dinner', calories: 300, protein: 20, carbs: 18, fat: 16 },

  // === ZINC (4) ===
  { name: 'Garlic Butter Prawns', category: 'zinc', mealType: 'dinner', calories: 260, protein: 28, carbs: 2, fat: 16 },
  { name: 'Lamb Mince Lettuce Cups', category: 'zinc', mealType: 'lunch', calories: 350, protein: 26, carbs: 8, fat: 24 },
  { name: 'Pumpkin Seed & Cashew Butter Bites', category: 'zinc', mealType: 'snack', calories: 280, protein: 10, carbs: 20, fat: 18 },
  { name: 'Turkey & Chickpea Skillet', category: 'zinc', mealType: 'dinner', calories: 360, protein: 30, carbs: 28, fat: 12 },

  // === IODINE (4) ===
  { name: 'Garlic Butter Cod', category: 'iodine', mealType: 'dinner', calories: 290, protein: 30, carbs: 2, fat: 18 },
  { name: 'Seaweed & Cucumber Salad', category: 'iodine', mealType: 'snack', calories: 80, protein: 2, carbs: 10, fat: 2 },
  { name: 'Prawn & Nori Rice Bowl', category: 'iodine', mealType: 'lunch', calories: 350, protein: 22, carbs: 44, fat: 8 },
  { name: 'Creamy Haddock with Spinach', category: 'iodine', mealType: 'dinner', calories: 380, protein: 32, carbs: 6, fat: 26 },

  // === OMEGA-3 (5) ===
  { name: 'Teriyaki Salmon Rice Bowl', category: 'omega', mealType: 'dinner', calories: 450, protein: 30, carbs: 46, fat: 16 },
  { name: 'Smoked Mackerel Pate on Toast', category: 'omega', mealType: 'lunch', calories: 370, protein: 22, carbs: 24, fat: 22 },
  { name: 'Chia Seed Pudding', category: 'omega', mealType: 'breakfast', calories: 280, protein: 8, carbs: 30, fat: 14 },
  { name: 'Walnut & Flaxseed Banana Smoothie', category: 'omega', mealType: 'breakfast', calories: 320, protein: 8, carbs: 40, fat: 16 },
  { name: 'Sardine & Avocado Smash', category: 'omega', mealType: 'lunch', calories: 390, protein: 20, carbs: 28, fat: 22 },
];

// Diet compatibility map - which categories are compatible with which diets
function getFilteredRecipes(diet) {
  if (diet === 'any') return [...RECIPES];

  if (diet === 'vegan') {
    // Only vegan recipes
    return RECIPES.filter(r => r.category === 'vegan');
  }

  if (diet === 'vegetarian') {
    // Vegan + vegetarian + calcium/iron/zinc/omega that are plant-based
    const vegCategories = ['vegan', 'vegetarian'];
    const vegetarianSafe = [
      'Lentil & Spinach Warm Salad',
      'Dark Chocolate & Pumpkin Seed Trail Mix',
      'Yoghurt Parfait with Almonds',
      'Cheesy Kale & White Bean Saute',
      'Tofu & Sesame Stir-Fry',
      'Pumpkin Seed & Cashew Butter Bites',
      'Seaweed & Cucumber Salad',
      'Chia Seed Pudding',
      'Walnut & Flaxseed Banana Smoothie',
    ];
    return RECIPES.filter(r => vegCategories.includes(r.category) || vegetarianSafe.includes(r.name));
  }

  if (diet === 'glutenfree') {
    // Gluten-free category + naturally GF recipes
    const gfSafe = [
      'Mango Avocado Salsa Bowl',
      'Chickpea & Spinach Stir-Fry',
      'Berry Coconut Smoothie Bowl',
      'Halloumi & Pepper Stir-Fry',
      'Lemon Herb Salmon',
      'Sweet Potato & Black Bean Tacos',
      'Tuna & White Bean Salad',
      'Thai Coconut Chicken Soup',
      'Prawn & Avocado Rice Paper Rolls',
      'Steak & Rocket Salad',
      'Seared Liver & Onions',
      'Lentil & Spinach Warm Salad',
      'Steak Bites with Broccoli',
      'Dark Chocolate & Pumpkin Seed Trail Mix',
      'Yoghurt Parfait with Almonds',
      'Cheesy Kale & White Bean Saute',
      'Tofu & Sesame Stir-Fry',
      'Garlic Butter Prawns',
      'Lamb Mince Lettuce Cups',
      'Garlic Butter Cod',
      'Seaweed & Cucumber Salad',
      'Prawn & Nori Rice Bowl',
      'Creamy Haddock with Spinach',
      'Teriyaki Salmon Rice Bowl',
      'Chia Seed Pudding',
      'Walnut & Flaxseed Banana Smoothie',
    ];
    return RECIPES.filter(r => r.category === 'glutenfree' || gfSafe.includes(r.name));
  }

  return [...RECIPES];
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function findBestFit(recipes, targetCal) {
  if (recipes.length === 0) return null;
  // Sort by how close they are to the target
  const sorted = [...recipes].sort((a, b) => Math.abs(a.calories - targetCal) - Math.abs(b.calories - targetCal));
  // Pick randomly from the top 3 closest matches to add variety
  const topN = sorted.slice(0, Math.min(3, sorted.length));
  return pickRandom(topN);
}

function generatePlan(calorieTarget, diet) {
  const available = getFilteredRecipes(diet);
  const breakfasts = available.filter(r => r.mealType === 'breakfast');
  const lunches = available.filter(r => r.mealType === 'lunch');
  const dinners = available.filter(r => r.mealType === 'dinner');
  const snacks = available.filter(r => r.mealType === 'snack');

  // Calorie distribution: breakfast 25%, lunch 35%, dinner 35%, snack 5%
  const breakfastCal = calorieTarget * 0.25;
  const lunchCal = calorieTarget * 0.35;
  const dinnerCal = calorieTarget * 0.35;
  const snackCal = calorieTarget * 0.05;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const plan = {};

  for (const day of days) {
    const breakfast = findBestFit(breakfasts, breakfastCal) || findBestFit(available, breakfastCal);
    const lunch = findBestFit(lunches, lunchCal) || findBestFit(available, lunchCal);
    const dinner = findBestFit(dinners, dinnerCal) || findBestFit(available, dinnerCal);
    const snack = findBestFit(snacks, snackCal) || findBestFit(available, snackCal);

    const meals = {};
    if (breakfast) meals.breakfast = { name: breakfast.name, calories: breakfast.calories, protein: breakfast.protein, carbs: breakfast.carbs, fat: breakfast.fat };
    if (lunch) meals.lunch = { name: lunch.name, calories: lunch.calories, protein: lunch.protein, carbs: lunch.carbs, fat: lunch.fat };
    if (dinner) meals.dinner = { name: dinner.name, calories: dinner.calories, protein: dinner.protein, carbs: dinner.carbs, fat: dinner.fat };
    if (snack) meals.snack = { name: snack.name, calories: snack.calories, protein: snack.protein, carbs: snack.carbs, fat: snack.fat };

    const totalCal = Object.values(meals).reduce((sum, m) => sum + m.calories, 0);
    const totalProtein = Object.values(meals).reduce((sum, m) => sum + m.protein, 0);
    const totalCarbs = Object.values(meals).reduce((sum, m) => sum + m.carbs, 0);
    const totalFat = Object.values(meals).reduce((sum, m) => sum + m.fat, 0);

    plan[day] = {
      meals,
      totals: { calories: totalCal, protein: totalProtein, carbs: totalCarbs, fat: totalFat }
    };
  }

  return plan;
}

// POST /api/mealplan/generate - requires auth
router.post('/generate', requireAuth, (req, res) => {
  try {
    const { calorie_target, diet } = req.body;
    if (!calorie_target || !diet) {
      return res.status(400).json({ error: 'calorie_target and diet are required' });
    }

    const validDiets = ['vegan', 'vegetarian', 'glutenfree', 'any'];
    if (!validDiets.includes(diet)) {
      return res.status(400).json({ error: 'diet must be one of: vegan, vegetarian, glutenfree, any' });
    }

    if (calorie_target < 800 || calorie_target > 5000) {
      return res.status(400).json({ error: 'calorie_target must be between 800 and 5000' });
    }

    const plan = generatePlan(calorie_target, diet);
    res.json({ calorie_target, diet, plan });
  } catch (err) {
    console.error('Generate meal plan error:', err);
    res.status(500).json({ error: 'Failed to generate plan' });
  }
});

// POST /api/mealplan/save - requires auth
router.post('/save', requireAuth, async (req, res) => {
  try {
    const { name, calorie_target, diet, plan } = req.body;
    if (!name || !calorie_target || !diet || !plan) {
      return res.status(400).json({ error: 'name, calorie_target, diet, and plan are required' });
    }

    const db = await getDb();
    const shareId = crypto.randomUUID();
    const planData = JSON.stringify(plan);

    db.run(
      'INSERT INTO meal_plans (user_id, name, calorie_target, diet, plan_data, share_id) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, name, calorie_target, diet, planData, shareId]
    );

    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];

    res.status(201).json({ id, name, calorie_target, diet, share_id: shareId, plan });
  } catch (err) {
    console.error('Save meal plan error:', err);
    res.status(500).json({ error: 'Failed to save plan' });
  }
});

// GET /api/mealplan - requires auth
router.get('/', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const rows = db.exec(
      'SELECT id, name, calorie_target, diet, plan_data, share_id, created_at FROM meal_plans WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );

    if (rows.length === 0) return res.json([]);

    const columns = rows[0].columns;
    const plans = rows[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      obj.plan = JSON.parse(obj.plan_data);
      delete obj.plan_data;
      return obj;
    });

    res.json(plans);
  } catch (err) {
    console.error('List meal plans error:', err);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// DELETE /api/mealplan/:id - requires auth
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const existing = db.exec(
      'SELECT id FROM meal_plans WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (existing.length === 0 || existing[0].values.length === 0) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }

    db.run('DELETE FROM meal_plans WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete meal plan error:', err);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

// GET /api/mealplan/share/:shareId - PUBLIC (no auth)
router.get('/share/:shareId', async (req, res) => {
  try {
    const db = await getDb();
    const rows = db.exec(
      'SELECT mp.name, mp.calorie_target, mp.diet, mp.plan_data, mp.created_at, u.email FROM meal_plans mp JOIN users u ON mp.user_id = u.id WHERE mp.share_id = ?',
      [req.params.shareId]
    );

    if (rows.length === 0 || rows[0].values.length === 0) {
      return res.status(404).json({ error: 'Shared plan not found' });
    }

    const [name, calorieTarget, diet, planData, createdAt, email] = rows[0].values[0];
    res.json({
      name,
      calorie_target: calorieTarget,
      diet,
      plan: JSON.parse(planData),
      created_at: createdAt,
      created_by: email
    });
  } catch (err) {
    console.error('Get shared plan error:', err);
    res.status(500).json({ error: 'Failed to fetch shared plan' });
  }
});

module.exports = router;
