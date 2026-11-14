import { useEffect, useState } from 'react';
export function useCountdown(deadline: number | null, offset = 0) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 200); return () => clearInterval(timer); }, []);
  return deadline === null ? null : Math.max(0, Math.ceil((deadline - now - offset) / 1000));
}
