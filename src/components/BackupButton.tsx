'use client';

import React from 'react';
import { supabase } from '@/lib/supabase';
import { Download } from 'lucide-react';

export default function BackupButton() {
  const handleBackup = async () => {
    const [txRes, catRes, recRes] = await Promise.all([
      supabase.from('transactions').select('*').order('date', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
      supabase.from('recurring_transactions').select('*'),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      transactions: txRes.data || [],
      categories: catRes.data || [],
      recurringTransactions: recRes.data || [],
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button className="btn btn-outline" onClick={handleBackup}>
      <Download size={16} /> Download JSON Backup
    </button>
  );
}
