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
  const hashedPassword = bcrypt.hashSync('password123', 10);
  const defaultUsers = [
    { name: 'Required User', email: 'user@example.com' },
    { name: 'Test User', email: 'test@example.com' },
  ];

  for (const user of defaultUsers) {
    const existingUser = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(user.email);

    if (existingUser) {
      continue;
    }

    db
      .prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
      .run(user.name, user.email, hashedPassword);
  }
}

seedDefaultUser();

module.exports = db;
