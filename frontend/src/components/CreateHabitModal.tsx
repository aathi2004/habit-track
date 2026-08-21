import React, { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';

interface CreateHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description?: string) => Promise<void>;
}

export const CreateHabitModal: React.FC<CreateHabitModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onCreate(name.trim(), description.trim());
      setName('');
      setDescription('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-clean" onClick={(e) => e.stopPropagation()} style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: 'var(--primary-light)', padding: '8px', borderRadius: '10px', color: 'var(--primary)' }}>
              <Sparkles size={20} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-title)' }}>Create New Habit</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-title)' }}>
              Habit Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Drink 3L Water, Read 30 Mins, Run 5km"
              className="input-field"
              autoFocus
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-title)' }}>
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details or notes..."
              className="input-field"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Plus size={18} />
              <span>{loading ? 'Creating...' : 'Create Habit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
