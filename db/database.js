const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DATABASE_URL || './db/app.db';
const resolvedDbPath = path.isAbsolute(dbPath)
  ? dbPath
  : path.resolve(__dirname, '..', dbPath.replace(/^\.\//, ''));

const db = new DatabaseSync(resolvedDbPath);

db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS search_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  ip_address TEXT NOT NULL,
  geo_data TEXT NOT NULL,
  searched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`);

function seedDefaultUser() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) {
    return;
  }

  const hashedPassword = bcrypt.hashSync('password123', 10);
  db.prepare(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
  ).run('Test User', 'test@example.com', hashedPassword);
}

seedDefaultUser();

module.exports = db;
