import { completeAuthFromUrl, isAuthRedirectUrl } from '@/lib/auth-session';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

/** Handles email verification + OAuth redirects at `greenlight://auth/callback`. */
export default function AuthCallbackScreen() {
  const url = Linking.useURL();

  useEffect(() => {
    if (!url || !isAuthRedirectUrl(url)) return;

    let cancelled = false;

    completeAuthFromUrl(url)
      .then(() => {
        if (!cancelled) router.replace('/(tabs)/portfolio');
      })
      .catch(() => {
        if (!cancelled) router.replace('/login');
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}
