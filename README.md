# ⚡ Lakshyamaarg — AI Career Intelligence Platform

## Quick Start

### Prerequisites
- Node.js 18+
- (Optional) PostgreSQL - *Note: The app uses SQLite by default for zero-config setup.*

### 1. Database Setup
The app is configured to use **SQLite** by default (stored in `backend/database/lakshyamaarg.db`).
- **No manual setup required**: The database and tables are automatically created when you start the backend!
- If you want to view the data, you can use any SQLite viewer.

### 2. Installation (Root)
```bash
# Install root, frontend, and backend dependencies
npm run install-all
```

### 3. Run Application
**Option A: Run both simultaneously (Recommended)**
```bash
npm run dev
```

**Option B: Separate terminals**
```bash
# Terminal 1: Backend
npm run start-backend

# Terminal 2: Frontend
npm run start-frontend
```

---

### Alternative: Manual Setup (If root scripts fail)
**Backend:** `cd backend && npm install && npm start`  
**Frontend:** `cd frontend && npm install && npm run dev`

---

## Environment Variables
1. **Copy** `backend/.env.example` to `backend/.env`.
2. **Edit** `.env` with your real keys (will be ignored by Git).

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_NAME` | lakshyamaarg | Database name |
| `DB_USER` | postgres | DB username |
| `DB_PASSWORD` | postgres | DB password |
| `JWT_SECRET` | (set) | JWT signing secret |
| `PORT` | 5000 | API server port |

---

## API Endpoints
| Module | Method | Route |
|---|---|---|
| Auth | POST | `/api/auth/register` |
| Auth | POST | `/api/auth/verify-otp` |
| Auth | POST | `/api/auth/login` |
| Auth | GET | `/api/auth/me` |
| Psychometric | GET | `/api/psychometric/questions` |
| Psychometric | POST | `/api/psychometric/submit` |
| Recommendation | GET | `/api/recommendation/my` |
| Recommendation | GET | `/api/recommendation/roadmap/:key` |
| Chatbot | POST | `/api/chatbot/message` |
| Opportunities | GET | `/api/opportunities` |

---

## Features
- 🧠 20-question psychometric test with 5 domain scores
- 🗺️ Career roadmaps: AI/Tech, MBBS, Law, Business, Design
- 🤖 Bilingual chatbot (English + Telugu) with Parent Mode
- 🎯 15+ opportunities with domain filter + deadline countdown
- 🔐 JWT authentication with email OTP verification
- 📊 Dashboard with score analysis and career insights

> **Dev note:** In `NODE_ENV=development`, OTP is returned in the API response for testing.
# Lashyamaarg_Path_to_Career
