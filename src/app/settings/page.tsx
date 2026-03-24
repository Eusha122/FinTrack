'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import RecurringManager from '@/components/RecurringManager';
import ExportButton from '@/components/ExportButton';
import BackupButton from '@/components/BackupButton';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useRecurring } from '@/hooks/useRecurring';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [logoutOpen, setLogoutOpen] = React.useState(false);
  const { transactions, calculateBalances, getMonthlyData, refetch } = useTransactions();
  const { categoryNames } = useCategories();
  const { recurring, addRecurring, toggleRecurring, deleteRecurring } = useRecurring(refetch);

  const balances = useMemo(() => calculateBalances(), [calculateBalances]);

  return (
    <Layout>
      {/* Recurring */}
      <div className="section">
        <div className="card">
          <RecurringManager
            recurring={recurring}
            categories={categoryNames}
            onAdd={addRecurring}
            onToggle={toggleRecurring}
            onDelete={deleteRecurring}
          />
        </div>
      </div>

      {/* Export & Backup */}
      <div className="section">
        <div className="section-title">Data Management</div>
        <div className="card">
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <ExportButton
              transactions={transactions}
              balances={balances}
              getMonthlyData={getMonthlyData}
            />
            <BackupButton />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-md)' }}>
            PDF includes balances, monthly summary, top categories, and recent transactions. JSON backup contains all data and can be used for restoration.
          </p>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Security</div>
        <div className="card">
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
            Sign out from this device.
          </p>
          <button
            className="btn btn-outline"
            type="button"
            onClick={() => setLogoutOpen(true)}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        title="Sign out?"
        description="You will be returned to the login screen. Your data remains linked to your account."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={async () => {
          setLogoutOpen(false);
          await signOut();
          router.replace('/login');
        }}
      />
    </Layout>
  );
}
