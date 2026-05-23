import Link from 'next/link';

const features = [
  {
    num: '01',
    title: '330+ games, zero guesswork',
    description:
      'Every major gacha title with accurate daily reset times, server regions, and timezone support built in.',
    tag: 'GAMES INDEXED',
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
    num: '02',
    title: 'Live reset timers',
    description:
      'Countdown clocks that respect your local timezone. Know exactly how long until each game’s daily window closes.',
    tag: 'TIMEZONE AWARE',
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
    num: '03',
    title: 'Sync across devices',
    description:
      'Create a free account to save your list to the cloud — access it from any device without losing your progress.',
    tag: 'CLOUD SYNC',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 20, height: 1, background: 'var(--gold)', flexShrink: 0 }} />
          <span
            style={{
              fontFamily: 'var(--font-jetbrains-mono)',
              fontSize: 10,
              color: 'var(--text3)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Why use it
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-jetbrains-mono)',
              fontSize: 10,
              color: 'var(--text3)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            03 reasons
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

      {/* Bento grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2"
        style={{
          gap: '1px',
          background: 'var(--border)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* ── Cell 01 (top-left) — decorative corner accent via CSS ── */}
        <div
          className="bento-cell bento-cell-01"
          style={{
            background: 'var(--bg2)',
            padding: '28px 28px 32px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Icon */}
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
              marginBottom: 16,
            }}
          >
            {features[0].icon}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-jetbrains-mono)',
              fontSize: 10,
              color: 'var(--text3)',
              letterSpacing: '0.08em',
              marginBottom: 10,
            }}
          >
            {features[0].num}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 19,
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.03em',
              marginBottom: '0.6rem',
            }}
          >
            {features[0].title}
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text2)',
              lineHeight: 1.65,
              flex: 1,
            }}
          >
            {features[0].description}
          </div>
          {/* Tag pill */}
          <div style={{ marginTop: 20 }}>
            <span
              style={{
                background: 'rgba(200,145,60,0.08)',
                border: '1px solid var(--border2)',
                color: 'var(--gold-dim)',
                fontFamily: 'var(--font-jetbrains-mono)',
                fontSize: 9,
                borderRadius: 4,
                padding: '3px 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {features[0].tag}
            </span>
          </div>
        </div>

        {/* ── Cell 02 (top-right) ── */}
        <div
          className="bento-cell"
          style={{
            background: 'var(--bg2)',
            padding: '28px 28px 32px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Icon */}
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
              marginBottom: 16,
            }}
          >
            {features[1].icon}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-jetbrains-mono)',
              fontSize: 10,
              color: 'var(--text3)',
              letterSpacing: '0.08em',
              marginBottom: 10,
            }}
          >
            {features[1].num}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 19,
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.03em',
              marginBottom: '0.6rem',
            }}
          >
            {features[1].title}
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text2)',
              lineHeight: 1.65,
              flex: 1,
            }}
          >
            {features[1].description}
          </div>
          {/* Tag pill */}
          <div style={{ marginTop: 20 }}>
            <span
              style={{
                background: 'rgba(200,145,60,0.08)',
                border: '1px solid var(--border2)',
                color: 'var(--gold-dim)',
                fontFamily: 'var(--font-jetbrains-mono)',
                fontSize: 9,
                borderRadius: 4,
                padding: '3px 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {features[1].tag}
            </span>
          </div>
        </div>

        {/* ── Cell 03 (bottom, spans 2 cols) ── */}
        <div
          className="bento-cell md:col-span-2"
          style={{
            background: 'var(--bg2)',
            display: 'flex',
            alignItems: 'center',
            gap: 40,
            padding: '24px 28px',
            flexWrap: 'wrap',
          }}
        >
          {/* Left side — feature copy */}
          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-jetbrains-mono)',
                fontSize: 10,
                color: 'var(--text3)',
                letterSpacing: '0.08em',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: 'rgba(200,155,60,0.10)',
                  border: '1px solid rgba(200,155,60,0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 4,
                }}
              >
                {features[2].icon}
              </div>
              {features[2].num}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--text)',
                letterSpacing: '-0.03em',
                marginBottom: '0.5rem',
              }}
            >
              {features[2].title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>
              {features[2].description}
            </div>
          </div>

          {/* Vertical divider */}
          <div
            style={{
              width: 1,
              alignSelf: 'stretch',
              background: 'var(--border)',
              flexShrink: 0,
            }}
          />

          {/* Right side — stats */}
          <div
            style={{
              display: 'flex',
              gap: 48,
              flexShrink: 0,
              flexWrap: 'wrap',
            }}
          >
            {[
              { value: '330+', label: 'GAMES' },
              { value: '20+',  label: 'REGIONS' },
              { value: 'Free', label: 'ALWAYS' },
            ].map(({ value, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 38,
                    fontWeight: 800,
                    letterSpacing: '-0.05em',
                    color: 'var(--gold)',
                    lineHeight: 1,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-jetbrains-mono)',
                    fontSize: 10,
                    color: 'var(--text3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginTop: 6,
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA callout */}
      <div
        style={{
          marginTop: 12,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 28px',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Icon box */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(200,145,60,0.08)',
              border: '1px solid var(--border2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2a6 6 0 0 0-6 6c0 3.5-1.5 5-1.5 5h15S16 11.5 16 8a6 6 0 0 0-6-6z" stroke="#c8913c" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
              <path d="M8.5 17a1.5 1.5 0 0 0 3 0" stroke="#c8913c" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          {/* Text block */}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--text2)',
                letterSpacing: '-0.02em',
                marginBottom: 3,
              }}
            >
              Never forget a reset — get notified
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
              Sign up for push notifications and email reminders before each window closes.
            </div>
          </div>
        </div>
        {/* CTA button */}
        <Link
          href="/register"
          style={{
            background: 'linear-gradient(135deg, #c8913c, #e8c86a)',
            color: '#0a0808',
            borderRadius: 8,
            padding: '9px 20px',
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
