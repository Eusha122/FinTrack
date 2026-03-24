'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Transaction, AccountBalances } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  const fetchTransactions = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTransactions(data as Transaction[]);
    }
    setLoading(false);
  }, [authLoading, user]);

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;

    Promise.resolve().then(() => {
      if (cancelled) return;
      fetchTransactions();
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, fetchTransactions]);

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) return null;

    // Optimistic update
    const optimistic: Transaction = {
      ...tx,
      id: crypto.randomUUID(),
      user_id: user.id,
      created_at: new Date().toISOString(),
    };
    setTransactions(prev => [optimistic, ...prev]);

    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...tx, user_id: user.id })
      .select()
      .single();

    if (error) {
      // Rollback
      setTransactions(prev => prev.filter(t => t.id !== optimistic.id));
      return null;
    }

    // Replace optimistic with real
    setTransactions(prev =>
      prev.map(t => (t.id === optimistic.id ? (data as Transaction) : t))
    );
    return data as Transaction;
  };

  const addTransfer = async (amount: number, from: 'cash' | 'bank', to: 'cash' | 'bank') => {
    if (amount <= 0 || from === to) return null;

    const balances = calculateBalances();
    const sourceBalance = from === 'cash' ? balances.cash : balances.bank;
    if (amount > sourceBalance) return null;

    const tx: Omit<Transaction, 'id' | 'created_at' | 'user_id'> = {
      type: 'transfer',
      amount,
      category: 'Transfer',
      note: `${from} to ${to}`,
      account: from,
      target_account: to,
      date: new Date().toISOString(),
    };
    return addTransaction(tx);
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;

    const backup = transactions;
    setTransactions(prev => prev.filter(t => t.id !== id));

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      setTransactions(backup);
    }
  };

  /**
   * Calculate balances strictly using type logic:
   * income → add to account
   * expense → subtract from account
   * transfer → deduct from source, add to target (total unchanged)
   */
  const calculateBalances = useCallback((): AccountBalances => {
    let cash = 0;
    let bank = 0;

    for (const tx of transactions) {
      const amt = Number(tx.amount);

      if (tx.type === 'income') {
        if (tx.account === 'cash') cash += amt;
        else if (tx.account === 'bank') bank += amt;
      } else if (tx.type === 'expense') {
        if (tx.account === 'cash') cash -= amt;
        else if (tx.account === 'bank') bank -= amt;
      } else if (tx.type === 'transfer') {
        // Deduct from source, add to target
        if (tx.account === 'cash') cash -= amt;
        else if (tx.account === 'bank') bank -= amt;

        if (tx.target_account === 'cash') cash += amt;
        else if (tx.target_account === 'bank') bank += amt;
      }
    }

    return { cash, bank, total: cash + bank };
  }, [transactions]);

  const getSpending = useCallback((period: 'today' | 'week' | 'month'): number => {
    const now = new Date();
    let startDate: Date;

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      const dayOfWeek = now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return transactions
      .filter(tx => tx.type === 'expense' && new Date(tx.date) >= startDate)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
  }, [transactions]);

  const getMonthlyData = useCallback((monthStr: string) => {
    // monthStr format: YYYY-MM
    const [year, month] = monthStr.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const monthTxs = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d >= start && d <= end;
    });

    let income = 0;
    let expense = 0;
    const categories: Record<string, number> = {};
    let cashSpent = 0;
    let bankSpent = 0;

    for (const tx of monthTxs) {
      const amt = Number(tx.amount);
      if (tx.type === 'income') income += amt;
      else if (tx.type === 'expense') {
        expense += amt;
        categories[tx.category] = (categories[tx.category] || 0) + amt;
        if (tx.account === 'cash') cashSpent += amt;
        else bankSpent += amt;
      }
    }

    return { month: monthStr, income, expense, categories, cashSpent, bankSpent };
  }, [transactions]);

  const getTransactionsByMonth = useCallback((monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    return transactions.filter(tx => {
      const d = new Date(tx.date);
      return d >= start && d <= end;
    });
  }, [transactions]);

  return {
    transactions,
    loading,
    addTransaction,
    addTransfer,
    deleteTransaction,
    calculateBalances,
    getSpending,
    getMonthlyData,
    getTransactionsByMonth,
    refetch: fetchTransactions,
  };
}
