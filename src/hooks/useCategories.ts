'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Category } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  const fetchCategories = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (!error && data) {
      setCategories(data as Category[]);
    }
    setLoading(false);
  }, [authLoading, user]);

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;

    Promise.resolve().then(() => {
      if (cancelled) return;
      fetchCategories();
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, fetchCategories]);

  const addCategory = async (name: string) => {
    if (!user) return null;

    const trimmed = name.trim();
    if (!trimmed) return null;

    // Check for duplicate
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      return null;
    }

    const optimistic: Category = {
      id: crypto.randomUUID(),
      user_id: user.id,
      name: trimmed,
      created_at: new Date().toISOString(),
    };
    setCategories(prev => [...prev, optimistic].sort((a, b) => a.name.localeCompare(b.name)));

    const { data, error } = await supabase
      .from('categories')
      .insert({ user_id: user.id, name: trimmed })
      .select()
      .single();

    if (error) {
      setCategories(prev => prev.filter(c => c.id !== optimistic.id));
      return null;
    }

    setCategories(prev =>
      prev.map(c => (c.id === optimistic.id ? (data as Category) : c))
    );
    return data as Category;
  };

  const updateCategory = async (id: string, name: string) => {
    if (!user) return;

    const trimmed = name.trim();
    if (!trimmed) return;

    const backup = categories;
    setCategories(prev =>
      prev.map(c => (c.id === id ? { ...c, name: trimmed } : c))
    );

    const { error } = await supabase
      .from('categories')
      .update({ name: trimmed })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) setCategories(backup);
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;

    const backup = categories;
    setCategories(prev => prev.filter(c => c.id !== id));

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) setCategories(backup);
  };

  const categoryNames = categories.map(c => c.name);

  return {
    categories,
    categoryNames,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
