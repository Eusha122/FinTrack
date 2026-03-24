'use client';

import React, { useState } from 'react';
import { RecurringTransaction } from '@/lib/types';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface RecurringManagerProps {
  recurring: RecurringTransaction[];
  categories: string[];
  onAdd: (rec: Omit<RecurringTransaction, 'id' | 'created_at' | 'is_active' | 'user_id'>) => void;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}

export default function RecurringManager({
  recurring,
  categories,
  onAdd,
  onToggle,
  onDelete,
}: RecurringManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: 'Others',
    note: '',
    account: 'cash' as 'cash' | 'bank',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
  });

  const handleSubmit = () => {
    const amt = parseFloat(form.amount);
    if (amt <= 0 || isNaN(amt)) return;

    const now = new Date();
    let nextRun: Date;
    if (form.frequency === 'daily') nextRun = addDays(now, 1);
    else if (form.frequency === 'weekly') nextRun = addWeeks(now, 1);
    else nextRun = addMonths(now, 1);

    onAdd({
      type: form.type,
      amount: amt,
      category: form.category,
      note: form.note || null,
      account: form.account,
      frequency: form.frequency,
      next_run: nextRun.toISOString(),
    });

    setForm({ type: 'expense', amount: '', category: 'Others', note: '', account: 'cash', frequency: 'monthly' });
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Recurring Transactions</h3>
        <button className="btn btn-outline btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> Add
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input
                type="number"
                className="input"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="filter-select"
                style={{ width: '100%' }}
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <div className="toggle-group" style={{ width: '100%' }}>
                <button className={`toggle-btn ${form.type === 'expense' ? 'active' : ''}`} onClick={() => setForm({ ...form, type: 'expense' })} style={{ flex: 1 }}>Expense</button>
                <button className={`toggle-btn ${form.type === 'income' ? 'active' : ''}`} onClick={() => setForm({ ...form, type: 'income' })} style={{ flex: 1 }}>Income</button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Account</label>
              <div className="toggle-group" style={{ width: '100%' }}>
                <button className={`toggle-btn ${form.account === 'cash' ? 'active' : ''}`} onClick={() => setForm({ ...form, account: 'cash' })} style={{ flex: 1 }}>Cash</button>
                <button className={`toggle-btn ${form.account === 'bank' ? 'active' : ''}`} onClick={() => setForm({ ...form, account: 'bank' })} style={{ flex: 1 }}>Bank</button>
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Frequency</label>
              <select
                className="filter-select"
                style={{ width: '100%' }}
                value={form.frequency}
                onChange={e => setForm({ ...form, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Note</label>
              <input
                type="text"
                className="input"
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', marginTop: 'var(--space-sm)' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleSubmit}>Save</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {recurring.length === 0 && (
          <div className="empty-state"><p>No recurring transactions</p></div>
        )}
        {recurring.map(rec => (
          <div key={rec.id} className="recurring-item">
            <div className="recurring-info">
              <div className="recurring-main">
                <span className={`badge badge-${rec.type}`}>{rec.type}</span>
                {' '}{rec.amount} - {rec.category}
              </div>
              <div className="recurring-sub">
                {rec.frequency} | {rec.account} | Next: {format(new Date(rec.next_run), 'MMM d, yyyy')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-xs)', alignItems: 'center' }}>
              <button
                className="btn btn-icon btn-ghost btn-sm"
                onClick={() => onToggle(rec.id, !rec.is_active)}
                title={rec.is_active ? 'Disable' : 'Enable'}
              >
                {rec.is_active ? <ToggleRight size={18} style={{ color: 'var(--color-income)' }} /> : <ToggleLeft size={18} />}
              </button>
              <button className="btn btn-icon btn-danger btn-sm" onClick={() => onDelete(rec.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
