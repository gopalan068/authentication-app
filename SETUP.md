cd backend
npm install# AuthApp — Setup & Deployment Guide

## Project Structure
```
authapp-custom/
├── backend/
│   ├── server.js       ← Express API (JWT + bcrypt)
│   ├── package.json
│   ├── render.yaml     ← Render deploy config
│   └── users.json      ← auto-created on first signup
└── frontend/
    └── index.html      ← UI (deploy to GitHub Pages)
```

---

## Step 1 — Test backend locally (optional but good)

```bash
cd backend
npm install
node server.js
# Running on http://localhost:3000
```

Test with curl:
```bash
# Signup
curl -X POST http://localhost:3000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123"}'

# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123"}'
```

---

## Step 2 — Deploy backend to Render (free)

1. Go to https://render.com → sign up / log in
2. Click **New +** → **Web Service**
3. Connect your GitHub account → select your repo
4. Set **Root Directory** to `backend`
5. Render auto-detects Node.js — just confirm:
   - Build command: `npm install`
   - Start command: `node server.js`
6. Under **Environment Variables**, add:
   - Key: `JWT_SECRET`  Value: any long random string (e.g. `f8x2k9mQ...`)
7. Click **Create Web Service**

Render gives you a URL like: `https://authapp-backend.onrender.com`

> ⚠️ Free Render services sleep after 15 min of inactivity.
> First request after sleep takes ~30 sec. Fine for demo.

---

## Step 3 — Connect frontend to your backend

Open `frontend/index.html`, find line ~12:

```js
const API_BASE = 'https://YOUR-APP-NAME.onrender.com';
```

Replace with your actual Render URL, e.g.:
```js
const API_BASE = 'https://authapp-backend.onrender.com';
```

---

## Step 4 — Deploy frontend to GitHub Pages

```bash
# Create a separate repo for the frontend (or put both in one repo)
cd frontend
git init
git remote add origin https://github.com/YOUR_USERNAME/authapp.git
git add .
git commit -m "init"
git push -u origin main
```

On GitHub:
- **Settings → Pages → Source → main branch → / (root) → Save**

Your live link: `https://YOUR_USERNAME.github.io/authapp/`

---

## How it works — explain this confidently

### Signup flow
1. User submits email + password
2. Backend validates input (format, length)
3. Checks if email already exists in `users.json`
4. **bcrypt hashes the password** (10 salt rounds) — plaintext is never stored
5. New user object saved to `users.json`
6. **JWT signed** with your secret key, returned to frontend
7. Frontend stores JWT in `localStorage`

### Login flow
1. User submits credentials
2. Backend finds user by email
3. **bcrypt.compare()** checks submitted password against stored hash
4. If match → JWT signed and returned
5. Frontend stores JWT, shows dashboard

### Protected routes
- Frontend sends JWT in `Authorization: Bearer <token>` header
- Backend middleware verifies signature + expiry using `jwt.verify()`
- If valid → request proceeds; if not → 401 Unauthorized

### Why this is secure
- Passwords hashed with bcrypt (industry standard, adaptive cost)
- JWT signed — can't be tampered with without the secret
- Vague error messages on login (don't reveal which field is wrong)
- CORS restricted to your domain in production

---

## Key packages used
| Package | Purpose |
|---------|---------|
| `express` | HTTP server & routing |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT sign & verify |
| `cors` | Cross-origin request handling |
