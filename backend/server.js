const express    = require('express');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const cors       = require('cors');
const fs         = require('fs');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';
const JWT_EXPIRES_IN = '7d';

const DB_PATH = path.join(__dirname, 'users.json');

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

function readUsers() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([]));
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeUsers(users) {
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

function findUserByEmail(email) {
  const users = readUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

app.get('/', (req, res) => {
  res.json({ message: 'AuthApp API is running.' });
});

app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;

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

  const existing = findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const users = readUsers();
  const newUser = {
    id:        Date.now().toString(),
    email:     email.toLowerCase(),
    password:  hashedPassword,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  writeUsers(users);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return res.status(201).json({
    message: 'Account created successfully.',
    token,
    user: { id: newUser.id, email: newUser.email }
  });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

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

app.get('/api/me', authenticate, (req, res) => {
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

app.listen(PORT, () => {
  console.log(`AuthApp backend running on port ${PORT}`);
});
