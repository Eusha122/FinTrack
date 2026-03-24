'use client';

import { useMemo } from 'react';
import { Transaction, MonthlyData } from '@/lib/types';
import { format, startOfWeek, subWeeks, endOfWeek, getDaysInMonth, getDate } from 'date-fns';

interface Insight {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'positive';
}

export function useInsights(
  transactions: Transaction[],
  getMonthlyData: (month: string) => MonthlyData,
  monthlyBudget = 0
): Insight[] {
  return useMemo(() => {
    const insights: Insight[] = [];
    const now = new Date();
    const currentMonth = format(now, 'yyyy-MM');

    const current = getMonthlyData(currentMonth);

    // 1. Week-over-week spending comparison
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    const thisWeekExpense = transactions
      .filter(tx => tx.type === 'expense')
      .filter(tx => {
        const d = new Date(tx.date);
        return d >= thisWeekStart && d <= thisWeekEnd;
      })
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const lastWeekExpense = transactions
      .filter(tx => tx.type === 'expense')
      .filter(tx => {
        const d = new Date(tx.date);
        return d >= lastWeekStart && d <= lastWeekEnd;
      })
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    if (lastWeekExpense > 0 && thisWeekExpense > 0) {
      const change = ((thisWeekExpense - lastWeekExpense) / lastWeekExpense) * 100;
      if (change > 10) {
        insights.push({
          id: 'spending-up-weekly',
          text: `You spent ${Math.round(change)}% more than last week.`,
          type: 'warning',
        });
      } else if (change < -10) {
        insights.push({
          id: 'spending-down-weekly',
          text: `Nice work: spending dropped ${Math.round(Math.abs(change))}% compared to last week.`,
          type: 'positive',
        });
      }
    }

    // 2. Top expense category
    const catEntries = Object.entries(current.categories);
    if (catEntries.length > 0) {
      catEntries.sort((a, b) => b[1] - a[1]);
      const [topCat, topAmt] = catEntries[0];
      const pct = current.expense > 0 ? Math.round((topAmt / current.expense) * 100) : 0;
      insights.push({
        id: 'top-category',
        text: `${topCat} is taking ${pct}% of your spending this month.`,
        type: 'info',
      });
    }

    // 3. Budget trajectory (advisor-style)
    if (monthlyBudget > 0 && current.expense > 0) {
      const daysInMonth = getDaysInMonth(now);
      const dayOfMonth = getDate(now);
      const projected = (current.expense / dayOfMonth) * daysInMonth;
      const usedPct = (current.expense / monthlyBudget) * 100;

      if (usedPct >= 100) {
        insights.push({
          id: 'budget-exceeded',
          text: `Budget alert: you already exceeded this month's budget by ${Math.round(current.expense - monthlyBudget)}.`,
          type: 'warning',
        });
      } else if (projected > monthlyBudget) {
        insights.push({
          id: 'budget-projection-warning',
          text: `You are on track to overspend this month (projected ${Math.round(projected)} vs budget ${Math.round(monthlyBudget)}).`,
          type: 'warning',
        });
      } else if (usedPct <= 70) {
        insights.push({
          id: 'budget-on-track',
          text: `You are on track for this month (${Math.round(usedPct)}% of budget used).`,
          type: 'positive',
        });
      }
    }

    // 4. Income vs expense
    if (current.income > 0 && current.expense > current.income) {
      insights.push({
        id: 'overspend',
        text: `You have spent more than your income this month`,
        type: 'warning',
      });
    } else if (current.income > 0 && current.expense < current.income * 0.5) {
      insights.push({
        id: 'saving-well',
        text: `Great job! You have saved more than 50% of your income this month`,
        type: 'positive',
      });
    }

    // 5. No transactions yet
    if (transactions.length === 0) {
      insights.push({
        id: 'get-started',
        text: 'Add your initial balance to get started tracking',
        type: 'info',
      });
    }

    return insights.slice(0, 4);
  }, [transactions, getMonthlyData, monthlyBudget]);
}
