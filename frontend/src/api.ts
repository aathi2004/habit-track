import { User, Habit, HabitDetailResponse, CheckIn } from './types';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e) {
    if (!res.ok) {
      throw new Error(text || `Server error (${res.status})`);
    }
    throw new Error('Server returned invalid response');
  }

  if (!res.ok) {
    throw new Error(data.error || data.details || data.message || 'An error occurred');
  }
  return data as T;
}

export const api = {
  // Auth
  async register(email: string, password: string, timezone: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, timezone }),
    });
    return handleResponse(res);
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async updateTimezone(timezone: string): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/timezone`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ timezone }),
    });
    return handleResponse(res);
  },

  // Habits
  async getHabits(): Promise<{ habits: Habit[] }> {
    const res = await fetch(`${API_BASE}/habits`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async createHabit(name: string, description?: string): Promise<{ habit: Habit }> {
    const res = await fetch(`${API_BASE}/habits`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, description }),
    });
    return handleResponse(res);
  },

  async getHabitDetail(id: number): Promise<HabitDetailResponse> {
    const res = await fetch(`${API_BASE}/habits/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async deleteHabit(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/habits/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Check-ins
  async checkInToday(habitId: number): Promise<{ message: string; checkIn: CheckIn; streaks: any }> {
    const res = await fetch(`${API_BASE}/habits/${habitId}/check-in`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({}),
    });
    return handleResponse(res);
  },

  async checkInBackfill(habitId: number, local_date: string): Promise<{ message: string; checkIn: CheckIn; streaks: any }> {
    const res = await fetch(`${API_BASE}/habits/${habitId}/check-in`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ local_date }),
    });
    return handleResponse(res);
  },

  async deleteCheckIn(habitId: number, date: string): Promise<{ message: string; streaks: any }> {
    const res = await fetch(`${API_BASE}/habits/${habitId}/check-in/${date}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
