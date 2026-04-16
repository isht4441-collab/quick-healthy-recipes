const initSqlJs = require('sql.js/dist/sql-asm.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data.sqlite');

let db = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS nutrition_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      recipe_name TEXT NOT NULL,
      calories REAL DEFAULT 0,
      protein REAL DEFAULT 0,
      carbs REAL DEFAULT 0,
      fat REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS meal_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      calorie_target INTEGER NOT NULL,
      diet TEXT NOT NULL,
      plan_data TEXT NOT NULL,
      share_id TEXT UNIQUE,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Auto-save to disk every 10 seconds
  setInterval(() => {
    saveDb();
  }, 10000);

  // Save once on init
  saveDb();

  return db;
}

function saveDb() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to save database:', err.message);
  }
}

module.exports = { getDb, saveDb };
