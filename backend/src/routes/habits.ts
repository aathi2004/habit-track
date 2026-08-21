import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { calculateStreaks } from '../services/streakService';
import {
  getTodayLocalDate,
  isFutureLocalDate,
  isBeforeHabitCreationDate,
  utcToLocalDate,
} from '../utils/timezone';

const router = Router();

// Apply auth middleware to all habit routes
router.use(authenticate as any);

/**
 * GET /api/habits
 * Returns habits for the authenticated user with server-computed streaks and optional pagination.
 * Query params: ?page=1&limit=10
 */
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userTimezone = req.user!.timezone;

    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt((req.query.limit as string) || '10', 10)));
    const offset = (page - 1) * limit;

    const totalCountRow = db.prepare('SELECT COUNT(*) as count FROM habits WHERE user_id = ?').get(userId) as any;
    const totalHabits = Number(totalCountRow?.count || 0);

    const habits = db.prepare(
      'SELECT * FROM habits WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?'
    ).all(userId, limit, offset) as any[];

    const habitsWithStreaks = habits.map((habit) => {
      const checkIns = db.prepare(
        'SELECT local_date FROM check_ins WHERE habit_id = ?'
      ).all(habit.id) as { local_date: string }[];

      const localDates = checkIns.map((c) => c.local_date);
      const streakInfo = calculateStreaks(localDates, userTimezone);
      const creationLocalDate = utcToLocalDate(habit.created_at, userTimezone);

      return {
        ...habit,
        creation_local_date: creationLocalDate,
        today_local_date: getTodayLocalDate(userTimezone),
        streaks: streakInfo,
      };
    });

    return res.json({
      habits: habitsWithStreaks,
      pagination: {
        total: totalHabits,
        page,
        limit,
        totalPages: Math.ceil(totalHabits / limit) || 1,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch habits', details: err.message });
  }
});

/**
 * POST /api/habits
 * Create a new habit for current user.
 */
router.post('/', (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const userId = req.user!.id;
    const userTimezone = req.user!.timezone;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Habit name is required' });
    }

    const createdAt = new Date().toISOString();

    const result = db.prepare(
      'INSERT INTO habits (user_id, name, description, created_at) VALUES (?, ?, ?, ?)'
    ).run(userId, name.trim(), (description || '').trim(), createdAt);

    const habitId = Number(result.lastInsertRowid);
    const newHabit = db.prepare('SELECT * FROM habits WHERE id = ?').get(habitId) as any;

    const streakInfo = calculateStreaks([], userTimezone);
    const creationLocalDate = utcToLocalDate(createdAt, userTimezone);

    return res.status(201).json({
      habit: {
        ...newHabit,
        creation_local_date: creationLocalDate,
        today_local_date: getTodayLocalDate(userTimezone),
        streaks: streakInfo,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create habit', details: err.message });
  }
});

/**
 * GET /api/habits/:id
 * Get single habit details, check-in history, and streaks.
 */
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const habitId = Number(req.params.id);
    const userId = req.user!.id;
    const userTimezone = req.user!.timezone;

    const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').get(habitId, userId) as any;
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found or access denied' });
    }

    const checkIns = db.prepare(
      'SELECT id, utc_timestamp, local_date, created_at FROM check_ins WHERE habit_id = ? ORDER BY local_date DESC'
    ).all(habitId) as any[];

    const localDates = checkIns.map((c) => c.local_date);
    const streakInfo = calculateStreaks(localDates, userTimezone);

    return res.json({
      habit: {
        ...habit,
        creation_local_date: utcToLocalDate(habit.created_at, userTimezone),
        today_local_date: getTodayLocalDate(userTimezone),
      },
      checkIns,
      streaks: streakInfo,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch habit details', details: err.message });
  }
});

/**
 * DELETE /api/habits/:id
 * Delete a habit and its check-ins.
 */
router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const habitId = Number(req.params.id);
    const userId = req.user!.id;

    const habit = db.prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?').get(habitId, userId);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found or access denied' });
    }

    db.prepare('DELETE FROM habits WHERE id = ?').run(habitId);
    return res.json({ message: 'Habit deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete habit', details: err.message });
  }
});

