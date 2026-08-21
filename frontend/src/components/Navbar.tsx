import React, { useState } from 'react';
import { CheckCircle2, Globe, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { COMMON_TIMEZONES } from '../utils/timezones';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onTimezoneChange: (newTz: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onTimezoneChange }) => {
  const [isChangingTz, setIsChangingTz] = useState(false);

  return (
    <header className="site-header">
      <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            backgroundColor: '#4f46e5',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-title)', letterSpacing: '-0.02em' }}>
              Habit Tracker
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Daily Local-Day Streaks
            </p>
          </div>
        </div>

        {/* User Info & Timezone */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#f1f5f9',
              padding: '6px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-main)',
              fontSize: '0.85rem'
            }}>
              <Globe size={15} color="#4f46e5" />
              <span style={{ color: 'var(--text-muted)' }}>Timezone:</span>
              
              {isChangingTz ? (
                <select
                  value={user.timezone}
                  onChange={(e) => {
                    onTimezoneChange(e.target.value);
                    setIsChangingTz(false);
                  }}
                  onBlur={() => setIsChangingTz(false)}
                  className="input-field"
                  style={{ padding: '2px 8px', fontSize: '0.85rem', width: 'auto' }}
                  autoFocus
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => setIsChangingTz(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4f46e5',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '0.85rem'
                  }}
                  title="Click to edit timezone"
                >
                  {user.timezone}
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <UserIcon size={15} />
              <span>{user.email}</span>
            </div>

            <button onClick={onLogout} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
