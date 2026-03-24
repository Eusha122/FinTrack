'use client';

import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import FilterBar, { HistoryFilters } from '@/components/FilterBar';
import TransactionList from '@/components/TransactionList';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { format } from 'date-fns';

export default function HistoryPage() {
  const { transactions, deleteTransaction } = useTransactions();
  const { categoryNames } = useCategories();

  const [filters, setFilters] = useState<HistoryFilters>({
    dateFrom: '',
    dateTo: '',
    category: '',
    account: '',
    type: '',
    quickRange: '',
    sortBy: 'date_desc',
  });

  const filtered = useMemo(() => {
    const base = transactions.filter(tx => {
      const txDate = format(new Date(tx.date), 'yyyy-MM-dd');

      if (filters.dateFrom) {
        if (txDate < filters.dateFrom) return false;
      }
      if (filters.dateTo) {
        if (txDate > filters.dateTo) return false;
      }
      if (filters.category && tx.category !== filters.category) return false;
      if (filters.account && tx.account !== filters.account) return false;
      if (filters.type && tx.type !== filters.type) return false;
      return true;
    });

    const sorted = [...base];
    if (filters.sortBy === 'amount_low_high') {
      sorted.sort((a, b) => Number(a.amount) - Number(b.amount));
    } else if (filters.sortBy === 'amount_high_low') {
      sorted.sort((a, b) => Number(b.amount) - Number(a.amount));
    } else if (filters.sortBy === 'date_asc') {
      sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return sorted;
  }, [transactions, filters]);

  return (
    <Layout>
      <div className="section">
        <FilterBar
          categories={categoryNames}
          filters={filters}
          onChange={setFilters}
        />
      </div>

      <div className="section">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <TransactionList
            transactions={filtered}
            onDelete={deleteTransaction}
            groupByDate={filters.sortBy === 'date_desc' || filters.sortBy === 'date_asc'}
          />
        </div>
      </div>
    </Layout>
  );
}
