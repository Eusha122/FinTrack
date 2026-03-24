'use client';

import React, { useMemo } from 'react';
import Layout from '@/components/Layout';
import dynamic from 'next/dynamic';
import { useTransactions } from '@/hooks/useTransactions';
import { formatMoney } from '@/lib/parser';
import { endOfWeek, format, startOfWeek, subWeeks } from 'date-fns';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

const BalanceOverTimeChart = dynamic(
  () => import('@/components/Charts').then(m => m.BalanceOverTimeChart),
  { ssr: false }
);
const MonthlyBarChart = dynamic(
  () => import('@/components/Charts').then(m => m.MonthlyBarChart),
  { ssr: false }
);
const CategoryPieChart = dynamic(
  () => import('@/components/Charts').then(m => m.CategoryPieChart),
  { ssr: false }
);
const CashBankComparisonChart = dynamic(
  () => import('@/components/Charts').then(m => m.CashBankComparisonChart),
  { ssr: false }
);

export default function AnalyticsPage() {
  const { transactions, getMonthlyData } = useTransactions();

  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthly = useMemo(() => getMonthlyData(currentMonth), [getMonthlyData, currentMonth]);

  const trendData = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const previousWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const previousWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    const thisWeekExpense = transactions
      .filter(tx => tx.type === 'expense')
      .filter(tx => {
        const d = new Date(tx.date);
        return d >= thisWeekStart && d <= thisWeekEnd;
      })
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const previousWeekExpense = transactions
      .filter(tx => tx.type === 'expense')
      .filter(tx => {
        const d = new Date(tx.date);
        return d >= previousWeekStart && d <= previousWeekEnd;
      })
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    if (previousWeekExpense <= 0) {
      return {
        direction: 'flat' as const,
        pct: 0,
        message: 'Not enough last-week data to detect a trend yet.',
      };
    }

    const pct = Math.round(((thisWeekExpense - previousWeekExpense) / previousWeekExpense) * 100);
    if (pct > 0) {
      return {
        direction: 'up' as const,
        pct,
        message: `↑ Spending is trending upward this week (+${pct}%).`,
      };
    }
    if (pct < 0) {
      return {
        direction: 'down' as const,
        pct: Math.abs(pct),
        message: `↓ Spending is trending downward this week (-${Math.abs(pct)}%).`,
      };
    }
    return {
      direction: 'flat' as const,
      pct: 0,
      message: 'Spending trend is flat this week.',
    };
  }, [transactions]);

  const bigExpenseAlert = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const weekExpenses = transactions
      .filter(tx => tx.type === 'expense')
      .filter(tx => {
        const d = new Date(tx.date);
        return d >= thisWeekStart && d <= thisWeekEnd;
      });

    if (weekExpenses.length === 0) {
      return null;
    }

    const sorted = [...weekExpenses].sort((a, b) => Number(b.amount) - Number(a.amount));
    const largest = sorted[0];
    const avg = weekExpenses.reduce((sum, tx) => sum + Number(tx.amount), 0) / weekExpenses.length;
    const isUnusuallyLarge = Number(largest.amount) >= avg * 1.75 || Number(largest.amount) >= monthly.expense * 0.35;

    return {
      isUnusuallyLarge,
      category: largest.category,
      amount: Number(largest.amount),
      account: largest.account,
    };
  }, [monthly.expense, transactions]);

  return (
    <Layout>
      {/* Monthly Summary Cards */}
      <div className="section">
        <div className="card-grid card-grid-4">
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Monthly Income</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-income)' }}>
              {formatMoney(monthly.income)}
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Monthly Expenses</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-expense)' }}>
              {formatMoney(monthly.expense)}
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Net</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: monthly.income - monthly.expense >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}>
              {formatMoney(monthly.income - monthly.expense)}
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Categories</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {Object.keys(monthly.categories).length}
            </div>
          </div>
        </div>
      </div>

      {/* Spending Signals */}
      <div className="section">
        <div className="card-grid card-grid-2">
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Spending Trend Direction
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                color:
                  trendData.direction === 'up'
                    ? 'var(--color-expense)'
                    : trendData.direction === 'down'
                      ? 'var(--color-income)'
                      : 'var(--text-secondary)',
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
            >
              {trendData.direction === 'up' && <TrendingUp size={18} />}
              {trendData.direction === 'down' && <TrendingDown size={18} />}
              {trendData.direction === 'flat' && <TrendingUp size={18} style={{ opacity: 0.5 }} />}
              {trendData.message}
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Big Expense Alert
            </div>
            {bigExpenseAlert ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  color: bigExpenseAlert.isUnusuallyLarge ? 'var(--color-expense)' : 'var(--text-secondary)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                }}
              >
                <AlertTriangle size={18} />
                {bigExpenseAlert.isUnusuallyLarge
                  ? `This is your largest expense this week: ${bigExpenseAlert.category} (${formatMoney(bigExpenseAlert.amount)}) from ${bigExpenseAlert.account}.`
                  : `Largest expense this week: ${bigExpenseAlert.category} (${formatMoney(bigExpenseAlert.amount)}) from ${bigExpenseAlert.account}.`}
              </div>
            ) : (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                No expense transactions this week yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="section">
        <div className="section-title">Balance Over Time</div>
        <div className="card">
          <BalanceOverTimeChart transactions={transactions} />
        </div>
      </div>

      <div className="card-grid card-grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="analytics-chart-panel">
          <div className="section-title">Income vs Expenses</div>
          <div className="card">
            <MonthlyBarChart getMonthlyData={getMonthlyData} />
          </div>
        </div>
        <div className="analytics-chart-panel">
          <div className="section-title">Category Distribution</div>
          <div className="card">
            <CategoryPieChart getMonthlyData={getMonthlyData} />
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Cash vs Bank Usage</div>
        <div className="card">
          <CashBankComparisonChart getMonthlyData={getMonthlyData} />
        </div>
      </div>
    </Layout>
  );
}
