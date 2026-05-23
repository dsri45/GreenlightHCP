import { Spacing } from '@/constants/theme';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { StockProps } from './Stock';

// ─── Greenlight brand palette ─────────────────────────────────────────────────
const GL = {
  green900: '#0A2E1A',
  green800: '#0F4526',
  green700: '#166534',
  green600: '#16A34A',
  green500: '#22C55E',
  green400: '#4ADE80',
  green300: '#86EFAC',
  green200: '#BBF7D0',
  green100: '#DCFCE7',
  green50:  '#F0FDF4',
  white:    '#FFFFFF',
  dimGreen: '#6B9E7A',
};

interface SwipeableStockProps extends StockProps {
  onDelete?: () => void;
  onAdd?: () => void;
  onPress?: () => void;
}

export function SwipeableStock({
  symbol,
  shares,
  pricePerShare,
  logo,
  isPositive = true,
  isStarred = false,
  isOwned = false,
  onStarPress,
  onSellPress,
  onDelete,
  onAdd,
  onPress,
}: SwipeableStockProps) {
  const colors = usePortfolioColors();

  const renderRightActions = () => (
    <View style={styles.rightActions}>
      <TouchableOpacity
        style={[styles.actionButton, styles.addButton]}
        onPress={onAdd}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add-circle" size={20} color={GL.white} />
        <Text style={styles.actionLabel}>Add</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, styles.deleteButton]}
        onPress={onDelete}
        activeOpacity={0.8}
      >
        <MaterialIcons name="delete" size={20} color={GL.white} />
        <Text style={styles.actionLabel}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.75}
          disabled={!onPress}
          style={styles.touchable}
        >
          <View style={styles.container}>

          {/* Logo */}
          <View style={styles.logoWrapper}>
            <Image source={logo} style={styles.logo} />
          </View>

          {/* Symbol + price */}
          <View style={styles.content}>
            <Text style={[styles.symbol, { color: isPositive ? GL.green700 : colors.errorRed }]}>
              {symbol}
            </Text>
            <Text style={styles.meta}>
              {shares} {shares === 1 ? 'share' : 'shares'} · {pricePerShare}/share
            </Text>
          </View>

          {/* Indicator pill */}
          <View
            style={[
              styles.indicatorPill,
              { backgroundColor: isPositive ? GL.green100 : '#FEE2E2' },
            ]}
          >
            <View
              style={[
                styles.indicatorDot,
                { backgroundColor: isPositive ? GL.green500 : colors.errorRed },
              ]}
            />
            <Text
              style={[
                styles.indicatorText,
                { color: isPositive ? GL.green700 : colors.errorRed },
              ]}
            >
              {isPositive ? 'Gain' : 'Loss'}
            </Text>
          </View>

          {/* Star or sell */}
          {isOwned && onSellPress ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onSellPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="delete-outline" size={22} color="#DC2626" />
            </TouchableOpacity>
          ) : null}

          {!isOwned && onStarPress != null ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onStarPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={isStarred ? 'star' : 'star-border'}
                size={22}
                color={isStarred ? GL.green500 : GL.green200}
              />
            </TouchableOpacity>
          ) : null}

          </View>
        </TouchableOpacity>
      </Swipeable>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    width: '100%',
  },

  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: GL.green100,
    backgroundColor: 'transparent',
  },

  // Logo
  logoWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: GL.green50,
    borderWidth: 1,
    borderColor: GL.green200,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },

  // Text
  content: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  symbol: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 12,
    color: GL.dimGreen,
    fontWeight: '400',
  },

  // Indicator pill
  indicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    flexShrink: 0,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  touchable: {
    width: '100%',
  },

  // Action icon
  actionButton: {
    padding: Spacing.sm,
    flexShrink: 0,
  },

  // Swipe actions
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    gap: 6,
  },
  actionButton: {
    width: 64,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    gap: 4,
  },
  addButton: {
    backgroundColor: GL.green600,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: GL.white,
    letterSpacing: 0.3,
  },
});