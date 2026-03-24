'use client';

import React from 'react';
import { endOfMonth, endOfYear, format, startOfMonth, startOfYear, subDays, subMonths, subYears } from 'date-fns';

export type HistoryQuickRange = '' | 'last7days' | 'lastMonth' | 'lastYear';
export type HistorySortBy = 'date_desc' | 'date_asc' | 'amount_low_high' | 'amount_high_low';

export interface HistoryFilters {
  dateFrom: string;
  dateTo: string;
  category: string;
  account: string;
  type: string;
  quickRange: HistoryQuickRange;
  sortBy: HistorySortBy;
}

interface FilterBarProps {
  categories: string[];
  filters: HistoryFilters;
  onChange: (filters: HistoryFilters) => void;
}

export default function FilterBar({ categories, filters, onChange }: FilterBarProps) {
  const update = <K extends keyof HistoryFilters>(key: K, value: HistoryFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const applyQuickRange = (range: HistoryQuickRange) => {
    const today = new Date();
    let dateFrom = '';
    let dateTo = '';

    if (range === 'last7days') {
      dateFrom = format(subDays(today, 6), 'yyyy-MM-dd');
      dateTo = format(today, 'yyyy-MM-dd');
    } else if (range === 'lastMonth') {
      const targetMonth = subMonths(today, 1);
      dateFrom = format(startOfMonth(targetMonth), 'yyyy-MM-dd');
      dateTo = format(endOfMonth(targetMonth), 'yyyy-MM-dd');
    } else if (range === 'lastYear') {
      const targetYear = subYears(today, 1);
      dateFrom = format(startOfYear(targetYear), 'yyyy-MM-dd');
      dateTo = format(endOfYear(targetYear), 'yyyy-MM-dd');
    }

    onChange({
      ...filters,
      quickRange: range,
      dateFrom,
      dateTo,
    });
  };

  return (
    <div className="filter-bar">
      <select
        className="filter-select"
        value={filters.quickRange}
        onChange={e => applyQuickRange(e.target.value as HistoryQuickRange)}
      >
        <option value="">Custom Range</option>
        <option value="last7days">Last 7 Days</option>
        <option value="lastMonth">Last Month</option>
        <option value="lastYear">Last Year</option>
      </select>
      <input
        type="date"
        className="filter-select"
        value={filters.dateFrom}
        onChange={e => onChange({ ...filters, dateFrom: e.target.value, quickRange: '' })}
      />
      <input
        type="date"
        className="filter-select"
        value={filters.dateTo}
        onChange={e => onChange({ ...filters, dateTo: e.target.value, quickRange: '' })}
      />
      <select
        className="filter-select"
        value={filters.category}
        onChange={e => update('category', e.target.value)}
      >
        <option value="">All Categories</option>
        {categories.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select
        className="filter-select"
        value={filters.account}
        onChange={e => update('account', e.target.value)}
      >
        <option value="">All Accounts</option>
        <option value="cash">Cash</option>
        <option value="bank">Bank</option>
      </select>
      <select
        className="filter-select"
        value={filters.type}
        onChange={e => update('type', e.target.value)}
      >
        <option value="">All Types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
        <option value="transfer">Transfer</option>
      </select>
      <select
        className="filter-select"
        value={filters.sortBy}
        onChange={e => update('sortBy', e.target.value as HistorySortBy)}
      >
        <option value="date_desc">Newest First</option>
        <option value="date_asc">Oldest First</option>
        <option value="amount_low_high">Amount: Low to High</option>
        <option value="amount_high_low">Amount: High to Low</option>
      </select>
      {(filters.dateFrom || filters.dateTo || filters.category || filters.account || filters.type || filters.quickRange || filters.sortBy !== 'date_desc') && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() =>
            onChange({
              dateFrom: '',
              dateTo: '',
              category: '',
              account: '',
              type: '',
              quickRange: '',
              sortBy: 'date_desc',
            })
          }
        >
          Clear
        </button>
      )}
    </div>
  );
}
