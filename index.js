require('dotenv').config();
const express = require('express');
const cors = require('cors');

const db = require('./db/database');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', authRoutes);

app.get('/api/me', authMiddleware, (req, res) => {
  const user = db
    .prepare('SELECT id, name, email, created_at FROM users WHERE id = ?')
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json(user);
});

app.get('/api/history', authMiddleware, (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, ip_address, geo_data, searched_at
       FROM search_history
       WHERE user_id = ?
       ORDER BY searched_at DESC`
    )
    .all(req.user.id)
    .map((row) => ({
      ...row,
      geo_data: JSON.parse(row.geo_data),
    }));

  res.json(rows);
});

app.post('/api/history', authMiddleware, (req, res) => {
  const { ip_address, geo_data } = req.body;

  if (!ip_address || !geo_data) {
    return res.status(400).json({ message: 'ip_address and geo_data are required' });
  }

  const serializedGeoData = JSON.stringify(geo_data);
  const insert = db.prepare(
    'INSERT INTO search_history (user_id, ip_address, geo_data) VALUES (?, ?, ?)'
  );
  const result = insert.run(req.user.id, ip_address, serializedGeoData);

  const created = db
    .prepare(
      `SELECT id, ip_address, geo_data, searched_at
       FROM search_history
       WHERE id = ? AND user_id = ?`
    )
    .get(result.lastInsertRowid, req.user.id);

  res.status(201).json({
    ...created,
    geo_data: JSON.parse(created.geo_data),
  });
});

app.delete('/api/history', authMiddleware, (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'ids must be a non-empty array' });
  }

  const numericIds = ids
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (numericIds.length === 0) {
    return res.status(400).json({ message: 'No valid ids provided' });
  }

  const placeholders = numericIds.map(() => '?').join(',');
  const statement = db.prepare(
    `DELETE FROM search_history
     WHERE user_id = ?
       AND id IN (${placeholders})`
  );

  const result = statement.run(req.user.id, ...numericIds);
  res.json({ deleted: result.changes });
});

if (require.main === module) {
  const port = process.env.PORT || 8000;
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

module.exports = app;
