'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SubmissionsBadge({ token }: { token: string }) {
  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/gdt/admin/submissions?status=pending&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(r => r.json())
      .then(data => setPending(data.total ?? 0))
      .catch(() => setPending(0));
  }, [token]);

  if (pending === null || pending === 0) return null;

  return (
    <Link
      href="/admin/submissions"
      className="mb-6 flex items-center justify-between rounded-xl px-4 py-3 transition-colors"
      style={{
        border: '1px solid rgba(200,155,60,0.30)',
        background: 'rgba(200,155,60,0.06)',
      }}
    >
      <div className="flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
          <rect x="3" y="6" width="18" height="13" rx="2" stroke="#c8913c" strokeWidth="1.5"/>
          <path d="M3 10l9 6 9-6" stroke="#c8913c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-sm font-medium" style={{ color: 'var(--gold-bright)' }}>
          {pending} game submission{pending !== 1 ? 's' : ''} pending review
        </span>
      </div>
      <span className="text-xs" style={{ color: 'var(--gold)' }}>Review →</span>
    </Link>
  );
}
