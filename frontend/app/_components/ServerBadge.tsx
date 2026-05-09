import { displayServer } from '../_lib/servers';

function getServerStyle(display: string): { bg: string; text: string; border: string } {
  switch (display) {
    case 'Global':
      return { bg: 'rgba(6,182,212,0.1)', text: 'var(--cyan)', border: 'rgba(6,182,212,0.2)' };
    case 'Americas':
    case 'N. America':
    case 'E. Americas':
    case 'EU/Americas':
      return { bg: 'rgba(124,58,237,0.1)', text: 'var(--purple-bright)', border: 'rgba(124,58,237,0.2)' };
    case 'Japan':
      return { bg: 'rgba(236,72,153,0.1)', text: 'var(--pink)', border: 'rgba(236,72,153,0.2)' };
    case 'Europe':
      return { bg: 'rgba(16,185,129,0.1)', text: 'var(--green)', border: 'rgba(16,185,129,0.2)' };
    default:
      return { bg: 'rgba(168,158,192,0.08)', text: 'var(--text2)', border: 'rgba(168,158,192,0.15)' };
  }
}

interface Props {
  server: string;
  size?: 'sm' | 'xs';
}

export default function ServerBadge({ server, size = 'sm' }: Props) {
  const label = displayServer(server);
  const { bg, text, border } = getServerStyle(label);
  return (
    <span
      style={{
        background: bg,
        color: text,
        border: `1px solid ${border}`,
        borderRadius: 999,
        padding: size === 'xs' ? '1px 7px' : '2px 9px',
        fontSize: size === 'xs' ? 10 : 11,
        fontFamily: 'var(--font-jetbrains-mono)',
        fontWeight: 500,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        lineHeight: 1.5,
        display: 'inline-block',
      }}
    >
      {label}
    </span>
  );
}
