'use client';

import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../_context/AuthContext';

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        fontSize: 14,
        color: pathname === href ? 'var(--text)' : 'var(--text3)',
        textDecoration: 'none',
        transition: 'color 0.15s',
      }}
    >
      {label}
    </Link>
  );

  const initials = user ? user.username.slice(0, 1).toUpperCase() : '';

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 backdrop-blur"
      style={{ borderBottom: '1px solid var(--border)', background: 'rgba(13,11,8,0.90)' }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href="/"
            className="flex items-center gap-2"
            style={{ textDecoration: 'none' }}
          >
            <svg width="34" height="34" viewBox="0 0 96 96" aria-hidden="true">
              <rect width="96" height="96" rx="20" fill="#0d0b08"/>
              <defs>
                <linearGradient id="navfg" x1="15%" y1="0%" x2="85%" y2="100%">
                  <stop offset="0%" stopColor="#f0d898"/>
                  <stop offset="40%" stopColor="#d4a040"/>
                  <stop offset="100%" stopColor="#7a5018"/>
                </linearGradient>
                <linearGradient id="navft" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f8e8b0"/>
                  <stop offset="100%" stopColor="#c8913c"/>
                </linearGradient>
                <linearGradient id="navfb" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#7a5018"/>
                  <stop offset="100%" stopColor="#3a2008"/>
                </linearGradient>
              </defs>
              <polygon points="48,14 72,40 48,72 24,40" fill="url(#navfg)"/>
              <polygon points="48,14 72,40 48,40" fill="url(#navft)" opacity="0.5"/>
              <polygon points="48,72 24,40 48,40" fill="url(#navfb)" opacity="0.8"/>
              <line x1="24" y1="40" x2="72" y2="40" stroke="#0d0b08" strokeWidth="1.5" opacity="0.6"/>
            </svg>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              <span style={{ color: 'var(--text)' }}>Gacha</span>
              <span style={{ color: 'var(--gold, #c8913c)' }}>Daily</span>
              <span style={{ color: 'var(--text3)' }}>Tracker</span>
            </span>
          </Link>
          <nav className="hidden xl:flex items-center gap-4">
            {navLink('/games', 'Games')}
            {navLink('/dashboard', 'My List')}
            {user && user.role >= 3 && navLink('/admin', 'Admin')}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Desktop auth — hidden on mobile */}
          <div className="hidden xl:flex items-center gap-3">
            {isLoading ? null : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8a6020, #e8c86a)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                    flexShrink: 0,
                  }}
                  title={user.username}
                >
                  {initials}
                </button>
                {dropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-36 py-1 shadow-xl"
                    style={{ borderRadius: 10, border: '1px solid var(--border2)', background: 'var(--bg2)' }}
                  >
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm transition-colors hover:bg-[#18140d]"
                      style={{ color: 'var(--text2)', textDecoration: 'none' }}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => { logout(); setDropdownOpen(false); }}
                      className="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#18140d]"
                      style={{ color: 'var(--text2)' }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  style={{
                    border: '1px solid var(--border2)',
                    color: 'var(--text2)',
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 500,
                    fontSize: 13,
                    textDecoration: 'none',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  style={{
                    background: 'linear-gradient(135deg, #c8913c, #e8c86a)',
                    color: '#0a0808',
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: 13,
                    textDecoration: 'none',
                  }}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            className="xl:hidden"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Toggle menu"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              color: 'var(--text2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {mobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div
          className="xl:hidden"
          style={{ borderTop: '1px solid var(--border)', background: 'rgba(13,11,8,0.97)' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', gap: '1rem' }}>
            {navLink('/games', 'Games')}
            {navLink('/dashboard', 'My List')}
            {!isLoading && (
              <>
                <div style={{ height: 1, background: 'var(--border)' }} />
                {user ? (
                  <>
                    {user.role >= 3 && navLink('/admin', 'Admin')}
                    <Link
                      href="/profile"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 500,
                        fontSize: 14,
                        color: pathname === '/profile' ? 'var(--text)' : 'var(--text3)',
                        textDecoration: 'none',
                        transition: 'color 0.15s',
                      }}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 500,
                        fontSize: 14,
                        color: 'var(--text3)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        padding: 0,
                        transition: 'color 0.15s',
                      }}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      href="/login"
                      style={{
                        flex: 1,
                        border: '1px solid var(--border2)',
                        color: 'var(--text2)',
                        borderRadius: 8,
                        padding: '8px 0',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 500,
                        fontSize: 13,
                        textDecoration: 'none',
                        textAlign: 'center',
                        transition: 'border-color 0.15s, color 0.15s',
                      }}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #c8913c, #e8c86a)',
                        color: '#0a0808',
                        borderRadius: 8,
                        padding: '8px 0',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        fontSize: 13,
                        textDecoration: 'none',
                        textAlign: 'center',
                      }}
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
