import { BorderRadius, Spacing } from '@/constants/theme';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Stock X',
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  const colors = usePortfolioColors();

  return (
    <View style={[styles.container, { borderColor: colors.tint, backgroundColor: colors.background }]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={[styles.input, { color: colors.textPrimary }]}
        autoCapitalize="characters"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  input: {
    fontSize: 16,
  },
});