import { useEffect, useRef, useState } from 'react';

export const useWakeLock = () => {
  const wakeLockRef = useRef<any>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = async () => {
    try {
      // @ts-ignore - Wake Lock API experimental
      if ('wakeLock' in navigator && (navigator as any).wakeLock?.request) {
        // @ts-ignore
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        setIsActive(true);
        wakeLockRef.current.addEventListener?.('release', () => setIsActive(false));
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }
    } catch (e: any) {
      setError(e?.message || 'Não foi possível manter a tela ligada');
    }
  };

  const release = async () => {
    try {
      await wakeLockRef.current?.release?.();
    } catch {}
    wakeLockRef.current = null;
    setIsActive(false);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };

  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && wakeLockRef.current) {
      try {
        await request();
      } catch {}
    }
  };

  useEffect(() => {
    return () => {
      release();
    };
  }, []);

  return { request, release, isActive, error };
};
