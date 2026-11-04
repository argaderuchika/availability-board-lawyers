# Chambers Availability Board ⚖️

A real-time, mobile-first web application designed for legal chambers, advocates, and interns to track judicial and official availability before making court visits.

---

## 🚀 Key Features

1. **Members-Only Authentication**:
   - Secure JWT-based login with bcrypt password hashing.
   - Role-Based Access Control (**Admin** for managing directory/team, **Member** for updating & viewing statuses).
   - One-tap quick demo login buttons for seamless review.

2. **Always-On "Today" View**:
   - Displays today's date dynamically without requiring manual morning list creation.
   - Color-coded status badges for all tracked judges and courtrooms.
   - Live status count chips with instant 1-tap filtering.

3. **1-Tap Quick Status Updates**:
   - Update any official's card directly with a single tap:
     - 🟢 **Available**
     - 🔴 **Not sitting today**
     - 🟣 **On leave** (with optional return date)
     - 🟡 **Running late**
     - ⚪ **Not confirmed** (Default)
   - Add status-specific notes (e.g. *"Adjourned till 2 PM"*, *"Urgent mentions ongoing"*).

4. **Freshness & Accountability Labels**:
   - Displays exactly who updated a status and relative time (e.g., *"Updated 10m ago by Adv. Ravi"*).
   - Any official not verified today is prominently flagged: `⚠️ Not confirmed today (reset this morning)`.

5. **WhatsApp Group Exporter**:
   - Generates a clean, beautifully formatted text summary grouped by Court with emojis and judge locations.
   - One-tap "Copy to Clipboard" and direct "Open in WhatsApp" link.

6. **Directory & Team Management (Admin)**:
   - Add, edit, and archive officials (name, designation, court, bench/room, notes).
   - Manage chamber members, roles, and credentials.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, Bcrypt
- **Frontend**: React (Vite), Lucide Icons, Modern Vanilla CSS Design System (Mobile-first, dark mode legal-tech palette)
- **Database**: In-memory MongoDB for demos. Demo data resets whenever the server restarts.

---

## 🏃 Running the Application

### Backend Server:
```bash
cd server
npm install
npm run dev
# Running on http://localhost:5000
```

The server starts with an in-memory MongoDB by default and seeds the three demo accounts plus sample Bombay High Court data. The first start downloads a MongoDB binary for the in-memory server.

To use a persistent local MongoDB instead, set `USE_MEMORY_DB=false` and optionally set `MONGODB_URI` before starting the server.

### Frontend Client:
```bash
cd client
npm install
npm run dev
# Running on http://localhost:3001
```

### Demo Accounts:
- **Admin**: `admin@legalchambers.com` / `admin123`
- **Member (Associate)**: `ravi@legalchambers.com` / `ravi123`
- **Member (Intern)**: `priya@legalchambers.com` / `priya123`
