import { Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import { signOut } from '@/lib/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TabScreenLayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

/**
 * Shared layout component for all tab screens.
 * Includes the Greenlight brand header and optional page title.
 */
export function TabScreenLayout({ children, pageTitle }: TabScreenLayoutProps) {
  const colors = usePortfolioColors();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={[]}>
      <View style={styles.header}>
        <View style={styles.headerBar}>
          <Pressable
            style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
            onPress={handleLogout}
            accessibilityLabel="Log out"
            hitSlop={8}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.greenlightBrand} />
          </Pressable>
          <View style={styles.brandContainer} pointerEvents="none">
            <Text style={[Typography.brand, styles.brandText, { color: colors.greenlightBrand }]}>
              Greenlight
            </Text>
          </View>
        </View>
        {pageTitle ? (
          <View style={styles.pageTitleContainer}>
            <Text style={[Typography.pageTitle, { color: colors.textPrimary }]}>{pageTitle}</Text>
          </View>
        ) : null}
      </View>

      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    paddingTop: 30,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  logoutButton: {
    position: 'absolute',
    left: 0,
    padding: Spacing.xs,
    zIndex: 1,
  },
  logoutButtonPressed: {
    opacity: 0.6,
  },
  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    textAlign: 'center',
  },
  pageTitleContainer: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
});
