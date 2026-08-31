# PixleNova Backend

Production-ready Express + PostgreSQL + Prisma backend for the PixleNova digital agency website.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + Argon2 |
| Email | Nodemailer |
| Security | Helmet, CORS, express-rate-limit |

---

## Prerequisites

- Node.js ≥ 18
- A PostgreSQL database (local, Supabase, Render, Railway, etc.)
- An SMTP email account (Gmail with App Password recommended for dev)

---

## Installation

```bash
cd backend
npm install
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Full PostgreSQL connection string |
| `DIRECT_URL` | Direct URL for Prisma migrations (same as above unless using pgBouncer) |
| `PORT` | Server port (default: `5000`) |
| `NODE_ENV` | `development` or `production` |
| `FRONTEND_URL` | Frontend origin for CORS (e.g. `http://localhost:5173`) |
| `JWT_SECRET` | Random secret ≥ 64 chars — generate with the command below |
| `JWT_EXPIRES_IN` | Token expiry (default: `7d`) |
| `EMAIL_HOST` | SMTP host (e.g. `smtp.gmail.com`) |
| `EMAIL_PORT` | SMTP port (e.g. `587`) |
| `EMAIL_SECURE` | `true` for port 465, `false` for 587 |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASSWORD` | SMTP password or App Password |
| `EMAIL_FROM` | Sender display name + address |
| `ADMIN_EMAIL` | Where admin notification emails go |
| `ADMIN_EMAIL_SEED` | Email for the initial admin account |
| `ADMIN_PASSWORD_SEED` | Password for the initial admin account (min 12 chars) |

**Generate a JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## PostgreSQL Setup

**Local (macOS/Linux):**
```bash
psql postgres
CREATE DATABASE pixlenova;
CREATE USER pixlenova_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE pixlenova TO pixlenova_user;
\q
```

**Using Supabase:** Create a project, copy the connection strings from Settings → Database.

---

## Prisma Setup

**Generate the Prisma client:**
```bash
npm run prisma:generate
```

**Run migrations (development):**
```bash
npm run prisma:migrate:dev
# Enter a migration name when prompted, e.g. "init"
```

**Run migrations (production — apply existing migrations only):**
```bash
npm run prisma:migrate
```

**Open Prisma Studio (database browser):**
```bash
npm run prisma:studio
```

---

## Seed the First Admin

Set `ADMIN_EMAIL_SEED` and `ADMIN_PASSWORD_SEED` in `.env`, then:

```bash
npm run prisma:seed
```

This is **idempotent** — safe to run multiple times. Existing admins are not overwritten.

> ⚠️ Change the password after your first login.

---

## Development

```bash
npm run dev
```

The server runs on `http://localhost:5000` with `--watch` for hot-reload.

The frontend (Vite) runs separately on port 5173.

---

## API Endpoints

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | None | Server + DB status |

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | None | Login with email + password |
| GET | `/api/auth/me` | JWT | Get current admin profile |
| POST | `/api/auth/logout` | JWT | Acknowledge logout |

### Contact

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/contact` | None | Submit a contact enquiry |
| GET | `/api/contact` | JWT | List enquiries (paginated) |
| GET | `/api/contact/:id` | JWT | Get single enquiry |
| PATCH | `/api/contact/:id/status` | JWT | Update enquiry status |
| DELETE | `/api/contact/:id` | JWT | Delete enquiry |

**Contact list query params:**

```
?page=1&limit=20&status=NEW&search=keyword&sort=createdAt&order=desc
```

**Status values:** `NEW` · `READ` · `REPLIED` · `ARCHIVED`

---

## Production Deployment

### Render / Railway

1. Create a new **Web Service** pointing to the `backend/` directory
2. Set build command: `npm install && npm run prisma:generate && npm run prisma:migrate`
3. Set start command: `npm start`
4. Add all environment variables in the dashboard

### Supabase PostgreSQL

Use the **Transaction** connection string as `DATABASE_URL` (port 6543 for pgBouncer)  
Use the **Direct** connection string as `DIRECT_URL` (port 5432 — required for migrations)

---

## Security Notes

- Passwords are hashed with **Argon2id** — never stored in plaintext
- JWTs are signed with `JWT_SECRET` — rotate this if compromised
- CORS is restricted to `FRONTEND_URL` — never use `origin: "*"` in production
- Login endpoint is rate-limited (10 attempts / 15 min per IP)
- Contact endpoint is rate-limited (5 submissions / 15 min per IP)
- Request bodies are limited to 16kb
- Stack traces are never exposed in production responses
- `.env` is gitignored — never commit secrets

---

## Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js        Prisma client singleton
│   │   └── env.js             Centralized env config
│   ├── controllers/
│   │   ├── authController.js  Login, /me, logout
│   │   └── contactController.js Submit, list, update, delete
│   ├── middleware/
│   │   ├── authMiddleware.js   JWT verification
│   │   ├── errorMiddleware.js  Centralized error handler
│   │   └── rateLimitMiddleware.js  Global + route-specific limiters
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── contactRoutes.js
│   ├── services/
│   │   └── emailService.js    Nodemailer notifications
│   ├── utils/
│   │   └── validation.js      Input validation + sanitization
│   └── server.js              Express app entry point
├── prisma/
│   ├── schema.prisma          Database schema
│   └── seed.js                Admin seed script
├── .env.example
├── package.json
└── README.md
```
