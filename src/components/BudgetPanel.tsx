'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Gauge } from 'lucide-react';
import { formatMoney } from '@/lib/parser';

interface BudgetPanelProps {
  monthlyBudget: number;
  monthSpending: number;
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  onSave: (amount: number) => Promise<{ error: string | null }>;
}

export default function BudgetPanel({
  monthlyBudget,
  monthSpending,
  loading = false,
  saving = false,
  error,
  onSave,
}: BudgetPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const budget = Number(monthlyBudget || 0);
  const usedPctRaw = budget > 0 ? (monthSpending / budget) * 100 : 0;
  const usedPct = Math.min(100, Math.max(0, Math.round(usedPctRaw)));
  const remaining = budget - monthSpending;

  const status = useMemo(() => {
    if (budget <= 0 || usedPctRaw < 60) {
      return {
        tone: 'neutral' as const,
        text: 'Under budget',
        helper: 'Spending is under control',
      };
    }
    if (usedPctRaw > 100) {
      return {
        tone: 'danger' as const,
        text: 'Budget exceeded',
        helper: 'Reduce spending to return within your limit',
      };
    }
    if (usedPctRaw >= 60) {
      return {
        tone: 'warning' as const,
        text: 'Approaching limit',
        helper: 'Approaching budget limit',
      };
    }
    return {
      tone: 'neutral' as const,
      text: 'Under budget',
      helper: 'Spending is under control',
    };
  }, [budget, usedPctRaw]);

  const progressTone = useMemo(() => {
    if (usedPctRaw > 100) return 'danger';
    if (usedPctRaw >= 70) return 'warning';
    return 'ok';
  }, [usedPctRaw]);

  const handleSave = async () => {
    const parsed = Number(inputRef.current?.value ?? monthlyBudget);
    if (Number.isNaN(parsed) || parsed < 0) {
      setLocalError('Please enter a valid budget (0 or greater).');
      return;
    }
    setLocalError(null);
    const result = await onSave(parsed);
    if (result.error) {
      setLocalError(result.error);
    }
  };

  return (
    <div className="budget-panel-shell">
      <div className="budget-panel">
        <div className="budget-top-row">
          <div className="budget-title-wrap">
            <div className="budget-title">
              <Gauge size={16} />
              Monthly Budget
            </div>
            <div className="budget-subtitle">Control monthly spending with one clear limit.</div>
          </div>

          <div className="budget-controls">
            <input
              key={monthlyBudget}
              ref={inputRef}
              type="number"
              min={0}
              className="input budget-input"
              defaultValue={String(monthlyBudget || 0)}
              placeholder="300"
              aria-label="Monthly budget"
            />
            <button
              type="button"
              className="btn btn-outline budget-set-btn"
              onClick={handleSave}
              disabled={saving || loading}
            >
              {saving ? 'Saving...' : 'Set'}
            </button>
          </div>
        </div>

        <div className="budget-panel-grid">
          <div className="budget-stat budget-stat-remaining">
            <span className="budget-stat-label">Remaining</span>
            <span className={`budget-stat-value budget-remaining-value ${remaining < 0 ? 'negative' : ''}`}>
              {remaining >= 0 ? formatMoney(remaining) : `-${formatMoney(Math.abs(remaining))}`}
            </span>
          </div>
          <div className="budget-stat budget-stat-primary">
            <span className="budget-stat-label">Budget</span>
            <span className="budget-stat-value budget-stat-value-primary">{formatMoney(budget)}</span>
          </div>
          <div className="budget-stat budget-stat-secondary">
            <span className="budget-stat-label">Spent</span>
            <span className="budget-stat-value budget-stat-value-tertiary">{formatMoney(monthSpending)}</span>
          </div>
          <div className="budget-stat budget-stat-secondary">
            <span className="budget-stat-label">% Used</span>
            <span className={`budget-stat-value budget-stat-value-tertiary ${status.tone === 'danger' ? 'negative' : ''}`}>
              {budget > 0 ? `${usedPct}%` : '--'}
            </span>
          </div>
        </div>

        {budget > 0 && (
          <div className="budget-progress-wrap">
            <div className="budget-progress-track" aria-label="Budget usage progress">
              <div
                className={`budget-progress-fill ${progressTone}`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>
        )}

        <div className={`budget-status ${status.tone}`}>
          <span className={`budget-status-dot ${status.tone}`} />
          <span className="budget-status-text">{status.text}</span>
          <span className="budget-status-helper">{status.helper}</span>
        </div>

        {(localError || error) && <div className="budget-error">{localError || error}</div>}
      </div>
    </div>
  );
}
