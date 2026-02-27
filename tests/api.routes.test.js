const fs = require('fs');
const path = require('path');
const request = require('supertest');

describe('API auth and history routes', () => {
  let app;
  let token;
  let createdHistoryId;
  let testDbPath;

  beforeAll(async () => {
    testDbPath = path.join(__dirname, `test-${Date.now()}.db`);
    process.env.DATABASE_URL = testDbPath;
    process.env.JWT_SECRET = 'test_jwt_secret';

    jest.resetModules();
    app = require('../index');

    const loginResponse = await request(app)
      .post('/api/login')
      .send({ email: 'test@example.com', password: 'password123' });

    token = loginResponse.body.token;
  });

  afterAll(() => {
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;

    [testDbPath, `${testDbPath}-shm`, `${testDbPath}-wal`].forEach((filePath) => {
      try {
        if (fs.existsSync(filePath)) {
          fs.rmSync(filePath, { force: true });
        }
      } catch (_error) {
      }
    });
  });

  test('POST /api/login returns token for valid credentials', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe('test@example.com');
  });

  test('POST /api/login returns 401 for invalid credentials', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ email: 'test@example.com', password: 'wrong-password' });

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ message: 'Invalid credentials' });
  });

  test('GET /api/history requires auth token', async () => {
    const response = await request(app).get('/api/history');

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
  });

  test('GET /api/me returns current user when authenticated', async () => {
    const response = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.email).toBe('test@example.com');
  });

  test('history create/list/delete flow works for authenticated user', async () => {
    const geoData = {
      ip: '8.8.8.8',
      city: 'Mountain View',
      country: 'US',
      loc: '37.4056,-122.0775',
      org: 'AS15169 Google LLC',
      timezone: 'America/Los_Angeles',
    };

    const createResponse = await request(app)
      .post('/api/history')
      .set('Authorization', `Bearer ${token}`)
      .send({ ip_address: '8.8.8.8', geo_data: geoData });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.body.geo_data.ip).toBe('8.8.8.8');

    createdHistoryId = createResponse.body.id;

    const listResponse = await request(app)
      .get('/api/history')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.statusCode).toBe(200);
    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(listResponse.body.some((item) => item.id === createdHistoryId)).toBe(true);

    const deleteResponse = await request(app)
      .delete('/api/history')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: [createdHistoryId] });

    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.body.deleted).toBe(1);
  });
});
