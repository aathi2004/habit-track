import { DateTime } from 'luxon';
import { getTodayLocalDate, getYesterdayLocalDate, diffDays } from '../utils/timezone';

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  isCompletedToday: boolean;
  isCompletedYesterday: boolean;
  totalCheckIns: number;
  lastCheckInDate: string | null;
}

/**
 * Calculates current and longest streaks based strictly on local calendar days.
 */
export function calculateStreaks(
  checkInLocalDates: string[],
  timezone: string,
  referenceUtc?: string | Date
): StreakResult {
  if (!checkInLocalDates || checkInLocalDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isCompletedToday: false,
      isCompletedYesterday: false,
      totalCheckIns: 0,
      lastCheckInDate: null,
    };
  }

  // Deduplicate and sort dates ascending (e.g. "2026-03-10", "2026-03-11", "2026-03-12")
  const dateSet = new Set(checkInLocalDates);
  const sortedDates = Array.from(dateSet).sort();

  const todayLocal = getTodayLocalDate(timezone, referenceUtc);
  const yesterdayLocal = getYesterdayLocalDate(timezone, referenceUtc);

  const isCompletedToday = dateSet.has(todayLocal);
  const isCompletedYesterday = dateSet.has(yesterdayLocal);

  // 1. Calculate Longest Streak
  let longestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const diff = diffDays(sortedDates[i], sortedDates[i - 1]);
    if (diff === 1) {
      currentRun += 1;
    } else if (diff > 1) {
      currentRun = 1;
    }
    if (currentRun > longestStreak) {
      longestStreak = currentRun;
    }
  }

  // 2. Calculate Current Streak
  let currentStreak = 0;
  let anchorDate: string | null = null;

  if (isCompletedToday) {
    anchorDate = todayLocal;
  } else if (isCompletedYesterday) {
    anchorDate = yesterdayLocal;
  }

  if (anchorDate) {
    currentStreak = 1;
    let checkCursor = DateTime.fromISO(anchorDate).minus({ days: 1 });

    while (true) {
      const cursorStr = checkCursor.toISODate()!;
      if (dateSet.has(cursorStr)) {
        currentStreak += 1;
        checkCursor = checkCursor.minus({ days: 1 });
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
    isCompletedToday,
    isCompletedYesterday,
    totalCheckIns: sortedDates.length,
    lastCheckInDate: sortedDates[sortedDates.length - 1],
  };
}
