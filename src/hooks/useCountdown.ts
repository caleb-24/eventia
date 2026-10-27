import { useCallback, useEffect, useState } from 'react';

/** Cuenta regresiva en segundos. `restart()` vuelve a empezar desde `seconds`. */
export function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  const restart = useCallback(() => setRemaining(seconds), [seconds]);

  return { remaining, restart, done: remaining <= 0 };
}

export const formatSeconds = (total: number) =>
  `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
