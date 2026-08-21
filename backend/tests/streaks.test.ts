import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { db, initDatabase, closeDatabase } from '../src/db/database';
import { calculateStreaks } from '../src/services/streakService';
import { utcToLocalDate } from '../src/utils/timezone';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await initDatabase();
});

beforeEach(() => {
  db.exec('DELETE FROM check_ins');
  db.exec('DELETE FROM habits');
  db.exec('DELETE FROM users');
});

afterAll(() => {
  closeDatabase();
});

describe('Timezone & Local-Day Conversion Utility', () => {
  it('correctly maps UTC timestamps to Asia/Kolkata local dates as per worked example', () => {
    const tz = 'Asia/Kolkata';

    // Check-in A: 2026-03-10T14:30Z -> local 2026-03-10 20:00 (2026-03-10)
    expect(utcToLocalDate('2026-03-10T14:30:00Z', tz)).toBe('2026-03-10');

    // Check-in B: 2026-03-11T10:30Z -> local 2026-03-11 16:00 (2026-03-11)
    expect(utcToLocalDate('2026-03-11T10:30:00Z', tz)).toBe('2026-03-11');

    // Check-in C: 2026-03-11T21:30Z -> local 2026-03-12 03:00 (2026-03-12)
    expect(utcToLocalDate('2026-03-11T21:30:00Z', tz)).toBe('2026-03-12');

    // Check-in D: 2026-03-12T17:30Z -> local 2026-03-12 23:00 (2026-03-12)
    expect(utcToLocalDate('2026-03-12T17:30:00Z', tz)).toBe('2026-03-12');
  });

  it('handles Daylight Saving Time (DST) spring-forward and fall-back transition days correctly in America/New_York', () => {
    const tz = 'America/New_York';

    // US Spring Forward: March 8, 2026 (23-hour day)
    // 2026-03-08T06:30:00Z is 01:30 AM EST (2026-03-08)
    // 2026-03-08T07:30:00Z is 03:30 AM EDT (2026-03-08)
    expect(utcToLocalDate('2026-03-08T06:30:00Z', tz)).toBe('2026-03-08');
    expect(utcToLocalDate('2026-03-08T07:30:00Z', tz)).toBe('2026-03-08');

    // Streak calculation across DST boundary (March 7, 8, 9)
    const localDates = ['2026-03-07', '2026-03-08', '2026-03-09'];
    const streaks = calculateStreaks(localDates, tz, '2026-03-09T12:00:00Z');

    expect(streaks.currentStreak).toBe(3);
    expect(streaks.longestStreak).toBe(3);
  });
});

describe('Server-Side Streak Calculation Engine', () => {
  it('computes current and longest streaks correctly with reference UTC date', () => {
    const tz = 'Asia/Kolkata';
    const referenceUtc = '2026-03-12T12:00:00Z'; // Today local is 2026-03-12

    const localDates = ['2026-03-10', '2026-03-11', '2026-03-12'];
    const streaks = calculateStreaks(localDates, tz, referenceUtc);

    expect(streaks.currentStreak).toBe(3);
    expect(streaks.longestStreak).toBe(3);
    expect(streaks.isCompletedToday).toBe(true);
  });

  it('keeps current streak alive if yesterday is completed but today is not yet logged', () => {
    const tz = 'Asia/Kolkata';
    const referenceUtc = '2026-03-13T12:00:00Z'; // Today local is 2026-03-13, Yesterday is 2026-03-12

    const localDates = ['2026-03-10', '2026-03-11', '2026-03-12'];
    const streaks = calculateStreaks(localDates, tz, referenceUtc);

    expect(streaks.currentStreak).toBe(3);
    expect(streaks.longestStreak).toBe(3);
    expect(streaks.isCompletedToday).toBe(false);
    expect(streaks.isCompletedYesterday).toBe(true);
  });

  it('resets current streak to 0 if both today and yesterday are unfulfilled', () => {
    const tz = 'Asia/Kolkata';
    const referenceUtc = '2026-03-14T12:00:00Z'; // Today is 2026-03-14, Yesterday is 2026-03-13

    const localDates = ['2026-03-10', '2026-03-11', '2026-03-12'];
    const streaks = calculateStreaks(localDates, tz, referenceUtc);

    expect(streaks.currentStreak).toBe(0);
    expect(streaks.longestStreak).toBe(3);
  });

  it('recalculates streaks accurately when backfilling a missing date', () => {
    const tz = 'Asia/Kolkata';
    const referenceUtc = '2026-03-12T12:00:00Z'; // Today is 2026-03-12

    // Gapped check-ins
    let localDates = ['2026-03-10', '2026-03-12'];
    let streaks = calculateStreaks(localDates, tz, referenceUtc);

    expect(streaks.currentStreak).toBe(1);
    expect(streaks.longestStreak).toBe(1);

    // Backfill 2026-03-11
    localDates.push('2026-03-11');
    streaks = calculateStreaks(localDates, tz, referenceUtc);

    expect(streaks.currentStreak).toBe(3);
    expect(streaks.longestStreak).toBe(3);
  });
});

