import { BorderRadius, Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function NewsRow({
  title,
  ageLabel,
  logo,
  onPress,
}: {
  title: string;
  ageLabel: string; // "1d", "2d", etc
  logo: any;
  onPress: () => void;
}) {
  const colors = usePortfolioColors();

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Image source={logo} style={styles.logo} />
        <View style={{ flex: 1 }}>
          <Text style={[Typography.bodyMedium, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[Typography.small, { color: colors.textTertiary }]}>{ageLabel}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.button, { backgroundColor: colors.tint }]}
      >
        <Text style={[Typography.small, { color: '#fff' }]}>View</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    marginRight: Spacing.md,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
});