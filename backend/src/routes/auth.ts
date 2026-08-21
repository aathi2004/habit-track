import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database';
import { authenticate, generateToken, AuthRequest } from '../middleware/auth';
import { isValidTimeZone } from '../utils/timezone';

const router = Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, timezone } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const userTimezone = timezone || 'UTC';
    if (!isValidTimeZone(userTimezone)) {
      return res.status(400).json({ error: `Invalid IANA timezone: ${userTimezone}` });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();

    const result = db.prepare(
      'INSERT INTO users (email, password_hash, timezone, created_at) VALUES (?, ?, ?, ?)'
    ).run(email.toLowerCase().trim(), passwordHash, userTimezone, createdAt);

    const userId = Number(result.lastInsertRowid);
    const user = { id: userId, email: email.toLowerCase().trim(), timezone: userTimezone };
    const token = generateToken(user);

    return res.status(201).json({ token, user });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error during registration', details: err.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as any;
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({ id: user.id, email: user.email });
    return res.json({
      token,
      user: { id: user.id, email: user.email, timezone: user.timezone },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error during login', details: err.message });
  }
});

// Get current user profile
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

// Update timezone
router.put('/timezone', authenticate, (req: AuthRequest, res: Response) => {
  const { timezone } = req.body;

  if (!isValidTimeZone(timezone)) {
    return res.status(400).json({ error: `Invalid IANA timezone: ${timezone}` });
  }

  db.prepare('UPDATE users SET timezone = ? WHERE id = ?').run(timezone, req.user!.id);
  
  return res.json({
    user: {
      id: req.user!.id,
      email: req.user!.email,
      timezone,
    },
  });
});

export default router;
