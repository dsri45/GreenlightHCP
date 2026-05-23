import { Spacing } from '@/constants/theme';
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

// Greenlight palette (same as Portfolio screen)
const GL = {
  green500: '#22C55E',
  green400: '#4ADE80',
  green300: '#86EFAC',
  green200: '#BBF7D0',
  green100: '#DCFCE7',
  green50:  '#F0FDF4',
  green900: '#0A2E1A',
  white: '#FFFFFF',
  dimGreen: '#6B9E7A',
};

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
      ? GL.green600
      : prediction?.recommendation === 'avoid'
        ? colors.errorRed
        : GL.green900;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: GL.white,
              borderColor: GL.green200,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerPip} />
              <Text style={styles.headerTitle}>AI Prediction</Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.85}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          {/* Loading */}
          {loading && (
            <View style={styles.centered}>
              <ActivityIndicator color={GL.green500} />
              <Text style={[Typography.small, { color: colors.textSecondary, marginTop: Spacing.md }]}>
                Analyzing recent headlines...
              </Text>
            </View>
          )}

          {/* Error */}
          {!loading && error && (
            <Text style={[styles.errorText]}>{error}</Text>
          )}

          {/* Content */}
          {!loading && !error && prediction && (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Company */}
              <Text style={styles.companyTitle}>
                {prediction.companyName} ({prediction.symbol})
              </Text>

              {/* Recommendation Badge */}
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: `${recommendationColor}15`,
                    borderColor: recommendationColor,
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: recommendationColor }]}>
                  {recommendationLabel}
                </Text>
              </View>

              {/* Summary */}
              <Text style={styles.summaryText}>
                {prediction.summary}
              </Text>

              {/* Reasoning */}
              <Text style={styles.reasoningText}>
                {prediction.reasoning}
              </Text>

              {/* Suggested Shares / Worth Tracking */}
              {prediction.recommendation === 'buy' &&
                prediction.suggestedShares != null && (
                  <Text style={styles.highlightText}>
                    Suggested starter position: {prediction.suggestedShares} share
                    {prediction.suggestedShares === 1 ? '' : 's'}
                  </Text>
                )}

              {prediction.recommendation !== 'buy' &&
                prediction.worthTracking != null && (
                  <Text style={styles.highlightText}>
                    Worth tracking: {prediction.worthTracking ? 'Yes' : 'No'}
                  </Text>
                )}

              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionPip} />
                <Text style={styles.sectionTitle}>Lesser-known peers in the same industry</Text>
              </View>

              {/* Industry Picks */}
              {prediction.industryPicks.map((pick) => (
                <TouchableOpacity
                  key={pick.symbol}
                  activeOpacity={0.75}
                  onPress={() => {
                    onPickPress?.(pick.symbol);
                    onClose();
                  }}
                  style={[
                    styles.pickRow,
                    {
                      backgroundColor: GL.green50,
                      borderColor: GL.green200,
                    },
                  ]}
                >
                  <Text style={styles.pickTitle}>
                    {pick.symbol} · {pick.name}
                  </Text>
                  <Text style={styles.pickReason}>
                    {pick.rationale}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Disclaimer */}
              <Text style={styles.disclaimer}>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },

  card: {
    maxHeight: '85%',
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerPip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GL.green500,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: GL.green400,
  },

  closeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: GL.green500,
  },
  closeText: {
    color: GL.white,
    fontSize: 12,
    fontWeight: '600',
  },

  centered: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },

  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontSize: 13,
  },

  scroll: {
    marginTop: Spacing.sm,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },

  companyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GL.green900,
  },

  badge: {
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },

  summaryText: {
    marginTop: Spacing.lg,
    fontSize: 14,
    lineHeight: 22,
    color: GL.green900,
  },

  reasoningText: {
    marginTop: Spacing.md,
    fontSize: 13,
    lineHeight: 20,
    color: GL.dimGreen,
  },

  highlightText: {
    marginTop: Spacing.xl,
    fontSize: 14,
    fontWeight: '600',
    color: GL.green600,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.sm,
  },
  sectionPip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GL.green500,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: GL.green400,
  },

  pickRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  pickTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: GL.green700,
  },
  pickReason: {
    marginTop: 4,
    fontSize: 12,
    color: GL.dimGreen,
  },

  disclaimer: {
    marginTop: Spacing.xl,
    fontSize: 11,
    color: GL.dimGreen,
    textAlign: 'center',
  },
});
