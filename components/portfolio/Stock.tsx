import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
  green50: '#F0FDF4',
  white: '#FFFFFF',
  dimGreen: '#6B9E7A',
};

export interface StockProps {
  symbol: string;
  shares: number;
  pricePerShare: string;
  logo: ImageSourcePropType;
  isPositive?: boolean;
  isStarred?: boolean;
  isOwned?: boolean;
  onStarPress?: () => void;
  onSellPress?: () => void;
  onPress?: () => void;
  currentPrice?: number;
  yearlyChangePct?: number;
}

export function Stock({
  symbol,
  shares,
  pricePerShare,
  logo,
  isPositive = true,
  isStarred = false,
  isOwned = false,
  onStarPress,
  onSellPress,
  onPress,
}: StockProps) {
  const colors = usePortfolioColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.72}
      disabled={!onPress}
      style={styles.touchable}
    >
      <View style={styles.container}>
        {/* Left: logo */}
        <View style={styles.logoWrapper}>
          <Image source={logo} style={styles.logo} />
        </View>

        {/* Center: symbol + price */}
        <View style={styles.content}>
          <Text style={[styles.symbol, { color: isPositive ? GL.green700 : colors.errorRed }]}>
            {symbol}
          </Text>
          <Text style={styles.shares}>
            {shares} {shares === 1 ? 'share' : 'shares'} · {pricePerShare}/share
          </Text>
        </View>

        {/* Right: indicator + star */}
        <View style={styles.rightSection}>
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

          {isOwned && onSellPress ? (
            <TouchableOpacity
              onPress={onSellPress}
              hitSlop={8}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <MaterialIcons name="delete-outline" size={22} color={colors.errorRed} />
            </TouchableOpacity>
          ) : null}

          {!isOwned && onStarPress ? (
            <TouchableOpacity
              onPress={onStarPress}
              hitSlop={8}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.starGlyph, { color: isStarred ? GL.green500 : GL.green200 }]}>
                {isStarred ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: GL.green100,
  },

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
  shares: {
    fontSize: 12,
    color: GL.dimGreen,
    fontWeight: '400',
  },

  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  indicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
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
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  starGlyph: {
    fontSize: 18,
    lineHeight: 22,
  },
});
