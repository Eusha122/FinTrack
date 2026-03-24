'use client';

import React, { useState } from 'react';
import { Category } from '@/lib/types';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  onAdd: (name: string) => void;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export default function CategoryManager({ categories, onAdd, onUpdate, onDelete }: CategoryManagerProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName.trim());
      setNewName('');
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      onUpdate(editingId, editName.trim());
      setEditingId(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
        <input
          type="text"
          className="input"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New category name"
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={16} /> Add
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {categories.map(cat => (
          <div key={cat.id} className="category-item">
            {editingId === cat.id ? (
              <div style={{ display: 'flex', gap: 'var(--space-sm)', flex: 1 }}>
                <input
                  type="text"
                  className="input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveEdit()}
                  autoFocus
                />
                <button className="btn btn-icon btn-ghost" onClick={saveEdit}>
                  <Check size={16} />
                </button>
                <button className="btn btn-icon btn-ghost" onClick={() => setEditingId(null)}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{cat.name}</span>
                <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                  <button className="btn btn-icon btn-ghost btn-sm" onClick={() => startEdit(cat)}>
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-icon btn-danger btn-sm" onClick={() => onDelete(cat.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
