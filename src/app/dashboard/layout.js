'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', icon: '💬', label: 'Query Data' },
    { href: '/dashboard/datasources', icon: '🗄️', label: 'Data Sources' },
    { href: '/dashboard/history', icon: '📜', label: 'Query History' },
  ];

  if (session?.user?.role === 'admin') {
    navItems.push({ href: '/dashboard/team', icon: '👥', label: 'Team Settings' });
  }

  return (
    <div style={{ display: 'flex' }}>
      <aside className="sidebar">
        <div className="sidebar-logo">AI Data Explorer</div>
        <div className="sidebar-subtitle">SaaS Edition</div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <ThemeToggle />
            <span className="sidebar-user-role">{session?.user?.role}</span>
          </div>
          <div className="sidebar-user-email">{session?.user?.email}</div>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
