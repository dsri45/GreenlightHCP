import { Spacing } from '@/constants/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SwipeableStock } from './SwipeableStock';
import { StockProps } from './Stock';

export interface StockData extends StockProps {
  id?: string;
}

interface StockListProps {
  stocks: StockData[];
  onDelete?: (stock: StockData) => void;
  onAdd?: (stock: StockData) => void;
  onStarPress?: (stock: StockData) => void;
}

/**
 * Reusable component that displays a list of swipeable stocks.
 * Accepts an array of stock data and renders them with swipe actions.
 */
export function StockList({ stocks, onDelete, onAdd, onStarPress }: StockListProps) {
  return (
    <View style={styles.container}>
      {stocks.map((stock, index) => (
        <SwipeableStock
          key={stock.id || `${stock.symbol}-${index}`}
          symbol={stock.symbol}
          shares={stock.shares}
          pricePerShare={stock.pricePerShare}
          logo={stock.logo}
          isPositive={stock.isPositive}
          isStarred={stock.isStarred}
          onStarPress={onStarPress ? () => onStarPress?.(stock) : undefined}
          onDelete={onDelete ? () => onDelete?.(stock) : undefined}
          onAdd={onAdd ? () => onAdd?.(stock) : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
});

