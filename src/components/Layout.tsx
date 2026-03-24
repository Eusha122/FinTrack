'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  LayoutDashboard,
  ArrowUpDown,
  Clock,
  BarChart3,
  Tag,
  Settings,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowUpDown },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/categories', label: 'Categories', icon: Tag },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const mobileNavItems = navItems.filter(i => i.href !== '/settings');

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, loading, signOut } = useAuth();
  const [logoutOpen, setLogoutOpen] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, router, user]);

  const handleLogout = React.useCallback(async () => {
    await signOut();
    router.replace('/login');
  }, [router, signOut]);

  if (loading || !user) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-dot" />
      </div>
    );
  }

  const pageTitle =
    navItems.find(item => item.href === pathname)?.label ||
    'Dashboard';
  const subtitle = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>FinTrack<br /><span>Personal Finance</span></h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
            >
              <item.icon />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="header-meta">
            <div className="header-title">{pageTitle}</div>
            <div className="header-subtitle">{subtitle}</div>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="theme-toggle header-theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            type="button"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <Link href="/settings" className="btn btn-icon btn-ghost" aria-label="Settings">
            <Settings size={18} />
          </Link>
          <button
            className="btn btn-outline header-logout"
            onClick={() => setLogoutOpen(true)}
            type="button"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-inner">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        {mobileNavItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-item ${pathname === item.href ? 'active' : ''}`}
          >
            <item.icon />
            {item.label}
          </Link>
        ))}
      </nav>

      <ConfirmDialog
        open={logoutOpen}
        title="Sign out?"
        description="You will be returned to the login screen. Your data remains linked to your account."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={async () => {
          setLogoutOpen(false);
          await handleLogout();
        }}
      />
    </div>
  );
}
