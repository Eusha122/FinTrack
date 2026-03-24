'use client';

import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import FastInput from '@/components/FastInput';
import TransactionList from '@/components/TransactionList';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { Transaction } from '@/lib/types';
import { format } from 'date-fns';

export default function TransactionsPage() {
  const { addTransaction, deleteTransaction, getTransactionsByMonth } = useTransactions();
  const { categoryNames } = useCategories();
  const [lastAccount, setLastAccount] = useState<'cash' | 'bank'>('cash');

  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthTransactions = useMemo(() => getTransactionsByMonth(currentMonth), [getTransactionsByMonth, currentMonth]);

  const handleAdd = (tx: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => {
    setLastAccount(tx.account);
    addTransaction(tx);
  };

  return (
    <Layout>
      <div className="section">
        <FastInput
          categories={categoryNames}
          onSubmit={handleAdd}
          lastAccount={lastAccount}
        />
      </div>

      <div className="section">
        <div className="section-title">
          This Month
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>
            {monthTransactions.length} transactions
          </span>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <TransactionList
            transactions={monthTransactions}
            onDelete={deleteTransaction}
          />
        </div>
      </div>
    </Layout>
  );
}
