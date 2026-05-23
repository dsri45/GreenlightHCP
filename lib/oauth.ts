import { AUTH_REDIRECT_URI } from '@/lib/auth-redirect';
import { completeAuthFromUrl, createSessionFromUrl } from '@/lib/auth-session';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google';

export { AUTH_REDIRECT_URI, createSessionFromUrl, completeAuthFromUrl };

export async function signInWithOAuthProvider(provider: OAuthProvider) {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to your .env file.',
    );
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: AUTH_REDIRECT_URI,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) {
    throw new Error('Could not start sign-in. Please try again.');
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, AUTH_REDIRECT_URI);

  if (result.type !== 'success') {
    throw new Error('Sign-in was cancelled.');
  }

  const session = await completeAuthFromUrl(result.url);
  if (!session) {
    throw new Error('Sign-in did not complete. Please try again.');
  }

  return session;
}
