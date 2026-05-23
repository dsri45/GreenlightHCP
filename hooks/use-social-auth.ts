import { signInWithOAuthProvider } from '@/lib/oauth';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

export function useSocialAuth() {
  const router = useRouter();
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setOauthLoading(true);
    try {
      await signInWithOAuthProvider('google');
      router.replace('/(tabs)/portfolio');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign-in failed. Please try again.';
      if (message !== 'Sign-in was cancelled.') {
        setError(message);
      }
    } finally {
      setOauthLoading(false);
    }
  }, [router]);

  return {
    signInWithGoogle,
    oauthLoading,
    oauthError: error,
    clearOauthError: () => setError(null),
  };
}
