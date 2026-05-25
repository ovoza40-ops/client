'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import AuthModal from '@/components/auth/AuthModal';

interface HeaderProps {
  hasBanner?: boolean;
}

export default function Header({ hasBanner = false }: HeaderProps) {
  const { user, profile, signOut, isPremium, isAdmin } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const pathname = usePathname();
  const [authOpen, setAuthOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navLinks = [
    { href: '/translate', label: '⚡ Tarjima' },
    ...(isAdmin ? [{ href: '/admin', label: '🛡 Admin' }] : []),
  ];

  const bannerClass = hasBanner ? 'with-banner' : 'no-banner';

  return (
    <>
      <header id="mainHeader" className={bannerClass}>
        <div className="header-left">
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Menu"
          >
            ☰
          </button>
          <Link href="/" className="logo">
            <div className="logo-icon">📚</div>
            <div>
              <div className="logo-name">LinguaBook</div>
              <div className="logo-badge">PRO · AI TRANSLATOR</div>
            </div>
          </Link>
        </div>

        {/* Nav links — desktop */}
        <nav className="nav-links">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${pathname === l.href ? 'active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="header-right">
          {/* Theme toggle */}
          <button
            className="hdr-btn"
            onClick={toggleTheme}
            title={isDark ? 'Kunduzgi rejim' : 'Tungi rejim'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {user ? (
            <>
              {isPremium && (
                <span className="badge badge-premium" style={{ fontSize: '10px' }}>
                  ⭐ Premium
                </span>
              )}
              <Link href="/profile" className="hdr-btn">
                👤 {profile?.full_name?.split(' ')[0] ?? 'Profil'}
              </Link>
              <button className="hdr-btn" onClick={signOut}>
                Chiqish
              </button>
            </>
          ) : (
            <button
              className="hdr-btn active"
              onClick={() => setAuthOpen(true)}
              id="loginBtn"
            >
              🔑 Kirish
            </button>
          )}
        </div>
      </header>

      {/* Mobile sidebar nav */}
      {sidebarOpen && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 149,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            }}
            onClick={() => setSidebarOpen(false)}
          />
          <nav style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 160,
            width: 260, background: 'var(--surface)', borderRight: '1px solid var(--border)',
            padding: '80px 16px 24px', display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                  color: 'var(--text)', textDecoration: 'none', fontWeight: 600,
                  background: pathname === l.href ? 'var(--surface2)' : 'transparent',
                }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
