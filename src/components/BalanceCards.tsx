'use client';

import React from 'react';
import { AccountBalances } from '@/lib/types';
import { formatMoney } from '@/lib/parser';

interface BalanceCardsProps {
  balances: AccountBalances;
  todaySpending: number;
  weekSpending: number;
  monthSpending: number;
}

export default function BalanceCards({
  balances,
  todaySpending,
  weekSpending,
  monthSpending,
}: BalanceCardsProps) {
  return (
    <div>
      <div className="card-grid card-grid-3" style={{ marginBottom: 'var(--space-md)' }}>
        <div className="card balance-card balance-total">
          <div className="balance-label">Total Balance</div>
          <div className="balance-amount">{formatMoney(balances.total)}</div>
          <div className="balance-sub">Combined cash + bank</div>
        </div>

        <div className="card balance-card balance-cash" data-indicator="cash">
          <div className="balance-label">Cash</div>
          <div className="balance-amount">{formatMoney(balances.cash)}</div>
        </div>

        <div className="card balance-card balance-bank" data-indicator="bank">
          <div className="balance-label">Bank</div>
          <div className="balance-amount">{formatMoney(balances.bank)}</div>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-label">Today</div>
          <div className="stat-value">{formatMoney(todaySpending)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">This Week</div>
          <div className="stat-value">{formatMoney(weekSpending)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">This Month</div>
          <div className="stat-value">{formatMoney(monthSpending)}</div>
        </div>
      </div>
    </div>
  );
}
