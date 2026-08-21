import React, { useState } from 'react';
import { Flame, Trophy, CheckCircle2, Calendar, History, Trash2 } from 'lucide-react';
import { Habit } from '../types';

interface HabitCardProps {
  habit: Habit;
  onCheckInToday: (habitId: number) => Promise<void>;
  onOpenHistory: (habit: Habit) => void;
  onDelete: (habitId: number) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onCheckInToday,
  onOpenHistory,
  onDelete,
}) => {
  const [loading, setLoading] = useState(false);

  const { streaks } = habit;
  const isCompleted = streaks.isCompletedToday;

  const handleQuickCheckIn = async () => {
    if (isCompleted || loading) return;
    setLoading(true);
    try {
      await onCheckInToday(habit.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clean-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      
      {/* Top Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-title)', marginBottom: '4px' }}>
              {habit.name}
            </h3>
            {habit.description ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.4 }}>
                {habit.description}
              </p>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Daily Habit
              </p>
            )}
          </div>

          <button
            onClick={() => onDelete(habit.id)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            title="Delete habit"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Streaks Information Boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '18px 0 22px' }}>
          
          {/* Current Streak */}
          <div style={{
            backgroundColor: 'var(--orange-bg)',
            border: '1px solid #fed7aa',
            borderRadius: '12px',
            padding: '10px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--orange-text)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
              <Flame size={14} />
              <span>Current Streak</span>
            </div>
            <p style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-title)' }}>
              {streaks.currentStreak} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{streaks.currentStreak === 1 ? 'day' : 'days'}</span>
            </p>
          </div>

          {/* Longest Streak */}
          <div style={{
            backgroundColor: 'var(--purple-bg)',
            border: '1px solid #ddd6fe',
            borderRadius: '12px',
            padding: '10px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--purple-text)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
              <Trophy size={14} />
              <span>Best Record</span>
            </div>
            <p style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-title)' }}>
              {streaks.longestStreak} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{streaks.longestStreak === 1 ? 'day' : 'days'}</span>
            </p>
          </div>

        </div>
      </div>

      {/* Check-In Action */}
      <div>
        <div style={{ marginBottom: '14px' }}>
          {isCompleted ? (
            <div className="btn-done-pill">
              <CheckCircle2 size={20} />
              <span>✓ Completed Today</span>
            </div>
          ) : (
            <button
              onClick={handleQuickCheckIn}
              disabled={loading}
              className="btn btn-checkin-large"
            >
              <CheckCircle2 size={20} />
              <span>{loading ? 'Saving...' : `+ Check In Today (${habit.today_local_date})`}</span>
            </button>
          )}
        </div>

        {/* Footer Link */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-main)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} />
            <span>Started {habit.creation_local_date}</span>
          </div>

          <button
            onClick={() => onOpenHistory(habit)}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <History size={14} />
            <span>History & Backfill</span>
          </button>
        </div>
      </div>

    </div>
  );
};
