import { Typography } from '@/constants/typography';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

interface AxisLabelProps {
  label: string;
  top?: number;
  left?: number;
}

export function AxisLabel({ label, top, left }: AxisLabelProps) {
  const colors = usePortfolioColors();

  return (
    <Text
      style={[
        Typography.small,
        styles.label,
        { color: colors.textTertiary },
        top !== undefined && { top },
        left !== undefined && { left },
      ]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
  },
});

