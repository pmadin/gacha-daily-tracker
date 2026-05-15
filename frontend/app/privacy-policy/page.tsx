import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Gacha Daily Tracker',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="mb-10 text-sm" style={{ color: 'var(--text2)' }}>Last updated: May 2026</p>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold" style={{ color: 'var(--gold-bright)' }}>What We Collect</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
          When you create an account, we collect your email address and store your password as a
          salted bcrypt hash — your plaintext password is never stored. If you use the site without
          an account, no data is stored server-side; your game list stays in your browser&apos;s local
          storage only. We also collect your tracked games and daily completion records, associated
          with your account. Vercel Analytics collects anonymized page-view data (device type,
          browser, country) with no personally identifiable information.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold" style={{ color: 'var(--gold-bright)' }}>How We Use It</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
          Your data is used solely to authenticate your account, keep your game list synced across
          devices, and improve site performance. We do not sell your data, run ads, or share your
          information with any third party beyond the infrastructure providers listed below.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold" style={{ color: 'var(--gold-bright)' }}>Third-Party Infrastructure</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
          Account and tracker data is stored in a PostgreSQL database on Heroku. The frontend is
          hosted on Vercel, which also handles anonymized analytics. See{' '}
          <a
            href="https://vercel.com/legal/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-colors"
            style={{ color: 'var(--gold-bright)' }}
          >
            Vercel&apos;s Privacy Policy
          </a>{' '}
          for details.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold" style={{ color: 'var(--gold-bright)' }}>Age Restriction</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
          This site is intended for users who are 13 years of age or older. By creating an account
          or submitting your email address, you confirm that you are at least 13 years old. We do
          not knowingly collect personal information from children under 13. If we become aware that
          a user is under 13, we will delete their account and associated data promptly. Parents or
          guardians who believe their child has provided personal information should contact us at{' '}
          <a
            href="mailto:pmadin@uw.edu"
            className="hover:opacity-80 transition-colors"
            style={{ color: 'var(--gold-bright)' }}
          >
            pmadin@uw.edu
          </a>
          .
        </p>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
          Additionally, some game data displayed on this site is sourced from the open-source
          Game-Time-Master repository and may include games intended for mature audiences. This site
          does not endorse or curate that content. Users are responsible for ensuring the content
          they engage with is appropriate for their age.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold" style={{ color: 'var(--gold-bright)' }}>Your Rights</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
          You can delete your account at any time from your account settings, which removes all
          associated data from our database. To request data deletion or ask any privacy-related
          questions, contact{' '}
          <a
            href="mailto:pmadin@uw.edu"
            className="hover:opacity-80 transition-colors"
            style={{ color: 'var(--gold-bright)' }}
          >
            pmadin@uw.edu
          </a>
          .
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold" style={{ color: 'var(--gold-bright)' }}>Changes to This Policy</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
          This policy may be updated as the service evolves. The &quot;last updated&quot; date at the top of
          this page reflects any changes. Continued use of the site after changes are posted
          constitutes acceptance.
        </p>
      </section>

      <p className="text-sm" style={{ color: 'var(--text2)' }}>
        Questions?{' '}
        <a
          href="mailto:pmadin@uw.edu"
          className="hover:opacity-80 transition-colors"
          style={{ color: 'var(--gold-bright)' }}
        >
          pmadin@uw.edu
        </a>{' '}
        ·{' '}
        <Link
          href="/terms-of-service"
          className="hover:opacity-80 transition-colors"
          style={{ color: 'var(--gold-bright)' }}
        >
          Terms of Service
        </Link>
      </p>
    </div>
  );
}
