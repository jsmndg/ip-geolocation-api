const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = db
    .prepare('SELECT id, name, email, password FROM users WHERE email = ?')
    .get(normalizedEmail);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const passwordMatches = bcrypt.compareSync(password, user.password);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    secret,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

module.exports = router;
