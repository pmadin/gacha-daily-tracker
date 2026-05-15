import Link from 'next/link';

const features = [
  {
    title: '330+ Games indexed',
    description:
      'Every major gacha title with accurate daily reset times, server regions, and timezone support built in.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="7" stroke="#c8913c" strokeWidth="1.5" fill="none" />
        <circle cx="10" cy="10" r="2.5" fill="#c8913c" opacity="0.4" />
        <circle cx="10" cy="10" r="1" fill="#c8913c" />
        <path d="M10 2v3M10 15v3M2 10h3M15 10h3" stroke="#c8913c" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
  },
  {
    title: 'Live reset timers',
    description:
      'Countdown clocks that respect your local timezone. Know exactly how long until each game’s daily window closes.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="11" r="7" stroke="#c8913c" strokeWidth="1.5" fill="none" />
        <path d="M10 7v4l2.5 2.5" stroke="#c8913c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.5 2.5h5" stroke="#c8913c" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <path d="M10 2.5v1.5" stroke="#c8913c" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
  },
  {
    title: 'Sync across devices',
    description:
      'Create a free account to save your list to the cloud — access it from any device without losing your progress.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="10" height="10" rx="2.5" stroke="#c8913c" strokeWidth="1.5" fill="none" />
        <rect x="8" y="8" width="10" height="10" rx="2.5" stroke="#c8913c" strokeWidth="1.5" fill="none" opacity="0.5" />
        <path d="M8 5h4M5 8v4" stroke="#c8913c" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      </svg>
    ),
  },
];

export default function FeaturesSection() {
  return (
    <div>
      {/* Section header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 20, height: 1, background: 'var(--gold-bright)' }} />
          <span
            style={{
              fontFamily: 'var(--font-jetbrains-mono)',
              fontSize: 11,
              color: 'var(--gold-bright)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Why use it
          </span>
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.6rem',
            letterSpacing: '-0.03em',
            color: 'var(--text)',
            margin: 0,
          }}
        >
          Built for daily players
        </h2>
      </div>

      {/* Card grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-3"
        style={{
          gap: '1px',
          background: 'var(--border)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {features.map((f) => (
          <div
            key={f.title}
            className="feature-card"
            style={{
              background: 'var(--bg2)',
              padding: '2.25rem 2rem',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'rgba(200,155,60,0.12)',
                border: '1px solid rgba(200,155,60,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              {f.icon}
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text)',
                marginBottom: '0.6rem',
                fontFamily: 'var(--font-display)',
              }}
            >
              {f.title}
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: 14,
                fontFamily: 'var(--font-body)',
                color: 'var(--text2)',
                lineHeight: 1.6,
              }}
            >
              {f.description}
            </div>
          </div>
        ))}
      </div>

      {/* Notifications sign-up CTA */}
      <div
        style={{
          marginTop: '1.5rem',
          background: 'rgba(200,155,60,0.04)',
          border: '1px solid rgba(200,155,60,0.18)',
          borderRadius: 16,
          padding: '1.5rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(200,155,60,0.10)',
              border: '1px solid rgba(200,155,60,0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2a6 6 0 0 0-6 6c0 3.5-1.5 5-1.5 5h15S16 11.5 16 8a6 6 0 0 0-6-6z" stroke="#c8913c" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
              <path d="M8.5 17a1.5 1.5 0 0 0 3 0" stroke="#c8913c" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 15,
                color: 'var(--text)',
                marginBottom: 4,
              }}
            >
              Never forget a reset — get notified
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 480 }}>
              Sign up for a free account to enable browser push notifications — a heads-up before each daily window closes.{' '}
              <span style={{ color: 'var(--text3)' }}>Email reminders coming soon.</span>
            </div>
          </div>
        </div>
        <Link
          href="/register"
          style={{
            background: 'linear-gradient(135deg, #c8913c, #e8c86a)',
            color: '#0a0808',
            borderRadius: 8,
            padding: '8px 18px',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 13,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Sign up free →
        </Link>
      </div>
    </div>
  );
}
