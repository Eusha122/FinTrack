'use client';

import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts';
import { Transaction, MonthlyData } from '@/lib/types';
import { format, subMonths } from 'date-fns';

const CHART_COLORS = [
  '#4361ee', '#f72585', '#4cc9f0', '#7209b7', '#3a0ca3',
  '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4',
];

const RC_INITIAL_DIMENSION = { width: 800, height: 300 } as const;
const CHART_HEIGHT = 300;

export function BalanceOverTimeChart({ transactions }: { transactions: Transaction[] }) {
  const data = useMemo(() => {
    if (transactions.length === 0) return [];

    // Sort oldest first
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let cash = 0;
    let bank = 0;
    const points: Array<{ date: string; total: number; cash: number; bank: number }> = [];

    // Group by day
    const dayMap: Record<string, Transaction[]> = {};
    for (const tx of sorted) {
      const key = format(new Date(tx.date), 'MMM dd');
      if (!dayMap[key]) dayMap[key] = [];
      dayMap[key].push(tx);
    }

    for (const [day, txs] of Object.entries(dayMap)) {
      for (const tx of txs) {
        const amt = Number(tx.amount);
        if (tx.type === 'income') {
          if (tx.account === 'cash') cash += amt;
          else bank += amt;
        } else if (tx.type === 'expense') {
          if (tx.account === 'cash') cash -= amt;
          else bank -= amt;
        } else if (tx.type === 'transfer') {
          if (tx.account === 'cash') cash -= amt;
          else bank -= amt;
          if (tx.target_account === 'cash') cash += amt;
          else if (tx.target_account === 'bank') bank += amt;
        }
      }
      points.push({ date: day, total: cash + bank, cash, bank });
    }

    return points;
  }, [transactions]);

  if (data.length === 0) return <div className="empty-state"><p>No data yet</p></div>;

  return (
    <div className="chart-container">
      <ResponsiveContainer
        width="100%"
        height={CHART_HEIGHT}
        minWidth={0}
        minHeight={0}
        initialDimension={RC_INITIAL_DIMENSION}
      >
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
          <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} />
          <YAxis stroke="var(--text-tertiary)" fontSize={11} />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="total" stroke="#4361ee" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="cash" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
          <Line type="monotone" dataKey="bank" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyBarChart({ getMonthlyData }: { getMonthlyData: (month: string) => MonthlyData }) {
  const data = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStr = format(date, 'yyyy-MM');
      const d = getMonthlyData(monthStr);
      months.push({
        month: format(date, 'MMM'),
        income: d.income,
        expense: d.expense,
      });
    }
    return months;
  }, [getMonthlyData]);

  return (
    <div className="chart-container">
      <ResponsiveContainer
        width="100%"
        height={CHART_HEIGHT}
        minWidth={0}
        minHeight={0}
        initialDimension={RC_INITIAL_DIMENSION}
      >
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
          <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={11} />
          <YAxis stroke="var(--text-tertiary)" fontSize={11} />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend />
          <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryPieChart({ getMonthlyData }: { getMonthlyData: (month: string) => MonthlyData }) {
  const data = useMemo(() => {
    const monthStr = format(new Date(), 'yyyy-MM');
    const monthly = getMonthlyData(monthStr);
    return Object.entries(monthly.categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [getMonthlyData]);

  if (data.length === 0) return <div className="empty-state"><p>No expenses this month</p></div>;

  return (
    <div className="chart-container">
      <ResponsiveContainer
        width="100%"
        height={CHART_HEIGHT}
        minWidth={0}
        minHeight={0}
        initialDimension={RC_INITIAL_DIMENSION}
      >
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CashBankComparisonChart({ getMonthlyData }: { getMonthlyData: (month: string) => MonthlyData }) {
  const data = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStr = format(date, 'yyyy-MM');
      const d = getMonthlyData(monthStr);
      months.push({
        month: format(date, 'MMM'),
        cash: d.cashSpent,
        bank: d.bankSpent,
      });
    }
    return months;
  }, [getMonthlyData]);

  return (
    <div className="chart-container">
      <ResponsiveContainer
        width="100%"
        height={CHART_HEIGHT}
        minWidth={0}
        minHeight={0}
        initialDimension={RC_INITIAL_DIMENSION}
      >
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
          <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={11} />
          <YAxis stroke="var(--text-tertiary)" fontSize={11} />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend />
          <Bar dataKey="cash" fill="var(--color-cash)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="bank" fill="var(--color-bank)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
