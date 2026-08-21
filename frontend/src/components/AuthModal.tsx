import React, { useState } from 'react';
import { CheckCircle2, Mail, Lock, Globe, ArrowRight } from 'lucide-react';
import { COMMON_TIMEZONES, getSystemTimezone } from '../utils/timezones';
import { api } from '../api';
import { User } from '../types';

interface AuthModalProps {
  onSuccess: (token: string, user: User) => void;
  onError: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onError }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timezone, setTimezone] = useState(getSystemTimezone());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      onError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const data = await api.login(email, password);
        onSuccess(data.token, data.user);
      } else {
        const data = await api.register(email, password, timezone);
        onSuccess(data.token, data.user);
      }
    } catch (err: any) {
      onError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto 0', padding: '0 16px' }}>
      <div className="clean-card" style={{ padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            backgroundColor: '#4f46e5',
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: '16px'
          }}>
            <CheckCircle2 size={30} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-title)', marginBottom: '6px' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isLogin ? 'Log in to track your daily local-day streaks' : 'Start tracking habits with accurate timezone streaks'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-title)' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-title)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-title)' }}>
                Your Local Timezone (IANA)
              </label>
              <div style={{ position: 'relative' }}>
                <Globe size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', zIndex: 1 }} />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Auto-detected: {timezone}. Streaks evaluate in your local timezone.
              </p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '6px' }}>
            <span>{loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-main)' }}>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};
