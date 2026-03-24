'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function useBudget() {
  const { user, loading: authLoading } = useAuth();
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBudget = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setMonthlyBudget(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('monthly_budget')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setMonthlyBudget(Number(data?.monthly_budget || 0));
    setLoading(false);
  }, [authLoading, user]);

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;

    Promise.resolve().then(async () => {
      if (cancelled) return;
      await fetchBudget();
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, fetchBudget]);

  const saveMonthlyBudget = useCallback(
    async (value: number): Promise<{ error: string | null }> => {
      if (!user) return { error: 'You must be signed in.' };
      if (Number.isNaN(value) || value < 0) {
        return { error: 'Budget must be 0 or greater.' };
      }

      setSaving(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          monthly_budget: value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        setSaving(false);
        setError(updateError.message);
        return { error: updateError.message };
      }

      setMonthlyBudget(value);
      setSaving(false);
      return { error: null };
    },
    [user]
  );

  return {
    monthlyBudget,
    loading,
    saving,
    error,
    saveMonthlyBudget,
    refetch: fetchBudget,
  };
}
