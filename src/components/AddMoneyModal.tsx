'use client';

import React, { useState } from 'react';
import { Transaction } from '@/lib/types';

interface AddMoneyModalProps {
  onClose: () => void;
  onAdd: (tx: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => void;
}

export default function AddMoneyModal({ onClose, onAdd }: AddMoneyModalProps) {
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState<'cash' | 'bank'>('cash');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    const num = parseFloat(amount);
    if (num > 0) {
      onAdd({
        type: 'income',
        amount: num,
        category: 'Salary',
        note: note || null,
        account,
        target_account: null,
        date: new Date().toISOString(),
      });
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Quick Add Money</h3>

        <div className="form-group">
          <label className="form-label">Amount</label>
          <input
            type="number"
            className="input input-lg"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Account</label>
          <div className="toggle-group" style={{ width: '100%' }}>
            <button
              className={`toggle-btn ${account === 'cash' ? 'active' : ''}`}
              onClick={() => setAccount('cash')}
              style={{ flex: 1 }}
            >
              Cash
            </button>
            <button
              className={`toggle-btn ${account === 'bank' ? 'active' : ''}`}
              onClick={() => setAccount('bank')}
              style={{ flex: 1 }}
            >
              Bank
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Note (optional)</label>
          <input
            type="text"
            className="input"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Initial balance, Salary..."
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Add Money</button>
        </div>
      </div>
    </div>
  );
}
