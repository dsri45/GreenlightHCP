import { seedStocksFromCatalog } from '@/services/supabase/stocks';
import { useEffect, useState } from 'react';

/** Seeds the Supabase `stocks` table from the hardcoded catalog on app open. */
export function useStocksBootstrap() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    seedStocksFromCatalog()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to seed stocks');
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, error };
}
