import { DateTime, IANAZone } from 'luxon';

/**
 * Validates if an IANA timezone string is valid.
 */
export function isValidTimeZone(timezone: string): boolean {
  if (!timezone || typeof timezone !== 'string') return false;
  return IANAZone.create(timezone).isValid;
}

/**
 * Gets the local date string (YYYY-MM-DD) for a given timezone and reference UTC instant.
 */
export function getTodayLocalDate(timezone: string, referenceUtc?: string | Date): string {
  const dt = referenceUtc
    ? (typeof referenceUtc === 'string' ? DateTime.fromISO(referenceUtc, { zone: 'utc' }) : DateTime.fromJSDate(referenceUtc, { zone: 'utc' }))
    : DateTime.utc();
  
  return dt.setZone(timezone).toISODate()!;
}

/**
 * Gets yesterday's local date string (YYYY-MM-DD) in the specified timezone.
 */
export function getYesterdayLocalDate(timezone: string, referenceUtc?: string | Date): string {
  const dt = referenceUtc
    ? (typeof referenceUtc === 'string' ? DateTime.fromISO(referenceUtc, { zone: 'utc' }) : DateTime.fromJSDate(referenceUtc, { zone: 'utc' }))
    : DateTime.utc();

  return dt.setZone(timezone).minus({ days: 1 }).toISODate()!;
}

/**
 * Converts a UTC ISO timestamp to local date (YYYY-MM-DD) in the user's timezone.
 */
export function utcToLocalDate(utcIsoString: string, timezone: string): string {
  const dt = DateTime.fromISO(utcIsoString, { zone: 'utc' });
  if (!dt.isValid) {
    throw new Error(`Invalid UTC timestamp: ${utcIsoString}`);
  }
  return dt.setZone(timezone).toISODate()!;
}

/**
 * Checks if a requested local date string (YYYY-MM-DD) is in the user's local future.
 */
export function isFutureLocalDate(localDate: string, timezone: string, referenceUtc?: string | Date): boolean {
  const todayLocal = getTodayLocalDate(timezone, referenceUtc);
  return localDate > todayLocal;
}

/**
 * Checks if a requested local date string (YYYY-MM-DD) is before the habit creation local date.
 */
export function isBeforeHabitCreationDate(
  localDate: string,
  habitCreatedAtUtc: string,
  timezone: string
): boolean {
  const creationLocalDate = utcToLocalDate(habitCreatedAtUtc, timezone);
  return localDate < creationLocalDate;
}

/**
 * Computes difference in calendar days between two YYYY-MM-DD strings.
 * e.g., diffDays('2026-03-11', '2026-03-10') = 1 day
 */
export function diffDays(dateA: string, dateB: string): number {
  const dtA = DateTime.fromISO(dateA);
  const dtB = DateTime.fromISO(dateB);
  return Math.round(dtA.diff(dtB, 'days').days);
}
