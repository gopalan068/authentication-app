const express    = require('express');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const cors       = require('cors');
const fs         = require('fs');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Secret key for signing JWTs ──────────────────────────────────────────────
// In production this should be in an environment variable (.env)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';
const JWT_EXPIRES_IN = '7d'; // token valid for 7 days

// ─── Path to JSON user store ───────────────────────────────────────────────────
const DB_PATH = path.join(__dirname, 'users.json');

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*', // tighten this to your GitHub Pages URL in production
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// ─── JSON file helpers ─────────────────────────────────────────────────────────

// Read all users from JSON file
function readUsers() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([]));
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

// Write users array back to JSON file
function writeUsers(users) {
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

// Find a user by email (case-insensitive)
function findUserByEmail(email) {
  const users = readUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

// ─── Middleware: verify JWT on protected routes ────────────────────────────────
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Expect: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // attach decoded payload to request
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'AuthApp API is running.' });
});

// ── POST /api/signup ──────────────────────────────────────────────────────────
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;

  // 1. Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  // 2. Check if user already exists
  const existing = findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  // 3. Hash the password using bcrypt (salt rounds = 10)
  //    bcrypt generates a unique salt and hashes the password — never stored as plaintext
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // 4. Save new user to JSON store
  const users = readUsers();
  const newUser = {
    id:        Date.now().toString(), // simple unique ID
    email:     email.toLowerCase(),
    password:  hashedPassword,        // only the hash is stored, never plaintext
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  writeUsers(users);

  // 5. Issue a JWT so user is immediately logged in after signup
  const token = jwt.sign(
    { id: newUser.id, email: newUser.email }, // payload (don't include password)
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return res.status(201).json({
    message: 'Account created successfully.',
    token,
    user: { id: newUser.id, email: newUser.email }
  });
});

// ── POST /api/login ───────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // 1. Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // 2. Check if user exists
  const user = findUserByEmail(email);
  if (!user) {
    // Deliberately vague — don't reveal which field is wrong (security best practice)
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // 3. Compare submitted password against stored bcrypt hash
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // 4. Issue a signed JWT
  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return res.json({
    message: 'Logged in successfully.',
    token,
    user: { id: user.id, email: user.email }
  });
});

// ── GET /api/me — protected route example ────────────────────────────────────
app.get('/api/me', authenticate, (req, res) => {
  // req.user is set by the authenticate middleware after verifying the JWT
  const user = findUserByEmail(req.user.email);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  return res.json({
    user: {
      id:        user.id,
      email:     user.email,
      createdAt: user.createdAt
    }
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`AuthApp backend running on port ${PORT}`);
});
