# College Event Management & Ticketing System

A production-ready MERN stack application for managing college events, selling tickets, and validating entries via QR codes.

## 🚀 Quick Start

### Backend (server)

```bash
cd "pbl 2.0/server"
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Stripe keys
npm run dev
```

Server starts at `http://localhost:5000`

### Seed Admin User

```bash
cd "pbl 2.0/server"
node ../scripts/seedAdmin.js
# Default: admin@college.edu / Admin@123456
```

### Frontend (client)

```bash
cd "pbl 2.0/client"
npm install
cp .env.example .env
# Edit .env with your API URL and Stripe publishable key
npm start
```

App starts at `http://localhost:3000`

## 🏗 Project Structure

```
pbl 2.0/
├── server/          # Express.js backend
├── client/          # React 18 frontend
└── scripts/         # Utility scripts (seedAdmin.js)
```

## 🔐 Roles

| Role       | Capabilities                              |
|------------|-------------------------------------------|
| student    | Browse events, book tickets, view QR code |
| organizer  | Create/manage events, scan QR tickets     |
| admin      | View analytics, enable/disable events     |

## 📚 API Endpoints

- `POST /api/auth/register` — Register (student/organizer)
- `POST /api/auth/login` — Login
- `GET  /api/auth/me` — Current user
- `PUT  /api/auth/profile` — Update profile
- `GET  /api/events` — List events (paginated, searchable)
- `POST /api/events` — Create event (organizer)
- `PUT  /api/events/:id` — Update event
- `DELETE /api/events/:id` — Delete event
- `PATCH /api/events/:id/disable` — Disable event (admin)
- `POST /api/tickets/book` — Book a ticket (student)
- `GET  /api/tickets/my-tickets` — My tickets
- `POST /api/tickets/validate` — Validate QR (organizer)
- `PATCH /api/tickets/:id/scan` — Mark ticket used
- `POST /api/payments/create-intent` — Create Stripe payment intent
- `POST /api/payments/verify` — Verify payment
- `POST /api/payments/webhook` — Stripe webhook
- `GET  /api/admin/analytics` — Platform analytics (admin)
- `GET  /api/admin/events` — All events (admin)
- `GET  /api/admin/users` — All users (admin)

## 🛡 Security Features

- JWT authentication with Bearer token
- bcryptjs password hashing (12 rounds)
- Role-based access control (RBAC)
- Joi input validation on all write endpoints
- Rate limiting on auth and validation endpoints
- Helmet security headers
- CORS allowlist
- Stripe webhook signature verification
- Atomic MongoDB transactions for overbooking prevention
- Compound unique index on (userId, eventId) for duplicate booking prevention

## 💳 Stripe Test Cards

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- Expiry: any future date, CVC: any 3 digits

## 🧰 Tech Stack

**Backend**: Node.js, Express.js, MongoDB/Mongoose, JWT, bcryptjs, Joi, Stripe, qrcode, express-rate-limit, cors, helmet, morgan

**Frontend**: React 18, React Router v6, Axios, Context API + Hooks, html5-qrcode, CSS3