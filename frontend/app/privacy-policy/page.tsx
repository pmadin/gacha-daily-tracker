import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Gacha Daily Tracker',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="mb-10 text-sm text-zinc-500">Last updated: May 2026</p>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-violet-400">What We Collect</h2>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li>
            <span className="text-zinc-200">Email address</span> — collected when you create an
            account. Used for authentication and, in the future, optional daily-reset notifications.
          </li>
          <li>
            <span className="text-zinc-200">Password</span> — stored as a salted bcrypt hash. Your
            plaintext password is never stored or transmitted after your initial request.
          </li>
          <li>
            <span className="text-zinc-200">Game list &amp; completion data</span> — the games you
            track and your daily completion records. Stored in our database and associated with your
            account.
          </li>
          <li>
            <span className="text-zinc-200">Analytics data</span> — page views, device type, browser,
            and country via Vercel Analytics and Vercel Speed Insights. This data is anonymized and
            contains no personally identifiable information.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-violet-400">How We Use It</h2>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li>To authenticate your account and keep your game list in sync across devices.</li>
          <li>
            To send optional reset notifications in the future (you will be able to opt in or out at
            any time).
          </li>
          <li>To understand general site usage and improve performance.</li>
          <li>We do not sell your data, run ads, or share your information with third parties beyond
            what is described below.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-violet-400">Data Storage &amp; Third Parties</h2>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li>
            <span className="text-zinc-200">Heroku</span> — account and tracker data is stored in a
            PostgreSQL database hosted on Heroku.
          </li>
          <li>
            <span className="text-zinc-200">Vercel</span> — the frontend is hosted on Vercel, which
            also handles analytics. See{' '}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              Vercel&apos;s Privacy Policy
            </a>{' '}
            for details on how they handle analytics data.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-violet-400">Your Rights</h2>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li>You can delete your account at any time from your account settings, which removes all
            associated data from our database.</li>
          <li>You can use the site anonymously (without an account) — no data is stored server-side
            in anonymous mode; your game list is kept in your browser&apos;s local storage only.</li>
          <li>
            To request data deletion or ask questions, contact{' '}
            <a
              href="mailto:pmadin@uw.edu"
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              pmadin@uw.edu
            </a>
            .
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-violet-400">Changes to This Policy</h2>
        <p className="text-sm text-zinc-400">
          This policy may be updated as the service evolves. The &quot;last updated&quot; date at the top of
          this page will reflect any changes. Continued use of the site after changes are posted
          constitutes acceptance.
        </p>
      </section>

      <p className="text-sm text-zinc-500">
        Questions?{' '}
        <a
          href="mailto:pmadin@uw.edu"
          className="text-violet-400 hover:text-violet-300 transition-colors"
        >
          pmadin@uw.edu
        </a>{' '}
        ·{' '}
        <Link href="/terms-of-service" className="text-violet-400 hover:text-violet-300 transition-colors">
          Terms of Service
        </Link>
      </p>
    </div>
  );
}
