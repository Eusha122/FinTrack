'use client';

import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import BalanceCards from '@/components/BalanceCards';
import FastInput from '@/components/FastInput';
import TransactionList from '@/components/TransactionList';
import InsightsPanel from '@/components/InsightsPanel';
import TransferModal from '@/components/TransferModal';
import AddMoneyModal from '@/components/AddMoneyModal';
import BudgetPanel from '@/components/BudgetPanel';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useRecurring } from '@/hooks/useRecurring';
import { useInsights } from '@/hooks/useInsights';
import { useBudget } from '@/hooks/useBudget';
import { Transaction } from '@/lib/types';
import { format } from 'date-fns';

export default function DashboardPage() {
  const {
    transactions,
    addTransaction,
    addTransfer,
    deleteTransaction,
    calculateBalances,
    getSpending,
    getMonthlyData,
    refetch,
  } = useTransactions();

  const { categoryNames } = useCategories();
  useRecurring(refetch);
  const { monthlyBudget, loading: budgetLoading, saving: budgetSaving, error: budgetError, saveMonthlyBudget } = useBudget();

  const balances = useMemo(() => calculateBalances(), [calculateBalances]);
  const monthSpending = useMemo(() => getSpending('month'), [getSpending]);
  const insights = useInsights(transactions, getMonthlyData, monthlyBudget);

  const [showTransfer, setShowTransfer] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [lastAccount, setLastAccount] = useState<'cash' | 'bank'>('cash');

  const thisMonthStr = format(new Date(), 'yyyy-MM');
  const thisMonthExpenses = transactions.filter(tx =>
    tx.type === 'expense' && format(new Date(tx.date), 'yyyy-MM') === thisMonthStr
  );

  const handleAddTransaction = (tx: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => {
    setLastAccount(tx.account);
    addTransaction(tx);
  };

  return (
    <Layout>
      {/* Balance Cards */}
      <div className="section">
        <BalanceCards
          balances={balances}
          todaySpending={getSpending('today')}
          weekSpending={getSpending('week')}
          monthSpending={monthSpending}
        />
      </div>

      {/* Monthly Budget */}
      <div className="section">
        <div className="card">
          <BudgetPanel
            monthlyBudget={monthlyBudget}
            monthSpending={monthSpending}
            loading={budgetLoading}
            saving={budgetSaving}
            error={budgetError}
            onSave={saveMonthlyBudget}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section">
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => setShowAddMoney(true)}>
            + Add Money
          </button>
          <button className="btn btn-outline" onClick={() => setShowTransfer(true)}>
            Transfer
          </button>
        </div>
      </div>

      {/* Fast Input */}
      <div className="section">
        <div className="section-title">Quick Add</div>
        <FastInput
          categories={categoryNames}
          onSubmit={handleAddTransaction}
          lastAccount={lastAccount}
        />
      </div>

      {/* Insights */}
      <div className="section">
        <div className="section-title">Insights</div>
        <div className="card">
          {insights.length > 0 ? (
            <InsightsPanel insights={insights} />
          ) : (
            <div className="empty-inline">Add your initial balance to get started tracking</div>
          )}
        </div>
      </div>

      {/* This Month's Expenses */}
      <div className="section">
        <div className="section-title">
          This Month{' '}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>
            {thisMonthExpenses.length} expenses
          </span>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {thisMonthExpenses.length === 0 ? (
            <div className="empty-inline" style={{ padding: 'var(--space-lg)' }}>
              0 expenses this month
            </div>
          ) : (
            <TransactionList
              transactions={thisMonthExpenses}
              onDelete={deleteTransaction}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showTransfer && (
        <TransferModal
          onClose={() => setShowTransfer(false)}
          onTransfer={addTransfer}
          balances={balances}
        />
      )}
      {showAddMoney && (
        <AddMoneyModal
          onClose={() => setShowAddMoney(false)}
          onAdd={addTransaction}
        />
      )}
    </Layout>
  );
}
