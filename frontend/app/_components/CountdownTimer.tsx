'use client';

import { useEffect, useState } from 'react';
import { getNextResetMs, msToCountdown, formatCountdown } from '../_lib/countdown';

interface Props {
  timezone: string;
  dailyReset: string;
}

export default function CountdownTimer({ timezone, dailyReset }: Props) {
  const [display, setDisplay] = useState('--:--:--');

  useEffect(() => {
    function tick() {
      const ms = getNextResetMs(timezone, dailyReset);
      setDisplay(formatCountdown(msToCountdown(ms)));
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timezone, dailyReset]);

  return <span className="font-mono tabular-nums text-violet-400">{display}</span>;
}
