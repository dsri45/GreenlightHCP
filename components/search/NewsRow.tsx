import { BorderRadius, Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import React from 'react';
import { ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DEFAULT_NEWS_LOGO = require('@/assets/images/icon.png');

export function NewsRow({
  title,
  ageLabel,
  logo = DEFAULT_NEWS_LOGO,
  onPress,
}: {
  title: string;
  ageLabel: string;
  logo?: ImageSourcePropType;
  onPress: () => void;
}) {
  const colors = usePortfolioColors();

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={[styles.logoWrapper, { backgroundColor: colors.white, borderColor: colors.borderLight }]}>
          <Image source={logo} style={styles.logo} contentFit="contain" />
        </View>
        <View style={styles.textBlock}>
          <Text style={[Typography.bodyMedium, { color: colors.textPrimary }]} numberOfLines={2}>
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
        <MaterialIcons name="open-in-new" size={14} color="#fff" />
        <Text style={[Typography.small, styles.buttonText]}>View</Text>
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
    minWidth: 0,
  },
  logoWrapper: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  logo: {
    width: 26,
    height: 26,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    flexShrink: 0,
  },
  buttonText: {
    color: '#fff',
  },
});
