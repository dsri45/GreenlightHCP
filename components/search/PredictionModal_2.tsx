import { BorderRadius, Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import { StockPrediction } from '@/services/claude-prediction';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface PredictionModalProps {
  visible: boolean;
  loading: boolean;
  error: string | null;
  prediction: StockPrediction | null;
  onClose: () => void;
  onPickPress?: (symbol: string) => void;
}

export function PredictionModal({
  visible,
  loading,
  error,
  prediction,
  onClose,
  onPickPress,
}: PredictionModalProps) {
  const colors = usePortfolioColors();

  const recommendationLabel =
    prediction?.recommendation === 'buy'
      ? 'Buy'
      : prediction?.recommendation === 'avoid'
        ? 'Do not buy'
        : 'Hold / Wait';

  const recommendationColor =
    prediction?.recommendation === 'buy'
      ? colors.primaryGreen
      : prediction?.recommendation === 'avoid'
        ? colors.errorRed
        : colors.textSecondary;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.background, borderColor: colors.tint }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.headerRow}>
            <Text style={[Typography.bodyMedium, { color: colors.textPrimary }]}>AI Prediction</Text>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.85}
              style={[styles.closeButton, { backgroundColor: colors.primaryGreen }]}
            >
              <Text style={[Typography.small, { color: colors.white }]}>Close</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primaryGreen} />
              <Text style={[Typography.small, { color: colors.textSecondary, marginTop: Spacing.md }]}>
                Analyzing recent headlines...
              </Text>
            </View>
          )}

          {!loading && error && (
            <Text style={[Typography.small, { color: colors.errorRed, marginTop: Spacing.md }]}>{error}</Text>
          )}

          {!loading && !error && prediction && (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[Typography.bodyMedium, { color: colors.textPrimary }]}>
                {prediction.companyName} ({prediction.symbol})
              </Text>

              <View style={[styles.badge, { backgroundColor: `${recommendationColor}22` }]}>
                <Text style={[Typography.bodyMedium, { color: recommendationColor }]}>
                  {recommendationLabel}
                </Text>
              </View>

              <Text style={[Typography.body, { color: colors.textPrimary, marginTop: Spacing.md }]}>
                {prediction.summary}
              </Text>

              <Text style={[Typography.small, { color: colors.textSecondary, marginTop: Spacing.md }]}>
                {prediction.reasoning}
              </Text>

              {prediction.recommendation === 'buy' && prediction.suggestedShares != null && (
                <Text style={[Typography.bodyMedium, { color: colors.primaryGreen, marginTop: Spacing.lg }]}>
                  Suggested starter position: {prediction.suggestedShares} share
                  {prediction.suggestedShares === 1 ? '' : 's'}
                </Text>
              )}

              {prediction.recommendation !== 'buy' && prediction.worthTracking != null && (
                <Text style={[Typography.bodyMedium, { color: colors.primaryGreen, marginTop: Spacing.lg }]}>
                  Worth tracking: {prediction.worthTracking ? 'Yes' : 'No'}
                </Text>
              )}

              <Text
                style={[
                  Typography.bodyMedium,
                  { color: colors.textPrimary, marginTop: Spacing.xl, marginBottom: Spacing.sm },
                ]}
              >
                Lesser-known peers in the same industry
              </Text>

              {prediction.industryPicks.map((pick) => (
                <TouchableOpacity
                  key={pick.symbol}
                  activeOpacity={0.75}
                  onPress={() => {
                    onPickPress?.(pick.symbol);
                    onClose();
                  }}
                  style={[styles.pickRow, { borderColor: colors.tint }]}
                >
                  <Text style={[Typography.bodyMedium, { color: colors.primaryGreen }]}>
                    {pick.symbol} · {pick.name}
                  </Text>
                  <Text style={[Typography.small, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
                    {pick.rationale}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={[Typography.small, { color: colors.textTertiary, marginTop: Spacing.lg }]}>
                For educational purposes only. Not financial advice.
              </Text>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    maxHeight: '82%',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  scroll: {
    marginTop: Spacing.md,
  },
  scrollContent: {
    paddingBottom: Spacing.md,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  pickRow: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
});
