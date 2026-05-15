import { displayServer } from '../_lib/servers';

function getServerStyle(display: string): { bg: string; text: string; border: string } {
  switch (display) {
    case 'Global':
      return { bg: 'rgba(240,237,232,0.08)', text: '#f0ede8', border: 'rgba(240,237,232,0.25)' };
    case 'Americas':
    case 'N. America':
    case 'E. Americas':
      return {
        bg: 'rgba(200,155,60,0.08)',
        text: 'var(--gold-bright)',
        border: 'rgba(200,155,60,0.22)',
      };
    case 'Japan':
      return { bg: 'rgba(224,112,64,0.08)', text: '#e07040', border: 'rgba(224,112,64,0.22)' };
    case 'Europe':
    case 'EU/Americas':
      return { bg: 'rgba(180,185,195,0.08)', text: '#b4b9c3', border: 'rgba(180,185,195,0.22)' };
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
