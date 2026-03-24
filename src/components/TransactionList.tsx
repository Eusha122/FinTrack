'use client';

import React from 'react';
import { Transaction } from '@/lib/types';
import { formatMoney, formatMoneyWithSign } from '@/lib/parser';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Trash2 } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  showDate?: boolean;
  groupByDate?: boolean;
}

export default function TransactionList({
  transactions,
  onDelete,
  showDate = true,
  groupByDate = true,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <ArrowUpRight />
        <p>No transactions yet</p>
      </div>
    );
  }

  const renderTransactionRow = (tx: Transaction, includeDateTime = false) => (
    <div key={tx.id} className="transaction-item">
      <div className="transaction-left">
        <div className={`transaction-icon ${tx.type}`}>
          {tx.type === 'income' && <ArrowDownRight size={18} />}
          {tx.type === 'expense' && <ArrowUpRight size={18} />}
          {tx.type === 'transfer' && <ArrowLeftRight size={18} />}
        </div>

        <div className="transaction-details">
          <div className="transaction-title-row">
            <div className="transaction-category">{tx.category}</div>
            <div className="transaction-time">
              {includeDateTime ? format(new Date(tx.date), 'MMM d, h:mm a') : format(new Date(tx.date), 'h:mm a')}
            </div>
          </div>

          <div className="transaction-meta">
            <span className={`badge badge-${tx.account}`}>{tx.account}</span>
            {tx.type === 'transfer' && tx.target_account && (
              <>
                <span className="transaction-arrow">→</span>
                <span className={`badge badge-${tx.target_account}`}>{tx.target_account}</span>
              </>
            )}
            {tx.note && <span className="transaction-note">{tx.note}</span>}
          </div>
        </div>
      </div>

      <div className="transaction-right">
        <div className={`transaction-amount ${tx.type}`}>
          {formatMoneyWithSign(tx.amount, tx.type)}
        </div>

        {onDelete && (
          <div className="transaction-actions">
            <button
              className="btn btn-icon btn-danger btn-sm"
              onClick={() => onDelete(tx.id)}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (!groupByDate) {
    return <div>{transactions.map(tx => renderTransactionRow(tx, true))}</div>;
  }

  const grouped: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    const dateKey = format(new Date(tx.date), 'yyyy-MM-dd');
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(tx);
  }

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      {sortedDates.map(dateKey => (
        <div key={dateKey}>
          {showDate && (() => {
            const dayTransactions = grouped[dateKey];
            const daySpent = dayTransactions
              .filter(tx => tx.type === 'expense')
              .reduce((sum, tx) => sum + Number(tx.amount), 0);

            return (
              <div className="date-group-header">
                <span>{format(new Date(dateKey + 'T00:00:00'), 'EEEE, MMM d')}</span>
                <span className="date-group-summary">
                  spent {daySpent > 0 ? `-${formatMoney(daySpent)}` : '0'} · {dayTransactions.length} tx
                </span>
              </div>
            );
          })()}
          {grouped[dateKey].map(tx => renderTransactionRow(tx))}
        </div>
      ))}
    </div>
  );
}
