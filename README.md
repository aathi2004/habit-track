# StreakFlow — Habit Tracker with Local-Day Streaks

A full-stack habit tracking application where streaks are measured strictly in the user's **local calendar days**, not in elapsed hours. Built with **Node.js, Express, TypeScript, SQLite, Luxon, React, and Vite**.

---

## 🎯 The Core Rule

A streak is calculated based on calendar days in the user's local IANA timezone (`Asia/Kolkata`, `America/New_York`, `Europe/London`, etc.).

Two check-ins 20 hours apart may or may not be consecutive days depending on midnight local boundaries. Only **one check-in per habit per local day** is ever allowed.

### 📐 Worked Example (`Asia/Kolkata`, UTC+05:30)

| Action | UTC Instant | Local Time (Kolkata) | Local Date (`YYYY-MM-DD`) | Result & Streak |
|---|---|---|---|---|
| **Check-in A** | `2026-03-10T14:30Z` | `2026-03-10 20:00` | `2026-03-10` | 🟢 Accepted → **Streak: 1** |
| **Check-in B** | `2026-03-11T10:30Z` | `2026-03-11 16:00` | `2026-03-11` | 🟢 Accepted (20 hrs after A, next local day) → **Streak: 2** |
| **Check-in C** | `2026-03-11T21:30Z` | `2026-03-12 03:00` | `2026-03-12` | 🟢 Accepted (11 hrs after B, crosses midnight) → **Streak: 3** |
| **Check-in D** | `2026-03-12T17:30Z` | `2026-03-12 23:00` | `2026-03-12` | 🔴 **Rejected (409 Conflict)** — Duplicate for `2026-03-12` → **Streak stays 3** |

---

## 🧠 Server-Side Streak Engine

All streak calculations are computed **100% on the server side**. The frontend never calculates or dictates streak validity.

1. **`currentStreak`**:
   - Consecutive local days ending **today** (in user's timezone).
   - If today is not yet checked in, but **yesterday** is checked in, the streak remains **active** (does not reset yet).
   - If neither today nor yesterday is checked in, `currentStreak = 0`.
2. **`longestStreak`**:
   - The maximum consecutive sequence of local days recorded across all check-ins.
3. **Backfilling**:
   - When a user logs a past missing date (between habit creation date and today), the server inserts the local-day record and **re-evaluates streaks across the entire history**.

---

## 🗄️ Database-Level Enforcement

In addition to API application checks, local-day uniqueness is enforced at the database level using a SQLite table constraint:

```sql
CREATE TABLE check_ins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER NOT NULL,
  utc_timestamp TEXT NOT NULL,
  local_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
  CONSTRAINT unique_habit_local_date UNIQUE (habit_id, local_date)
);
```

Attempts to insert a duplicate local date trigger a SQLite unique constraint violation, which the server gracefully intercepts and returns as a `409 Conflict` HTTP response.

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Run Backend Server

```bash
cd backend
npm install
npm run dev
```
The backend server runs on `http://localhost:5000`.

### 2. Run Frontend Web App

In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
The frontend Vite server runs on `http://localhost:3000`.

---

## 🧪 Running Automated Tests

The repository includes a Vitest test suite that tests the exact worked example, duplicate rejections, future dates, pre-creation dates, backfills, and multi-user isolation.

```bash
cd backend
npm test
```

Expected output:
```
 ✓ tests/streaks.test.ts (9 tests)
   ✓ executes the EXACT Worked Example scenario (A, B, C, D in Asia/Kolkata)
```

---

## 🐳 Running with Docker Compose

You can spin up the entire containerized full-stack application using Docker Compose:

```bash
docker-compose up --build
```
Access the application at `http://localhost:3000`.

---

## 📡 API Reference

### Auth Routes (`/api/auth`)
- `POST /api/auth/register` — Register with email, password, and IANA timezone (e.g. `Asia/Kolkata`).
- `POST /api/auth/login` — Login with credentials.
- `GET /api/auth/me` — Fetch current user profile.
- `PUT /api/auth/timezone` — Update user timezone (re-evaluates habit streaks).

### Habit Routes (`/api/habits`)
- `GET /api/habits` — Get user's habits with server-calculated streaks.
- `POST /api/habits` — Create new habit (`{ name, description }`).
- `GET /api/habits/:id` — Get habit detail, history logs, and computed streaks.
- `DELETE /api/habits/:id` — Delete habit and associated check-ins.
- `POST /api/habits/:id/check-in` — Submit check-in for today or backfill date (`{ local_date?: 'YYYY-MM-DD', utc_timestamp?: '...' }`).
- `DELETE /api/habits/:id/check-in/:date` — Remove a check-in for a specific local date.

---

## ✨ Features & Aesthetics

- **Modern Glassmorphic Dark UI**: Built with a curated color palette, animated flame streak badges, and responsive glass panels.
- **One-Click Quick Check-In**: Instant check-in for today in your current local timezone.
- **Backfill & History Modal**: Select any past date since habit creation to backfill check-ins.
- **Interactive Timezone Switching**: Change timezone on the fly from the navbar; streaks update dynamically.
- **Toast Notifications**: Error surfacing for duplicate check-ins, invalid dates, or unauthorized access.

---

## 🛡️ License

MIT License.
