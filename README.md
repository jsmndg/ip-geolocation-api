# IP Geolocation API

Node.js + Express backend for authentication and per-user IP search history.

Requires Node.js 22+ (uses built-in `node:sqlite`).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment file and update values:
   ```bash
   cp .env.example .env
   ```
3. Seed test user:
   ```bash
   node db/seed.js
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

The API runs on `http://localhost:8000` by default.

## Test Credentials

- Email: `user@example.com`
- Password: `password123`

- Email: `test@example.com`
- Password: `password123`

## Routes

- `POST /api/login`
- `GET /api/me` (protected)
- `GET /api/history` (protected)
- `POST /api/history` (protected)
- `DELETE /api/history` (protected)

## Deploy to Vercel

1. Push this `api` folder to a Git repository.
2. Import the repo/project in Vercel.
3. Set project root to `api`.
4. Add environment variables:
   - `JWT_SECRET`
   - `DATABASE_URL` (optional, defaults to `./db/app.db`)
5. Deploy.