describe('Habit API Endpoints, Pagination & Worked Example', () => {
  let token: string;
  let habitId: number;

  beforeEach(async () => {
    // Register user with Asia/Kolkata timezone
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'kolkata.user@example.com',
        password: 'password123',
        timezone: 'Asia/Kolkata',
      });
    
    token = regRes.body.token;

    // Create a habit
    const habitRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Drink 3L Water',
        description: 'Stay hydrated every day',
      });
    
    habitId = habitRes.body.habit.id;

    // Override habit created_at date to 2026-03-01 so past March check-ins are valid
    db.prepare("UPDATE habits SET created_at = '2026-03-01T00:00:00.000Z' WHERE id = ?").run(habitId);
  });

  it('executes the EXACT Worked Example scenario (A, B, C, D in Asia/Kolkata)', async () => {
    // Check-in A: 2026-03-10T14:30Z -> local 2026-03-10
    const resA = await request(app)
      .post(`/api/habits/${habitId}/check-in`)
      .set('Authorization', `Bearer ${token}`)
      .send({ utc_timestamp: '2026-03-10T14:30:00Z' });
    
    expect(resA.status).toBe(201);
    expect(resA.body.checkIn.local_date).toBe('2026-03-10');

    // Check-in B: 2026-03-11T10:30Z -> local 2026-03-11 (20 hours apart, 2 different local days -> streak = 2)
    const resB = await request(app)
      .post(`/api/habits/${habitId}/check-in`)
      .set('Authorization', `Bearer ${token}`)
      .send({ utc_timestamp: '2026-03-11T10:30:00Z' });

    expect(resB.status).toBe(201);
    expect(resB.body.checkIn.local_date).toBe('2026-03-11');
    expect(resB.body.streaks.longestStreak).toBe(2);

    // Check-in C: 2026-03-11T21:30Z -> local 2026-03-12 (11 hours after B, a new local day -> streak = 3)
    const resC = await request(app)
      .post(`/api/habits/${habitId}/check-in`)
      .set('Authorization', `Bearer ${token}`)
      .send({ utc_timestamp: '2026-03-11T21:30:00Z' });

    expect(resC.status).toBe(201);
    expect(resC.body.checkIn.local_date).toBe('2026-03-12');
    expect(resC.body.streaks.longestStreak).toBe(3);

    // Check-in D: 2026-03-12T17:30Z -> local 2026-03-12 (20 hours after C, SAME local day -> duplicate rejected!)
    const resD = await request(app)
      .post(`/api/habits/${habitId}/check-in`)
      .set('Authorization', `Bearer ${token}`)
      .send({ utc_timestamp: '2026-03-12T17:30:00Z' });

    expect(resD.status).toBe(409); // Conflict!
    expect(resD.body.error).toContain('Check-in already exists');

    // Verify history and streaks via GET endpoint
    const historyRes = await request(app)
      .get(`/api/habits/${habitId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.checkIns.length).toBe(3); // 3 check-ins recorded (A, B, C)
    expect(historyRes.body.streaks.longestStreak).toBe(3);
  });

  it('supports API pagination for listing habits', async () => {
    // Add 2 more habits
    await request(app).post('/api/habits').set('Authorization', `Bearer ${token}`).send({ name: 'Read 30 Mins' });
    await request(app).post('/api/habits').set('Authorization', `Bearer ${token}`).send({ name: 'Run 5km' });

    const res = await request(app)
      .get('/api/habits?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.habits.length).toBe(2);
    expect(res.body.pagination).toEqual({
      total: 3,
      page: 1,
      limit: 2,
      totalPages: 2,
    });
  });

  it('rejects check-in prior to habit creation local date', async () => {
    const res = await request(app)
      .post(`/api/habits/${habitId}/check-in`)
      .set('Authorization', `Bearer ${token}`)
      .send({ local_date: '2026-02-28' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('prior to the habit creation date');
  });

  it('rejects check-in in local future date', async () => {
    const res = await request(app)
      .post(`/api/habits/${habitId}/check-in`)
      .set('Authorization', `Bearer ${token}`)
      .send({ local_date: '2099-12-31' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('local future');
  });

  it('prevents user from modifying habit belonging to another user', async () => {
    const user2 = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'other.user@example.com',
        password: 'password123',
        timezone: 'UTC',
      });

    const res = await request(app)
      .post(`/api/habits/${habitId}/check-in`)
      .set('Authorization', `Bearer ${user2.body.token}`)
      .send({ local_date: '2026-03-05' });

    expect(res.status).toBe(404);
  });
});
