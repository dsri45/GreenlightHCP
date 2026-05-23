import { persistLoginExpiry } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import type { EmailOtpType } from '@supabase/supabase-js';

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Parse query + hash params from a Supabase auth redirect URL. */
export function parseAuthRedirectParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const { queryParams } = Linking.parse(url);

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      const normalized = readParam(value);
      if (normalized) params[key] = normalized;
    }
  }

  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    for (const [key, value] of new URLSearchParams(url.slice(hashIndex + 1))) {
      params[key] = value;
    }
  }

  return params;
}

/** Exchange a Supabase redirect URL for a stored session. */
export async function createSessionFromUrl(url: string) {
  const params = parseAuthRedirectParams(url);

  if (params.error_code || params.error) {
    throw new Error(params.error_description ?? params.error ?? params.error_code);
  }

  if (params.token_hash && params.type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: params.token_hash,
      type: params.type as EmailOtpType,
    });
    if (error) throw error;
    return data.session;
  }

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data.session;
  }

  if (params.access_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token ?? '',
    });
    if (error) throw error;
    return data.session;
  }

  throw new Error('Sign-in link is invalid or expired.');
}

export async function completeAuthFromUrl(url: string) {
  const session = await createSessionFromUrl(url);
  if (session) {
    await persistLoginExpiry();
  }
  return session;
}

export function isAuthRedirectUrl(url: string): boolean {
  return url.startsWith('greenlight://auth/callback');
}
