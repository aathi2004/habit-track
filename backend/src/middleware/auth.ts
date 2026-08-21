import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    timezone: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-habit-key-2026';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid format' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    
    // Fetch fresh user data (specifically current timezone)
    const user = db.prepare('SELECT id, email, timezone FROM users WHERE id = ?').get(payload.id) as {
      id: number;
      email: string;
      timezone: string;
    } | undefined;

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

export function generateToken(user: { id: number; email: string }): string {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}
