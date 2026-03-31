# AuthApp

A simple, modern authentication app with a Node.js backend (JWT + bcrypt) and a static HTML/CSS/JS frontend.

## Features
- User signup & login with email and password
- Passwords securely hashed with bcrypt
- JWT-based authentication (7-day expiry)
- User data stored in a local JSON file (for demo)
- Clean, responsive UI
- Fully deployable for free

## Demo
- **Frontend:** [https://gopalan068.github.io/authentication-app/](https://gopalan068.github.io/authentication-app/)
- **Backend:** [https://authentication-app-lxaw.onrender.com](https://authentication-app-lxaw.onrender.com)

## Project Structure
```
backend/           # Node.js API server
  server.js        # Express app (JWT + bcrypt)
  package.json     # Dependencies
  render.yaml      # Render deploy config
index.html         # Frontend (static, for GitHub Pages)
```

## Local Development
1. **Clone the repo:**
   ```bash
   git clone https://github.com/gopalan068/authentication-app.git
   cd authentication-app
   ```
2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```
3. **Run the backend locally:**
   ```bash
   node server.js
   # Runs on http://localhost:3000
   ```
4. **Test the frontend:**
   - Open `index.html` in your browser
   - Update `API_BASE` in the script to `http://localhost:3000` for local testing

## Deployment
### Backend (Render)
1. Push your code to GitHub
2. Go to [https://render.com](https://render.com) and create a new Web Service
3. Set root directory to `backend/`
4. Set environment variable `JWT_SECRET` to a long random string
5. Deploy and get your backend URL (e.g. `https://authentication-app-lxaw.onrender.com`)

### Frontend (GitHub Pages)
1. Ensure `API_BASE` in `index.html` points to your Render backend URL
2. Push `index.html` to the root of your GitHub repo
3. Enable GitHub Pages (Settings → Pages → Source: main branch, root)
4. Your app will be live at `https://YOUR_USERNAME.github.io/REPO_NAME/`

## License
MIT
