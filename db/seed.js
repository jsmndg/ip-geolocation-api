require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./database');

function runSeed() {
  const hashedPassword = bcrypt.hashSync('password123', 10);
  const seedUsers = [
    { name: 'Required User', email: 'user@example.com' },
    { name: 'Test User', email: 'test@example.com' },
  ];

  let created = 0;

  for (const user of seedUsers) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(user.email);
    if (existing) {
      continue;
    }

    db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(
      user.name,
      user.email,
      hashedPassword
    );
    created += 1;
  }

  if (created === 0) {
    console.log('Seed skipped: required users already exist.');
    return;
  }

  console.log(`Seed complete: created ${created} user${created === 1 ? '' : 's'}.`);
}

runSeed();
