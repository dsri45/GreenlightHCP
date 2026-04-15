import { Typography } from '@/constants/typography';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { BorderRadius, Spacing } from '@/constants/theme';

interface TimePeriodButtonProps {
  period: string;
  isSelected: boolean;
  onPress: () => void;
}

export function TimePeriodButton({ period, isSelected, onPress }: TimePeriodButtonProps) {
  const colors = usePortfolioColors();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isSelected && { backgroundColor: colors.timePeriodActive },
      ]}
      onPress={onPress}>
      <Text style={[Typography.button, { color: colors.textPrimary }]}>
        {period}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    minWidth: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

