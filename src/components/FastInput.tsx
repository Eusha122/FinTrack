'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Transaction } from '@/lib/types';

interface FastInputProps {
  categories: string[];
  onSubmit: (tx: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => void;
  lastAccount?: 'cash' | 'bank';
}

export default function FastInput({ categories, onSubmit, lastAccount = 'cash' }: FastInputProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState<'cash' | 'bank'>(lastAccount);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const descRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAccount(lastAccount);
  }, [lastAccount]);

  const getFilteredCategories = useCallback(() => {
    const parts = description.trim().split(/\s+/);
    const catPart = (parts[0] || '').toLowerCase();
    if (!catPart) return [];
    return categories.filter(c =>
      c.toLowerCase().startsWith(catPart) && c.toLowerCase() !== catPart
    );
  }, [description, categories]);

  const filteredCategories = getFilteredCategories();

  const applyAutocomplete = (cat: string) => {
    const parts = description.trim().split(/\s+/);
    const rest = parts.slice(1).join(' ');
    const next = rest ? `${cat} ${rest}` : cat;
    setDescription(next);
    setShowAutocomplete(false);
    setSelectedIdx(0);
  };

  const handleSubmit = () => {
    const amt = Math.abs(Number(amount));
    if (!Number.isFinite(amt) || amt <= 0) return;

    const parts = description.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return;

    const typedCategory = parts[0] || '';
    const canonical =
      categories.find(c => c.toLowerCase() === typedCategory.toLowerCase()) || typedCategory;
    const note = parts.slice(1).join(' ') || null;

    onSubmit({
      type: 'expense',
      amount: amt,
      category: canonical,
      note,
      account,
      target_account: null,
      date: new Date().toISOString(),
    });

    setDescription('');
    setAmount('');
    descRef.current?.focus();
  };

  const handleDescKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showAutocomplete && filteredCategories.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx(prev => (prev + 1) % filteredCategories.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx(prev => (prev - 1 + filteredCategories.length) % filteredCategories.length);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        applyAutocomplete(filteredCategories[selectedIdx]);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        applyAutocomplete(filteredCategories[selectedIdx]);
        amountRef.current?.focus();
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      amountRef.current?.focus();
    }
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="quick-add">
      <div className="quick-add-grid">
        <div className="qa-category">
          <input
            ref={descRef}
            type="text"
            className="qa-input"
            value={description}
            onChange={e => {
              const next = e.target.value;
              setDescription(next);
              setSelectedIdx(0);
              setShowAutocomplete(next.trim().length > 0);
            }}
            onKeyDown={handleDescKeyDown}
            onBlur={() => setTimeout(() => setShowAutocomplete(false), 150)}
            onFocus={() => {
              if (description.trim().length > 0) setShowAutocomplete(true);
            }}
            placeholder="e.g. juice, transport, lunch"
            autoComplete="off"
            inputMode="text"
          />

          {showAutocomplete && filteredCategories.length > 0 && (
            <div className="autocomplete-dropdown">
              {filteredCategories.map((cat, i) => (
                <div
                  key={cat}
                  className={`autocomplete-item ${i === selectedIdx ? 'active' : ''}`}
                  onMouseDown={() => {
                    applyAutocomplete(cat);
                    amountRef.current?.focus();
                  }}
                >
                  {cat}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="qa-amount">
          <input
            ref={amountRef}
            type="number"
            className="qa-input qa-amount-input"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onKeyDown={handleAmountKeyDown}
            placeholder="0"
            inputMode="decimal"
            autoComplete="off"
          />
        </div>

        <button className="btn btn-add qa-add" onClick={handleSubmit}>
          Add
        </button>

        <div className="qa-toggle">
          <div className="toggle-group" aria-label="Account">
            <button
              type="button"
              className={`toggle-btn ${account === 'cash' ? 'active' : ''}`}
              onClick={() => setAccount('cash')}
            >
              Cash
            </button>
            <button
              type="button"
              className={`toggle-btn ${account === 'bank' ? 'active' : ''}`}
              onClick={() => setAccount('bank')}
            >
              Bank
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
