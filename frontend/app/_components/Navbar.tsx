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
            <span className="nav-logo-gem">
              <svg width="34" height="34" viewBox="0 0 96 96" aria-hidden="true">
                <rect width="96" height="96" rx="20" fill="#0d0b08"/>
                <defs>
                  <linearGradient id="neq1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fdf0c0"/>
                    <stop offset="100%" stopColor="#c8a030"/>
                  </linearGradient>
                  <linearGradient id="neq2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#d4a030"/>
                    <stop offset="100%" stopColor="#8a5c18"/>
                  </linearGradient>
                  <linearGradient id="neq3" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7a5018"/>
                    <stop offset="100%" stopColor="#3a2008"/>
                  </linearGradient>
                  <linearGradient id="neq4" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#4a2c0a"/>
                    <stop offset="100%" stopColor="#1a0c04"/>
                  </linearGradient>
                </defs>
                <polygon points="48,7 16,48 52,52" fill="url(#neq1)"/>
                <polygon points="48,7 52,52 80,48" fill="url(#neq2)"/>
                <polygon points="48,89 52,52 16,48" fill="url(#neq3)"/>
                <polygon points="48,89 80,48 52,52" fill="url(#neq4)"/>
                <line x1="16" y1="48" x2="52" y2="52" stroke="#f8e8a0" strokeWidth="1.1" opacity="0.7"/>
                <line x1="52" y1="52" x2="80" y2="48" stroke="#f8e8a0" strokeWidth="1.1" opacity="0.7"/>
                <line x1="48" y1="7" x2="16" y2="48" stroke="rgba(253,240,192,0.55)" strokeWidth="0.9"/>
                <line x1="48" y1="7" x2="52" y2="52" stroke="rgba(200,160,48,0.4)" strokeWidth="0.8"/>
                <line x1="48" y1="7" x2="80" y2="48" stroke="rgba(200,155,60,0.35)" strokeWidth="0.9"/>
                <line x1="16" y1="48" x2="48" y2="89" stroke="rgba(120,80,24,0.45)" strokeWidth="0.9"/>
                <line x1="52" y1="52" x2="48" y2="89" stroke="rgba(80,50,16,0.35)" strokeWidth="0.8"/>
                <line x1="80" y1="48" x2="48" y2="89" stroke="rgba(60,32,8,0.4)" strokeWidth="0.9"/>
                {/* Facet highlights — sequential light cycling, top-left → top-right → bottom-left → bottom-right */}
                <polygon className="nav-facet-hi" style={{ animationDelay: '0s' }}
                  points="48,7 16,48 52,52" fill="rgba(255,244,160,0.55)"/>
                <polygon className="nav-facet-hi" style={{ animationDelay: '0.2s' }}
                  points="48,7 52,52 80,48" fill="rgba(255,244,160,0.45)"/>
                <polygon className="nav-facet-hi" style={{ animationDelay: '0.4s' }}
                  points="48,89 52,52 16,48" fill="rgba(224,168,72,0.3)"/>
                <polygon className="nav-facet-hi" style={{ animationDelay: '0.6s' }}
                  points="48,89 80,48 52,52" fill="rgba(200,152,56,0.25)"/>
                {/* Edge catch-light on the horizontal divider */}
                <line className="nav-edge-flash" style={{ animationDelay: '0.1s' }}
                  x1="16" y1="48" x2="52" y2="52" stroke="#fffbe0" strokeWidth="2"/>
                <line className="nav-edge-flash" style={{ animationDelay: '0.1s' }}
                  x1="52" y1="52" x2="80" y2="48" stroke="#fffbe0" strokeWidth="2"/>
                {/* Elongated lens-flare stars — vertices + two corner floats */}
                <path className="nav-gem-sparkle" style={{ animationDelay: '0s' }}
                  d="M0-9 1-1 9 0 1 1 0 9-1 1-9 0-1-1Z" transform="translate(48,2)"/>
                <path className="nav-gem-sparkle" style={{ animationDelay: '0.09s' }}
                  d="M0-7 0.8-0.8 7 0 0.8 0.8 0 7-0.8 0.8-7 0-0.8-0.8Z" transform="translate(88,46)"/>
                <path className="nav-gem-sparkle" style={{ animationDelay: '0.18s' }}
                  d="M0-7 0.8-0.8 7 0 0.8 0.8 0 7-0.8 0.8-7 0-0.8-0.8Z" transform="translate(8,46)"/>
                <path className="nav-gem-sparkle" style={{ animationDelay: '0.28s' }}
                  d="M0-5 0.6-0.6 5 0 0.6 0.6 0 5-0.6 0.6-5 0-0.6-0.6Z" transform="translate(84,10)"/>
                <path className="nav-gem-sparkle" style={{ animationDelay: '0.38s' }}
                  d="M0-5 0.6-0.6 5 0 0.6 0.6 0 5-0.6 0.6-5 0-0.6-0.6Z" transform="translate(10,18)"/>
                <path className="nav-gem-sparkle" style={{ animationDelay: '0.47s' }}
                  d="M0-4 0.5-0.5 4 0 0.5 0.5 0 4-0.5 0.5-4 0-0.5-0.5Z" transform="translate(85,76)"/>
              </svg>
            </span>
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
            {navLink('/leaderboard', 'Leaderboard')}
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
            {navLink('/leaderboard', 'Leaderboard')}
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
