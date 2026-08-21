export interface User {
  id: number;
  email: string;
  timezone: string;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  isCompletedToday: boolean;
  isCompletedYesterday: boolean;
  totalCheckIns: number;
  lastCheckInDate: string | null;
}

export interface Habit {
  id: number;
  user_id: number;
  name: string;
  description: string;
  created_at: string;
  creation_local_date: string;
  today_local_date: string;
  streaks: StreakInfo;
}

export interface CheckIn {
  id: number;
  habit_id: number;
  utc_timestamp: string;
  local_date: string;
  created_at: string;
}

export interface HabitDetailResponse {
  habit: Habit;
  checkIns: CheckIn[];
  streaks: StreakInfo;
}

export interface IANATimeZoneOption {
  value: string;
  label: string;
}
