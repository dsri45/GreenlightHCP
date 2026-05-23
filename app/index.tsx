import { hasValidSession } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true);
      return;
    }

    hasValidSession().then((valid) => {
      setHasSession(valid);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (hasSession) {
    return <Redirect href="/(tabs)/portfolio" />;
  }

  return <Redirect href="/signup" />;
}
