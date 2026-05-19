import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PortfolioHoldingsProvider } from '@/hooks/use-portfolio-holdings';
import { WatchlistProvider } from '@/hooks/use-watchlist';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <PortfolioHoldingsProvider>
      <WatchlistProvider>
        <Tabs
          screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            //display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
          },
          tabBarItemStyle: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 15,
          },
          tabBarLabelStyle: {
            fontWeight: '400',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
          }}
        />
        <Tabs.Screen
          name="watchlist"
          options={{
            title: 'Watchlist',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="eye.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="portfolio"
          options={{
            title: 'Portfolio',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="account-balance-wallet" color={color} />,
          }}
        />
      </Tabs>
      </WatchlistProvider>
    </PortfolioHoldingsProvider>
  );
}
