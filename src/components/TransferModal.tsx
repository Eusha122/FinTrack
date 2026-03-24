'use client';

import React, { useState } from 'react';
import { AccountBalances } from '@/lib/types';
import { formatMoney } from '@/lib/parser';

interface TransferModalProps {
  onClose: () => void;
  onTransfer: (amount: number, from: 'cash' | 'bank', to: 'cash' | 'bank') => Promise<unknown> | unknown;
  balances: AccountBalances;
}

export default function TransferModal({ onClose, onTransfer, balances }: TransferModalProps) {
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState<'cash' | 'bank'>('bank');
  const to = from === 'bank' ? 'cash' : 'bank';
  const sourceBalance = from === 'cash' ? balances.cash : balances.bank;
  const destinationBalance = to === 'cash' ? balances.cash : balances.bank;

  const handleSubmit = async () => {
    const num = parseFloat(amount);
    if (!(num > 0)) {
      setError('Enter a valid amount.');
      return;
    }
    if (num > sourceBalance) {
      setError('Insufficient balance in the source account.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await onTransfer(num, from, to);
      if (!result) {
        setError('Transfer could not be completed. Check available balance and try again.');
        return;
      }
      onClose();
    } catch {
      setError('Transfer failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Transfer Between Accounts</h3>

        <div className="form-group">
          <label className="form-label">Amount</label>
          <input
            type="number"
            className="input input-lg"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && void handleSubmit()}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Direction</label>
          <div className="toggle-group" style={{ width: '100%' }}>
            <button
              className={`toggle-btn ${from === 'bank' ? 'active' : ''}`}
              onClick={() => setFrom('bank')}
              style={{ flex: 1 }}
            >
              Bank → Cash
            </button>
            <button
              className={`toggle-btn ${from === 'cash' ? 'active' : ''}`}
              onClick={() => setFrom('cash')}
              style={{ flex: 1 }}
            >
              Cash → Bank
            </button>
          </div>
        </div>

        <div className="budget-stats" style={{ marginBottom: 'var(--space-sm)' }}>
          <div className="budget-stat">
            <span className="budget-stat-label">From Balance</span>
            <span className="budget-stat-value">{formatMoney(sourceBalance)}</span>
          </div>
          <div className="budget-stat">
            <span className="budget-stat-label">To Balance</span>
            <span className="budget-stat-value">{formatMoney(destinationBalance)}</span>
          </div>
        </div>

        {error && <div className="budget-error" style={{ marginBottom: 'var(--space-sm)' }}>{error}</div>}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? 'Transferring...' : 'Transfer'}
          </button>
        </div>
      </div>
    </div>
  );
}
