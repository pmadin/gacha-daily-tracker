import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — Gacha Daily Tracker',
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-white">Terms of Service</h1>
      <p className="mb-10 text-sm text-zinc-500">Last updated: May 2026</p>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-[#e8c86a]">Acceptance</h2>
        <p className="text-sm text-zinc-400">
          By using Gacha Daily Tracker (&quot;the site&quot;), you agree to these terms. If you do not agree,
          please do not use the site.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-[#e8c86a]">About the Service</h2>
        <p className="text-sm text-zinc-400">
          Gacha Daily Tracker is a personal project that helps players track daily resets across
          gacha games. It is provided free of charge for personal, non-commercial use. The service
          may be modified, interrupted, or discontinued at any time without notice.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-[#e8c86a]">Your Account</h2>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li>You are responsible for keeping your login credentials secure.</li>
          <li>You are responsible for all activity that occurs under your account.</li>
          <li>
            Accounts must not be used for unauthorized access, scraping, or abuse of the service or
            its API.
          </li>
          <li>We reserve the right to suspend or remove accounts that violate these terms.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-[#e8c86a]">Acceptable Use</h2>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li>Use the site for personal game tracking only.</li>
          <li>Do not attempt to access other users&apos; data.</li>
          <li>Do not use automated scripts to interact with the site beyond what the public API
            explicitly supports.</li>
          <li>Do not use the site in any way that could damage, disable, or impair it.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-[#e8c86a]">Intellectual Property</h2>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li>
            Original site code and design are copyright &copy; 2026 Peter Madin. The source code is
            publicly available on{' '}
            <a
              href="https://github.com/pmadin/gacha-daily-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#e8c86a] hover:opacity-80 transition-colors"
            >
              GitHub
            </a>
            .
          </li>
          <li>
            Game data and icons are sourced from{' '}
            <a
              href="https://github.com/cicerakes/Game-Time-Master"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#e8c86a] hover:opacity-80 transition-colors"
            >
              cicerakes/Game-Time-Master
            </a>{' '}
            and are licensed under GPL-3.0.
          </li>
          <li>
            Game names, logos, and artwork are the property of their respective publishers. Use of
            these assets on this site is for informational/fan purposes only and does not imply
            any affiliation with or endorsement by those publishers.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-[#e8c86a]">Disclaimer</h2>
        <p className="text-sm text-zinc-400">
          The site is provided &quot;as is&quot; with no warranties of any kind. We make no guarantees
          regarding uptime, accuracy of game data, or fitness for any particular purpose. Use at
          your own risk.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-[#e8c86a]">Changes to These Terms</h2>
        <p className="text-sm text-zinc-400">
          These terms may be updated at any time. The &quot;last updated&quot; date at the top of this page
          will reflect changes. Continued use of the site after changes are posted constitutes
          acceptance of the new terms.
        </p>
      </section>

      <p className="text-sm text-zinc-500">
        Questions?{' '}
        <a
          href="mailto:pmadin@uw.edu"
          className="text-[#e8c86a] hover:opacity-80 transition-colors"
        >
          pmadin@uw.edu
        </a>{' '}
        ·{' '}
        <Link href="/privacy-policy" className="text-[#e8c86a] hover:opacity-80 transition-colors">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
