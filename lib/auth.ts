import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const LOGIN_EXPIRES_AT_KEY = 'greenlight_login_expires_at';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function persistLoginExpiry(): Promise<void> {
  await AsyncStorage.setItem(
    LOGIN_EXPIRES_AT_KEY,
    String(Date.now() + SESSION_DURATION_MS),
  );
}

export async function clearLoginExpiry(): Promise<void> {
  await AsyncStorage.removeItem(LOGIN_EXPIRES_AT_KEY);
}

async function hasLoginExpiry(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(LOGIN_EXPIRES_AT_KEY);
  return raw !== null;
}

export async function isLoginExpired(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(LOGIN_EXPIRES_AT_KEY);
  if (!raw) return false;
  return Date.now() > Number(raw);
}

/** Returns true when a non-expired Supabase session exists. */
export async function hasValidSession(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return false;

  if (!(await hasLoginExpiry())) {
    await persistLoginExpiry();
    return true;
  }

  if (await isLoginExpired()) {
    await signOut();
    return false;
  }

  return true;
}

export async function signOut(): Promise<void> {
  await clearLoginExpiry();
  await supabase.auth.signOut();
}
