import { supabase } from '@/lib/supabase';
import { getCurrentUserCreatedAt } from '@/services/supabase/auth-user';
import { useEffect, useState } from 'react';

export function useUserCreatedAt() {
  const [createdAt, setCreatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const date = await getCurrentUserCreatedAt();
        if (!cancelled) setCreatedAt(date);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { createdAt, loading };
}
