import { BorderRadius, Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { StockProps } from './Stock';

interface SwipeableStockProps extends StockProps {
  onDelete?: () => void;
  onAdd?: () => void;
}

export function SwipeableStock({ symbol, shares, pricePerShare, logo, isPositive = true, onDelete, onAdd }: SwipeableStockProps) {
  const colors = usePortfolioColors();

  const renderRightActions = () => {
    return (
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.addButton, { backgroundColor: colors.primaryGreen }]}
          onPress={onAdd}>
          <MaterialIcons name="add-circle" size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton, { backgroundColor: colors.errorRed }]}
          onPress={onDelete}>
          <MaterialIcons name="delete" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <GestureHandlerRootView>
      <Swipeable renderRightActions={renderRightActions}>
        <View style={styles.container}>
          <Image source={logo} style={styles.logo} />
          <View style={styles.content}>
            <View style={styles.textContainer}>
              <Text style={[Typography.bodyMedium, { color: colors.textPrimary }]}>
                {symbol} {shares} shares
              </Text>
              <Text style={[Typography.body, { color: colors.textSecondary }]}>{pricePerShare}/share</Text>
            </View>
          </View>
        </View>
      </Swipeable>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 360,
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  textContainer: {
    gap: Spacing.xs,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 60,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.xs,
  },
  addButton: {
    marginRight: Spacing.xs,
  },
  deleteButton: {},
});

