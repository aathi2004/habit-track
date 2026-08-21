import React, { useState, useEffect } from 'react';
import { X, Flame, Trophy, Calendar, PlusCircle, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { Habit, CheckIn, StreakInfo } from '../types';
import { api } from '../api';

interface HabitDetailModalProps {
  habit: Habit | null;
  userTimezone: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onError: (msg: string) => void;
}

export const HabitDetailModal: React.FC<HabitDetailModalProps> = ({
  habit,
  userTimezone,
  isOpen,
  onClose,
  onUpdated,
  onError,
}) => {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [streaks, setStreaks] = useState<StreakInfo | null>(null);
  const [backfillDate, setBackfillDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittingBackfill, setSubmittingBackfill] = useState(false);

  const fetchDetail = async () => {
    if (!habit) return;
    setLoading(true);
    try {
      const data = await api.getHabitDetail(habit.id);
      setCheckIns(data.checkIns);
      setStreaks(data.streaks);
      setBackfillDate(data.habit.today_local_date);
    } catch (err: any) {
      onError(err.message || 'Failed to load habit history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && habit) {
      fetchDetail();
    }
  }, [isOpen, habit?.id]);

  if (!isOpen || !habit) return null;

  const handleBackfill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backfillDate) return;

    setSubmittingBackfill(true);
    try {
      await api.checkInBackfill(habit.id, backfillDate);
      await fetchDetail();
      onUpdated();
    } catch (err: any) {
      onError(err.message || 'Failed to submit backfill check-in');
    } finally {
      setSubmittingBackfill(false);
    }
  };

  const handleDeleteCheckIn = async (date: string) => {
    if (!window.confirm(`Remove check-in for ${date}?`)) return;
    try {
      await api.deleteCheckIn(habit.id, date);
      await fetchDetail();
      onUpdated();
    } catch (err: any) {
      onError(err.message || 'Failed to delete check-in');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-clean" onClick={(e) => e.stopPropagation()} style={{ padding: '28px', maxWidth: '600px' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-main)' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-title)' }}>{habit.name}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Created on {habit.creation_local_date} • Timezone: <strong style={{ color: 'var(--primary)' }}>{userTimezone}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <X size={22} />
          </button>
        </div>

        {/* Streaks Stats Bar */}
        {streaks && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-main)', padding: '14px', borderRadius: '12px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--orange-text)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                🔥 Current
              </span>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-title)' }}>{streaks.currentStreak} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>days</span></p>
            </div>

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-main)', padding: '14px', borderRadius: '12px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--purple-text)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                🏆 Best
              </span>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-title)' }}>{streaks.longestStreak} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>days</span></p>
            </div>

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-main)', padding: '14px', borderRadius: '12px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                ✓ Total Done
              </span>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-title)' }}>{streaks.totalCheckIns}</p>
            </div>
          </div>
        )}

        {/* Backfill Section */}
        <div style={{ backgroundColor: 'var(--primary-light)', border: '1px solid #c7d2fe', borderRadius: '14px', padding: '18px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={18} />
            <span>Backfill a Past Date</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginBottom: '14px', lineHeight: 1.4 }}>
            Select any past date between <strong>{habit.creation_local_date}</strong> and <strong>{habit.today_local_date}</strong>:
          </p>

          <form onSubmit={handleBackfill} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="date"
              min={habit.creation_local_date}
              max={habit.today_local_date}
              value={backfillDate}
              onChange={(e) => setBackfillDate(e.target.value)}
              className="input-field"
              style={{ width: 'auto', flex: 1, minWidth: '170px' }}
            />
            <button type="submit" disabled={submittingBackfill} className="btn btn-primary" style={{ padding: '10px 18px' }}>
              <span>{submittingBackfill ? 'Saving...' : 'Add Check-In'}</span>
            </button>
          </form>
        </div>

        {/* History List */}
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--primary)" />
            <span>Check-in History Log</span>
          </h3>

          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading history...</p>
          ) : checkIns.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No check-ins recorded yet. Perform your first check-in above!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {checkIns.map((ci) => (
                <div
                  key={ci.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-main)',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.9rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--success-text)', fontWeight: 700 }}>✓</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-title)' }}>
                      {ci.local_date}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {new Date(ci.utc_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteCheckIn(ci.local_date)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                    title="Delete check-in"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
