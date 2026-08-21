import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { HabitCard } from './components/HabitCard';
import { CreateHabitModal } from './components/CreateHabitModal';
import { HabitDetailModal } from './components/HabitDetailModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { User, Habit } from './types';
import { api } from './api';
import { Plus, Flame, CheckCircle2, Sparkles } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: 'error' | 'success' = 'error') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchHabits = async () => {
    try {
      const data = await api.getHabits();
      setHabits(data.habits);
    } catch (err: any) {
      addToast(err.message || 'Failed to load habits');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getMe()
        .then((data) => {
          setUser(data.user);
          return fetchHabits();
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleAuthSuccess = async (token: string, authenticatedUser: User) => {
    localStorage.setItem('token', token);
    setUser(authenticatedUser);
    await fetchHabits();
    addToast(`Welcome, ${authenticatedUser.email}!`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setHabits([]);
  };

  const handleTimezoneChange = async (newTz: string) => {
    try {
      const res = await api.updateTimezone(newTz);
      setUser(res.user);
      await fetchHabits();
      addToast(`Timezone updated to ${newTz}. Streaks recalculated!`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update timezone');
    }
  };

  const handleCreateHabit = async (name: string, description?: string) => {
    try {
      await api.createHabit(name, description);
      await fetchHabits();
      addToast(`Habit "${name}" created!`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to create habit');
    }
  };

  const handleCheckInToday = async (habitId: number) => {
    try {
      const res = await api.checkInToday(habitId);
      await fetchHabits();
      addToast(`Check-in recorded! Current streak: ${res.streaks.currentStreak} days`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Check-in failed');
    }
  };

  const handleDeleteHabit = async (habitId: number) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!window.confirm(`Are you sure you want to delete "${habit?.name}"?`)) return;

    try {
      await api.deleteHabit(habitId);
      await fetchHabits();
      addToast('Habit deleted', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete habit');
    }
  };

  const handleOpenHistory = (habit: Habit) => {
    setSelectedHabit(habit);
    setIsDetailOpen(true);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading Habit Tracker...</p>
      </div>
    );
  }

  const completedTodayCount = habits.filter((h) => h.streaks.isCompletedToday).length;
  const maxStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streaks.currentStreak)) : 0;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      <Navbar user={user} onLogout={handleLogout} onTimezoneChange={handleTimezoneChange} />

      {!user ? (
        <AuthModal onSuccess={handleAuthSuccess} onError={(msg) => addToast(msg, 'error')} />
      ) : (
        <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 24px' }}>
          
          {/* Summary Panel */}
          <div className="clean-card" style={{ padding: '24px 32px', marginBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                  Total Habits
                </span>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-title)' }}>{habits.length}</p>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                  Completed Today
                </span>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{completedTodayCount} of {habits.length}</span>
                  <CheckCircle2 size={22} />
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                  Top Active Streak
                </span>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f97316', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{maxStreak} Days</span>
                  <Flame size={22} />
                </p>
              </div>

            </div>
          </div>

          {/* Section Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-title)', letterSpacing: '-0.02em' }}>Your Habits</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Evaluated for local day in <strong>{user.timezone}</strong>
              </p>
            </div>

            <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary" style={{ padding: '10px 18px' }}>
              <Plus size={18} />
              <span>Add New Habit</span>
            </button>
          </div>

          {/* Habit Cards Grid */}
          {habits.length === 0 ? (
            <div className="clean-card" style={{
              padding: '60px 24px',
              textAlign: 'center',
              maxWidth: '540px',
              margin: '40px auto'
            }}>
              <div style={{
                backgroundColor: 'var(--primary-light)',
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                marginBottom: '16px'
              }}>
                <Sparkles size={28} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-title)', marginBottom: '8px' }}>No Habits Added Yet</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Add your first habit (e.g. Drink Water, Read 30 Mins, Exercise) and start tracking your daily streak!
              </p>
              <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
                <Plus size={18} />
                <span>Create Your First Habit</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '24px' }}>
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onCheckInToday={handleCheckInToday}
                  onOpenHistory={handleOpenHistory}
                  onDelete={handleDeleteHabit}
                />
              ))}
            </div>
          )}
        </main>
      )}

      {/* Modals */}
      <CreateHabitModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateHabit}
      />

      <HabitDetailModal
        habit={selectedHabit}
        userTimezone={user?.timezone || 'UTC'}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedHabit(null);
        }}
        onUpdated={fetchHabits}
        onError={(msg) => addToast(msg, 'error')}
      />

      {/* Toast alerts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
