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
      style={{ borderBottom: '1px solid var(--border)', background: 'rgba(10,10,15,0.88)' }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--text)', textDecoration: 'none' }}
          >
            <svg width="22" height="22" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="32" height="32" rx="7" fill="#7c3aed"/>
              <polygon points="16,5 7,14 16,17" fill="white" opacity="0.75"/>
              <polygon points="16,5 25,14 16,17" fill="white" opacity="0.97"/>
              <polygon points="7,14 16,27 16,17"  fill="white" opacity="0.40"/>
              <polygon points="25,14 16,17 16,27" fill="white" opacity="0.62"/>
            </svg>
            Gacha<span style={{ color: 'var(--purple-bright)' }}>Daily</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-4">
            {navLink('/games', 'Games')}
            {navLink('/dashboard', 'My List')}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Desktop auth — hidden on mobile */}
          <div className="hidden sm:flex items-center gap-3">
            {isLoading ? null : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--purple), var(--cyan))',
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
                      className="block px-4 py-2 text-sm transition-colors hover:bg-zinc-800"
                      style={{ color: 'var(--text2)', textDecoration: 'none' }}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => { logout(); setDropdownOpen(false); }}
                      className="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-zinc-800"
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
                    background: 'var(--purple)',
                    color: 'white',
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
            className="sm:hidden"
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
          className="sm:hidden"
          style={{ borderTop: '1px solid var(--border)', background: 'rgba(10,10,15,0.97)' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', gap: '1rem' }}>
            {navLink('/games', 'Games')}
            {navLink('/dashboard', 'My List')}
            {!isLoading && (
              <>
                <div style={{ height: 1, background: 'var(--border)' }} />
                {user ? (
                  <>
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
                        background: 'var(--purple)',
                        color: 'white',
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
