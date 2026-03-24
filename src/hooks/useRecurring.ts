'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RecurringTransaction } from '@/lib/types';
import { addDays, addWeeks, addMonths } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export function useRecurring(onTransactionCreated?: () => void) {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  const fetchRecurring = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setRecurring([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRecurring(data as RecurringTransaction[]);
    }
    setLoading(false);
  }, [authLoading, user]);

  /**
   * Process all overdue recurring transactions.
   * Catches up ALL missed entries (not just the latest).
   */
  const processRecurring = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .lte('next_run', new Date().toISOString());

    if (error || !data || data.length === 0) return;

    const now = new Date();
    const txInserts: Array<Record<string, unknown>> = [];
    const updates: Array<{ id: string; next_run: string }> = [];

    for (const rec of data as RecurringTransaction[]) {
      let nextRun = new Date(rec.next_run);

      // Generate ALL missed entries until caught up
      while (nextRun <= now) {
        txInserts.push({
          user_id: user.id,
          type: rec.type,
          amount: rec.amount,
          category: rec.category,
          note: rec.note ? `${rec.note} (recurring)` : '(recurring)',
          account: rec.account,
          date: nextRun.toISOString(),
        });

        // Advance next_run
        if (rec.frequency === 'daily') nextRun = addDays(nextRun, 1);
        else if (rec.frequency === 'weekly') nextRun = addWeeks(nextRun, 1);
        else nextRun = addMonths(nextRun, 1);
      }

      updates.push({ id: rec.id, next_run: nextRun.toISOString() });
    }

    // Batch insert all generated transactions
    if (txInserts.length > 0) {
      await supabase.from('transactions').insert(txInserts);
    }

    // Update next_run for each recurring
    for (const u of updates) {
      await supabase
        .from('recurring_transactions')
        .update({ next_run: u.next_run })
        .eq('id', u.id)
        .eq('user_id', user.id);
    }

    if (onTransactionCreated) onTransactionCreated();
    fetchRecurring();
  }, [fetchRecurring, onTransactionCreated, user]);

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;

    Promise.resolve().then(() => {
      if (cancelled) return;
      fetchRecurring();
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, fetchRecurring]);

  // Process once user session is ready
  useEffect(() => {
    let cancelled = false;
    if (authLoading || !user) return;

    Promise.resolve().then(() => {
      if (cancelled) return;
      processRecurring();
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, processRecurring, user]);

  const addRecurring = async (rec: Omit<RecurringTransaction, 'id' | 'created_at' | 'is_active' | 'user_id'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert({ ...rec, user_id: user.id, is_active: true })
      .select()
      .single();

    if (!error && data) {
      setRecurring(prev => [data as RecurringTransaction, ...prev]);
    }
    return data;
  };

  const toggleRecurring = async (id: string, active: boolean) => {
    if (!user) return;

    setRecurring(prev =>
      prev.map(r => (r.id === id ? { ...r, is_active: active } : r))
    );

    await supabase
      .from('recurring_transactions')
      .update({ is_active: active })
      .eq('id', id)
      .eq('user_id', user.id);
  };

  const deleteRecurring = async (id: string) => {
    if (!user) return;

    setRecurring(prev => prev.filter(r => r.id !== id));
    await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
  };

  return {
    recurring,
    loading,
    addRecurring,
    toggleRecurring,
    deleteRecurring,
    processRecurring,
    refetch: fetchRecurring,
  };
}
