import Link from 'next/link';

export default function EmptyDashboard() {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        background: 'var(--bg2)',
        borderRadius: 14,
        padding: '56px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        textAlign: 'center',
      }}
    >
      {/* Crosshair SVG */}
      <svg
        width="52"
        height="52"
        viewBox="0 0 52 52"
        fill="none"
        aria-hidden="true"
        style={{ color: 'var(--text3)' }}
      >
        <circle cx="26" cy="26" r="13" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="26" cy="26" r="5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="26" y1="4" x2="26" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="26" y1="39" x2="26" y2="48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="4" y1="26" x2="13" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="39" y1="26" x2="48" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 20,
            color: 'var(--text)',
            margin: 0,
          }}
        >
          Your tracker is empty
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-noto-jp)',
            color: 'var(--text2)',
            fontSize: 14,
            lineHeight: 1.6,
            margin: 0,
            maxWidth: 300,
          }}
        >
          Add your first gacha game and start tracking daily resets.
        </p>
      </div>

      <Link
        href="/games"
        style={{
          background: 'var(--purple)',
          color: 'white',
          borderRadius: 10,
          padding: '10px 24px',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 14,
          marginTop: 8,
          textDecoration: 'none',
        }}
      >
        Add your first game
      </Link>
    </div>
  );
}
