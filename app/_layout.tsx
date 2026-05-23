import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStocksBootstrap } from '@/hooks/use-stocks-bootstrap';
import { completeAuthFromUrl, isAuthRedirectUrl } from '@/lib/auth-session';
import { GasoekOne_400Regular } from '@expo-google-fonts/gasoek-one';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useStocksBootstrap();
  const [fontsLoaded, fontError] = useFonts({
    'Gasoek One': GasoekOne_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const handleAuthUrl = (url: string) => {
      if (!isAuthRedirectUrl(url)) return;

      completeAuthFromUrl(url)
        .then((session) => {
          if (session) router.replace('/(tabs)/portfolio');
        })
        .catch(() => undefined);
    };

    const subscription = Linking.addEventListener('url', ({ url }) => handleAuthUrl(url));
    Linking.getInitialURL().then((url) => {
      if (url) handleAuthUrl(url);
    });

    return () => subscription.remove();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="index">
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
