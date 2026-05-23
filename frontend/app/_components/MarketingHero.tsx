'use client';

import Link from 'next/link';
import { useState } from 'react';

type MockGame = {
  name: string;
  server: string;
  icon: string;
  done: boolean;
  countdown?: string;
};

const GAME_POOL: MockGame[] = [
  { name: 'Genshin Impact',           server: 'Asia',   icon: 'genshin-impact',               done: false, countdown: '03:42:11' },
  { name: 'Blue Archive',             server: 'JP',     icon: 'blue-archive',                 done: true   },
  { name: 'Nikke',                    server: 'Global', icon: 'goddess-of-victory-nikke',     done: false, countdown: '07:15:44' },
  { name: 'Honkai: Star Rail',        server: 'NA',     icon: 'honkai-star-rail',             done: false, countdown: '01:28:03' },
  { name: 'Arknights',               server: 'EN',     icon: 'arknights',                    done: false, countdown: '05:11:30' },
  { name: 'Wuthering Waves',          server: 'Asia',   icon: 'wuthering-waves',              done: true   },
  { name: 'Limbus Company',           server: 'Global', icon: 'limbus-company',               done: false, countdown: '02:44:18' },
  { name: 'Reverse: 1999',            server: 'Global', icon: 'reverse-1999',                 done: false, countdown: '08:32:55' },
  { name: 'Punishing: Gray Raven',    server: 'Global', icon: 'punishing-gray-raven',         done: true   },
  { name: 'Azur Lane',                server: 'EN',     icon: 'azur-lane-en',                 done: false, countdown: '04:58:22' },
  { name: 'Fate/Grand Order',         server: 'NA',     icon: 'fate-grand-order',             done: false, countdown: '06:20:09' },
  { name: 'Tower of Fantasy',         server: 'Global', icon: 'tower-of-fantasy',             done: false, countdown: '11:04:37' },
  { name: 'Epic Seven',               server: 'Asia',   icon: 'epic-seven',                   done: true   },
  { name: 'Fire Emblem Heroes',       server: 'Global', icon: 'fire-emblem-heroes',           done: false, countdown: '00:51:09' },
  { name: 'Cookie Run: Kingdom',      server: 'Global', icon: 'cookie-run-kingdom',           done: false, countdown: '09:17:33' },
  { name: 'Pokémon Masters EX',       server: 'Global', icon: 'pokemon-masters-ex',           done: true   },
  { name: 'Dragon Ball Legends',      server: 'Global', icon: 'dragon-ball-legends',          done: false, countdown: '04:03:52' },
  { name: 'JJK: Phantom Parade',      server: 'Global', icon: 'jjk-phantom-parade',           done: false, countdown: '06:29:14' },
  { name: 'Solo Leveling: Arise',     server: 'Global', icon: 'solo-leveling-arise',          done: false, countdown: '10:44:07' },
  { name: 'Granblue Fantasy',         server: 'JP',     icon: 'granblue-fantasy',             done: true   },
  { name: 'Girls\' Frontline',        server: 'EN',     icon: 'girls-frontline',              done: false, countdown: '03:18:40' },
  { name: 'Honkai Impact 3rd',        server: 'NA',     icon: 'honkai-impact-3rd',            done: false, countdown: '12:05:28' },
  { name: 'Guardian Tales',           server: 'Asia',   icon: 'guardian-tales',               done: false, countdown: '01:57:19' },
  { name: 'MementoMori',              server: 'Global', icon: 'memento-mori',                 done: true   },
  { name: 'Infinity Nikki',           server: 'NA',     icon: 'infinity-nikki',               done: false, countdown: '05:36:48' },
  { name: 'Love and Deepspace',       server: 'Asia',   icon: 'love-and-deepspace',           done: false, countdown: '08:11:02' },
  { name: 'RAID: Shadow Legends',     server: 'EU',     icon: 'raid-shadow-legends',          done: false, countdown: '02:22:37' },
  { name: 'Arknights: Endfield',      server: 'NA/EU',  icon: 'arknights-endfield',           done: true   },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MarketingHero() {
  const [games] = useState<MockGame[]>(() => shuffle(GAME_POOL).slice(0, 7));
  const doneCount = games.filter(g => g.done).length;

  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Kintsugi vein background — unchanged */}
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
      {/* Radial gold atmosphere */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(200,155,60,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Two-column grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2"
        style={{ minHeight: 'calc(100vh - 56px)', position: 'relative', zIndex: 1 }}
      >
        {/* ── Left column — copy ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '52px 40px 40px 40px',
          }}
        >
          {/* Badge pill */}
          <div
            className="hero-anim"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid var(--border2)',
              background: 'rgba(200,155,60,0.05)',
              borderRadius: 999,
              padding: '6px 16px',
              marginBottom: 28,
              width: 'fit-content',
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

          {/* Eyebrow */}
          <div
            className="hero-anim"
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}
          >
            <div style={{ width: 28, height: 1, background: 'var(--gold-dim)', flexShrink: 0 }} />
            <span
              style={{
                fontFamily: 'var(--font-jetbrains-mono)',
                fontSize: 10,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--text2)',
              }}
            >
              GACHA DAILY TRACKER
            </span>
          </div>

          {/* H1 */}
          <h1
            className="hero-anim hero-anim-d1"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 'clamp(52px, 7.5vw, 96px)',
              letterSpacing: '-0.04em',
              lineHeight: 1.0,
              margin: 0,
              marginBottom: 32,
            }}
          >
            <span style={{ color: 'var(--text)', display: 'block' }}>Never miss</span>
            <span style={{ color: 'var(--gold)', display: 'block' }}>a daily reset</span>
            <span style={{ color: 'var(--text3)', display: 'block' }}>again.</span>
          </h1>

          {/* Subtitle */}
          <p
            className="hero-anim hero-anim-d2"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              color: 'var(--text2)',
              fontSize: 15,
              lineHeight: 1.65,
              maxWidth: 380,
              margin: 0,
              marginBottom: 44,
            }}
          >
            Track resets across 330+ gacha games. Your timezone, your list — know exactly when each daily window closes.
          </p>

          {/* CTA row */}
          <div
            className="hero-anim hero-anim-d3"
            style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
          >
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
              → Start tracking free
            </Link>
            <Link
              href="/games"
              style={{
                color: 'var(--text2)',
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: 15,
                textDecoration: 'none',
                borderBottom: '1px solid var(--gold-dim)',
                paddingBottom: 1,
              }}
            >
              Browse games
            </Link>
          </div>
        </div>

        {/* ── Right column — live preview panel ── */}
        <div
          className="hero-panel hidden md:flex"
          style={{
            flexDirection: 'column',
            borderLeft: '1px solid var(--border)',
            background: 'rgba(13,11,8,0.85)',
            position: 'relative',
            padding: '32px 36px',
            overflow: 'hidden',
          }}
        >
          {/* Corner bracket decoration (top-right) */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 72,
              height: 72,
              borderLeft: '1px solid rgba(200,145,60,0.12)',
              borderBottom: '1px solid rgba(200,145,60,0.12)',
              pointerEvents: 'none',
            }}
          />

          {/* Vertical "live preview" label */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              writingMode: 'vertical-rl',
              fontFamily: 'var(--font-jetbrains-mono)',
              fontSize: 9,
              color: 'var(--text3)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            live preview
          </div>

          {/* Header row: label + completion counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span
              style={{
                fontFamily: 'var(--font-jetbrains-mono)',
                fontSize: 9,
                color: 'var(--text3)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                whiteSpace: 'nowrap',
              }}
            >
              Your tracked games
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span
              style={{
                fontFamily: 'var(--font-jetbrains-mono)',
                fontSize: 9,
                color: 'var(--gold-dim)',
                whiteSpace: 'nowrap',
                letterSpacing: '0.06em',
              }}
            >
              {doneCount}/{games.length} done
            </span>
          </div>

          {/* Thin progress bar */}
          <div
            style={{
              height: 2,
              background: 'rgba(200,145,60,0.10)',
              borderRadius: 1,
              marginBottom: 18,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(doneCount / games.length) * 100}%`,
                background: 'linear-gradient(90deg, var(--gold-dim), var(--gold))',
                borderRadius: 1,
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          {/* Mock game rows */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {games.map((g, i) => (
              <div
                key={`${g.name}-${g.server}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom:
                    i < games.length - 1
                      ? '1px solid rgba(200,145,60,0.06)'
                      : undefined,
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  {/* Game icon */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '1px solid rgba(200,145,60,0.15)',
                      background: 'rgba(200,145,60,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/icons/${g.icon}.gif`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/icons/placeholder.svg';
                      }}
                      width={36}
                      height={36}
                      style={{ width: 36, height: 36, objectFit: 'cover' }}
                      alt={g.name}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      color: g.done ? 'var(--text3)' : 'var(--text2)',
                      fontFamily: 'var(--font-display)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                    }}
                  >
                    {g.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                  {/* Server badge */}
                  <span
                    style={{
                      background: 'rgba(200,145,60,0.08)',
                      border: '1px solid rgba(200,145,60,0.15)',
                      color: 'var(--gold-dim)',
                      fontFamily: 'var(--font-jetbrains-mono)',
                      fontSize: 9,
                      borderRadius: 4,
                      padding: '2px 6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {g.server}
                  </span>
                  {/* Countdown or done */}
                  {g.done ? (
                    <span
                      style={{
                        background: 'rgba(127,176,105,0.12)',
                        border: '1px solid rgba(127,176,105,0.2)',
                        color: 'var(--green)',
                        fontFamily: 'var(--font-jetbrains-mono)',
                        fontSize: 9,
                        borderRadius: 4,
                        padding: '2px 6px',
                      }}
                    >
                      ✓ done
                    </span>
                  ) : (
                    <span
                      style={{
                        fontFamily: 'var(--font-jetbrains-mono)',
                        fontSize: 11,
                        color: 'var(--gold)',
                        minWidth: 52,
                        textAlign: 'right',
                      }}
                    >
                      {g.countdown}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Ghost "Add a game…" row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 0',
              opacity: 0.35,
              marginTop: 4,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: '1px dashed rgba(200,145,60,0.22)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <line x1="6" y1="1" x2="6" y2="11" stroke="rgba(200,145,60,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="1" y1="6" x2="11" y2="6" stroke="rgba(200,145,60,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span
              style={{
                fontSize: 12,
                color: 'var(--text3)',
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
              }}
            >
              Add a game…
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
