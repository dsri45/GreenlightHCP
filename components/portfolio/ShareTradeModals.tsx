import { Spacing } from '@/constants/theme';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const GL = {
  green900: '#0A2E1A',
  green700: '#166534',
  green600: '#16A34A',
  green300: '#86EFAC',
  green200: '#BBF7D0',
  green100: '#DCFCE7',
  white: '#FFFFFF',
  dimGreen: '#6B9E7A',
};

function formatMoney(value: number, decimals = 2): string {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

interface BuySharesModalProps {
  visible: boolean;
  symbol: string;
  pricePerShare: number;
  cashAvailable: number;
  quantity: string;
  error: string | null;
  onQuantityChange: (value: string) => void;
  onBuy: () => void;
  onClose: () => void;
}

export function BuySharesModal({
  visible,
  symbol,
  pricePerShare,
  cashAvailable,
  quantity,
  error,
  onQuantityChange,
  onBuy,
  onClose,
}: BuySharesModalProps) {
  const parsedQuantity = parseInt(quantity, 10);
  const isValidQuantity = !Number.isNaN(parsedQuantity) && parsedQuantity > 0;
  const totalCost = isValidQuantity ? parsedQuantity * pricePerShare : 0;
  const canAfford = isValidQuantity && totalCost <= cashAvailable;
  const canBuy = isValidQuantity && canAfford;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>Buy {symbol}</Text>
          <Text style={styles.subtitle}>
            {formatMoney(cashAvailable, 0)} available · {formatMoney(pricePerShare)}/share
          </Text>

          <TextInput
            value={quantity}
            onChangeText={onQuantityChange}
            keyboardType="numeric"
            placeholder="Number of shares"
            placeholderTextColor={GL.green300}
            style={styles.input}
          />

          {isValidQuantity ? (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Total cost</Text>
              <Text style={[styles.summaryValue, !canAfford && styles.summaryValueError]}>
                {formatMoney(totalCost)}
              </Text>
              {!canAfford ? (
                <Text style={styles.summaryHint}>
                  Exceeds your available cash by {formatMoney(totalCost - cashAvailable)}
                </Text>
              ) : null}
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, styles.cancelButton]}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onBuy}
              style={[styles.button, styles.buyButton, !canBuy && styles.buttonDisabled]}
              activeOpacity={0.8}
              disabled={!canBuy}
            >
              <Text style={styles.buttonText}>Buy</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface SellSharesModalProps {
  visible: boolean;
  symbol: string;
  ownedShares: number;
  pricePerShare: number;
  quantity: string;
  error: string | null;
  onQuantityChange: (value: string) => void;
  onSell: () => void;
  onClose: () => void;
}

export function SellSharesModal({
  visible,
  symbol,
  ownedShares,
  pricePerShare,
  quantity,
  error,
  onQuantityChange,
  onSell,
  onClose,
}: SellSharesModalProps) {
  const parsedQuantity = parseInt(quantity, 10);
  const isValidQuantity = !Number.isNaN(parsedQuantity) && parsedQuantity > 0;
  const withinLimit = isValidQuantity && parsedQuantity <= ownedShares;
  const proceeds = withinLimit ? parsedQuantity * pricePerShare : 0;
  const remaining = withinLimit ? ownedShares - parsedQuantity : ownedShares;
  const canSell = withinLimit;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>Sell {symbol}</Text>
          <Text style={styles.subtitle}>
            You own {ownedShares} {ownedShares === 1 ? 'share' : 'shares'} ·{' '}
            {formatMoney(pricePerShare)}/share
          </Text>

          <TextInput
            value={quantity}
            onChangeText={onQuantityChange}
            keyboardType="numeric"
            placeholder="Number of shares"
            placeholderTextColor={GL.green300}
            style={styles.input}
          />

          {isValidQuantity ? (
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>You will receive</Text>
                <Text style={[styles.summaryValue, !withinLimit && styles.summaryValueError]}>
                  {withinLimit ? formatMoney(proceeds) : '—'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shares remaining</Text>
                <Text style={[styles.summaryValue, !withinLimit && styles.summaryValueError]}>
                  {withinLimit
                    ? `${remaining} ${remaining === 1 ? 'share' : 'shares'}`
                    : '—'}
                </Text>
              </View>
              {!withinLimit ? (
                <Text style={styles.summaryHint}>
                  You only have {ownedShares} {ownedShares === 1 ? 'share' : 'shares'} to sell
                </Text>
              ) : null}
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, styles.cancelButton]}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSell}
              style={[styles.button, styles.sellButton, !canSell && styles.buttonDisabled]}
              activeOpacity={0.8}
              disabled={!canSell}
            >
              <Text style={styles.buttonText}>Sell</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    backgroundColor: GL.white,
    borderRadius: 20,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: GL.green100,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: GL.green900,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: GL.dimGreen,
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: GL.green200,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: GL.green900,
    marginBottom: Spacing.sm,
  },
  summaryBox: {
    backgroundColor: GL.green100,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: GL.dimGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: GL.green700,
  },
  summaryValueError: {
    color: '#B91C1C',
  },
  summaryHint: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
  },
  error: {
    color: '#B91C1C',
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.sm,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  cancelButton: {
    backgroundColor: GL.green100,
  },
  cancelButtonText: {
    color: GL.green900,
    fontWeight: '700',
  },
  buyButton: {
    backgroundColor: GL.green600,
  },
  sellButton: {
    backgroundColor: '#DC2626',
  },
  buttonText: {
    color: GL.white,
    fontWeight: '700',
  },
});
