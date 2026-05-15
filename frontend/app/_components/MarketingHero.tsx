import Link from 'next/link';

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 36,
          color: 'var(--text)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-jetbrains-mono)',
          fontSize: 11,
          color: 'var(--text3)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginTop: 6,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function MarketingHero() {
  return (
    <section
      style={{
        minHeight: 'calc(100vh - 56px)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Kintsugi vein background — fades out toward bottom via mask */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          backgroundImage: "url('/kintsugi-veins-homepage.svg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          opacity: 0.45,
          maskImage: 'radial-gradient(ellipse 85% 75% at 50% 30%, black 10%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 75% at 50% 30%, black 10%, transparent 100%)',
        }}
      />
      {/* Radial gold atmosphere — adds depth even if veins are subtle */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(200,155,60,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px 48px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Badge pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid var(--border2)',
            background: 'rgba(200,155,60,0.05)',
            borderRadius: 999,
            padding: '6px 16px',
            marginBottom: 36,
          }}
        >
          <span
            className="pulse-dot"
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--green)',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              color: 'var(--text2)',
              fontFamily: 'var(--font-jetbrains-mono)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.04em',
            }}
          >
            330+ GAMES INDEXED
          </span>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-jetbrains-mono)',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text2)',
            marginBottom: 20,
          }}
        >
          — GACHA DAILY TRACKER —
        </div>

        {/* H1 — three lines */}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(36px, 7vw, 68px)',
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            margin: 0,
            marginBottom: 28,
          }}
        >
          <span style={{ color: 'var(--text)', display: 'block' }}>Never miss</span>
          <span
            style={{
              display: 'block',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0d898 40%, #c8913c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            a daily reset
          </span>
          <span
            style={{
              display: 'block',
              color: 'rgba(200, 155, 60, 0.30)',
            }}
          >
            again.
          </span>
        </h1>

        {/* Subheading */}
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            color: 'var(--text2)',
            fontSize: 16,
            lineHeight: 1.7,
            maxWidth: 460,
            margin: 0,
            marginBottom: 44,
          }}
        >
          Track resets across 330+ gacha games. Your timezone, your list — know exactly when each daily window closes.
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            href="/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #c8913c, #e8c86a)',
              color: '#0a0808',
              borderRadius: 10,
              padding: '13px 28px',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 15,
              textDecoration: 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <line x1="2" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <polyline points="9,4 13,8 9,12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Start tracking free
          </Link>
          <Link
            href="/games"
            style={{
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--text)',
              background: 'transparent',
              borderRadius: 10,
              padding: '13px 28px',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 15,
              textDecoration: 'none',
            }}
          >
            Browse games
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid var(--border)' }}>
        <div
          style={{
            margin: '0 auto',
            maxWidth: 1152,
            padding: '28px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <StatItem value="330+" label="games" />
          <div className="mx-4 sm:mx-12" style={{ width: 1, height: 32, background: 'var(--border)' }} />
          <StatItem value="20+" label="regions" />
          <div className="mx-4 sm:mx-12" style={{ width: 1, height: 32, background: 'var(--border)' }} />
          <StatItem value="free" label="always" />
        </div>
      </div>
    </section>
  );
}
