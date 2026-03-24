'use client';

import React from 'react';
import Layout from '@/components/Layout';
import CategoryManager from '@/components/CategoryManager';
import { useCategories } from '@/hooks/useCategories';

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();

  return (
    <Layout>
      <div className="section">
        <div className="card">
          <CategoryManager
            categories={categories}
            onAdd={addCategory}
            onUpdate={updateCategory}
            onDelete={deleteCategory}
          />
        </div>
      </div>
    </Layout>
  );
}