/**
 * POST /api/habits/:id/check-in
 * Submit a check-in for a habit (today or backfilled date).
 */
router.post('/:id/check-in', (req: AuthRequest, res: Response) => {
  try {
    const habitId = Number(req.params.id);
    const userId = req.user!.id;
    const userTimezone = req.user!.timezone;

    const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').get(habitId, userId) as any;
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found or access denied' });
    }

    let { utc_timestamp, local_date } = req.body;
    let targetLocalDate: string;
    let targetUtcTimestamp: string;

    const nowUtc = new Date().toISOString();

    if (utc_timestamp) {
      try {
        targetLocalDate = utcToLocalDate(utc_timestamp, userTimezone);
        targetUtcTimestamp = utc_timestamp;
      } catch (err: any) {
        return res.status(400).json({ error: 'Invalid ISO UTC timestamp provided' });
      }
    } else if (local_date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(local_date)) {
        return res.status(400).json({ error: 'local_date must be in YYYY-MM-DD format' });
      }
      targetLocalDate = local_date;
      targetUtcTimestamp = `${local_date}T12:00:00.000Z`;
    } else {
      targetLocalDate = getTodayLocalDate(userTimezone);
      targetUtcTimestamp = nowUtc;
    }

    if (isFutureLocalDate(targetLocalDate, userTimezone)) {
      return res.status(400).json({
        error: `Cannot check in for a date in your local future (${targetLocalDate} is ahead of your today ${getTodayLocalDate(userTimezone)})`,
      });
    }

    if (isBeforeHabitCreationDate(targetLocalDate, habit.created_at, userTimezone)) {
      const habitCreationLocalDate = utcToLocalDate(habit.created_at, userTimezone);
      return res.status(400).json({
        error: `Cannot check in for ${targetLocalDate} because it is prior to the habit creation date (${habitCreationLocalDate})`,
      });
    }

    const createdAt = nowUtc;
    try {
      db.prepare(
        'INSERT INTO check_ins (habit_id, utc_timestamp, local_date, created_at) VALUES (?, ?, ?, ?)'
      ).run(habitId, targetUtcTimestamp, targetLocalDate, createdAt);
    } catch (dbErr: any) {
      if (dbErr.code === 'SQLITE_CONSTRAINT_UNIQUE' || dbErr.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({
          error: `Check-in already exists for habit on local date ${targetLocalDate}`,
        });
      }
      throw dbErr;
    }

    const checkIns = db.prepare(
      'SELECT local_date FROM check_ins WHERE habit_id = ?'
    ).all(habitId) as { local_date: string }[];

    const localDates = checkIns.map((c) => c.local_date);
    const updatedStreaks = calculateStreaks(localDates, userTimezone);

    return res.status(201).json({
      message: 'Check-in recorded successfully',
      checkIn: {
        habit_id: habitId,
        utc_timestamp: targetUtcTimestamp,
        local_date: targetLocalDate,
        created_at: createdAt,
      },
      streaks: updatedStreaks,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to record check-in', details: err.message });
  }
});

/**
 * DELETE /api/habits/:id/check-in/:date
 * Remove a check-in for a specific local date.
 */
router.delete('/:id/check-in/:date', (req: AuthRequest, res: Response) => {
  try {
    const habitId = Number(req.params.id);
    const targetDate = req.params.date;
    const userId = req.user!.id;
    const userTimezone = req.user!.timezone;

    const habit = db.prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?').get(habitId, userId);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found or access denied' });
    }

    const result = db.prepare(
      'DELETE FROM check_ins WHERE habit_id = ? AND local_date = ?'
    ).run(habitId, targetDate);

    if (result.changes === 0) {
      return res.status(404).json({ error: `No check-in found for date ${targetDate}` });
    }

    const checkIns = db.prepare(
      'SELECT local_date FROM check_ins WHERE habit_id = ?'
    ).all(habitId) as { local_date: string }[];

    const localDates = checkIns.map((c) => c.local_date);
    const updatedStreaks = calculateStreaks(localDates, userTimezone);

    return res.json({
      message: `Check-in for ${targetDate} deleted successfully`,
      streaks: updatedStreaks,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete check-in', details: err.message });
  }
});

export default router;
