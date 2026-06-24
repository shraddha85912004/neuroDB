'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { Database, Search, History, Users, LogOut, LayoutTemplate } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    );
  }

  const links = [
    { href: '/dashboard', label: 'Query Data', icon: <Search size={16} /> },
    { href: '/dashboard/datasources', label: 'Data Sources', icon: <Database size={16} /> },
    { href: '/dashboard/history', label: 'History', icon: <History size={16} /> },
  ];

  if (session?.user?.role === 'admin') {
    links.push({ href: '/dashboard/team', label: 'Team Settings', icon: <Users size={16} /> });
  }

  return (
    <div style={{ display: 'flex' }}>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <LayoutTemplate size={20} className="text-accent-color" />
          <span>NeuroDB</span>
        </div>
        <div className="sidebar-subtitle">AI Data Explorer</div>

        <nav className="sidebar-nav">
          {links.map(l => (
            <Link key={l.href} href={l.href} className={`nav-link ${pathname === l.href ? 'active' : ''}`}>
              <span className="nav-icon">{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          {session?.user && (
            <div style={{ marginBottom: '1rem' }}>
              <div className="sidebar-user-email">{session.user.email}</div>
              <span className="sidebar-user-role">{session.user.role}</span>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <ThemeToggle />
            <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
