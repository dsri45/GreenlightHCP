import { Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import { Href, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export default function SignupScreen() {
  const colors = usePortfolioColors();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleContinue = () => {
    router.replace('/(tabs)/portfolio');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={[]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Brand header ──────────────────────────────────────────────── 
          <View style={styles.header}>
            {/* Pip accent above brand name 
            <View style={styles.headerPipRow}>
              <View style={styles.headerPip} />
            </View>
            <Text style={[Typography.brand, styles.brandName]}>Greenlight</Text>
            <Text style={styles.brandTagline}>Your portfolio, illuminated.</Text>
          </View>*/}

        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <Text style={[Typography.brand, styles.brandText, { color: colors.greenlightBrand }]}>Greenlight</Text>
            <Text style={styles.brandTagline}>Your portfolio, illuminated.</Text>
          </View>
        </View>

          {/* ── Form tile ─────────────────────────────────────────────────── */}
          <View style={styles.formTile}>

            <View style={styles.formTileLabel}>
              <View style={styles.sectionPip} />
              <Text style={styles.sectionTitle}>Create account</Text>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={[styles.input, { color: colors.black }]}
                  placeholder="Your full name"
                  placeholderTextColor={GL.dimGreen}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputDivider} />

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={[styles.input, { color: colors.black }]}
                  placeholder="you@example.com"
                  placeholderTextColor={GL.dimGreen}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputDivider} />

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={[styles.input, { color: colors.black }]}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={GL.dimGreen}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputDivider} />

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={[styles.input, { color: colors.black }]}
                  placeholder="Min. 8 characters"
                  placeholderTextColor={GL.dimGreen}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* CTA button */}
            <Pressable
              style={({ pressed }) => [styles.continueButton, pressed && styles.continueButtonPressed]}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </Pressable>

            <Text style={styles.terms}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>

          {/* ── Divider ───────────────────────────────────────────────────── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Social login ──────────────────────────────────────────────── */}
          <View style={styles.socialRow}>
            <Pressable
              style={({ pressed }) => [styles.socialButton, pressed && styles.socialButtonPressed]}
              onPress={() => {}}
            >
              <Text style={styles.socialButtonText}>Apple</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.socialButton, pressed && styles.socialButtonPressed]}
              onPress={() => {}}
            >
              <Text style={styles.socialButtonText}>Google</Text>
            </Pressable>
          </View>

          {/* ── Login link ────────────────────────────────────────────────── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => router.push('/login' as Href)} hitSlop={8}>
              <Text style={styles.footerLink}>Log in</Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 52,
    paddingBottom: Spacing.xxxl,
    gap: 0,
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    width: '100%',
    paddingTop: 30,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  brandContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  brandText: {
    textAlign: 'center',
  },
  pageTitleContainer: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  headerPipRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerPip: {
    width: 32,
    height: 4,
    borderRadius: 999,
    backgroundColor: GL.green500,
  },
  brandName: {
    color: GL.green700,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 6,
  },
  brandTagline: {
    fontSize: 14,
    color: GL.dimGreen,
    fontWeight: '400',
    letterSpacing: 0.2,
  },

  // ── Form tile ─────────────────────────────────────────────────────────────
  formTile: {
    backgroundColor: GL.green50,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GL.green200,
    padding: 20,
    gap: 0,
  },
  formTileLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
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
    color: GL.green800,
  },

  // Stacked input group inside tile
  inputGroup: {
    backgroundColor: GL.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GL.green200,
    overflow: 'hidden',
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: GL.green800,
    width: 68,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
  },
  inputDivider: {
    height: 1,
    backgroundColor: GL.green100,
    marginHorizontal: 16,
  },

  // CTA
  continueButton: {
    backgroundColor: GL.green600,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  continueButtonPressed: {
    backgroundColor: GL.green700,
  },
  continueButtonText: {
    color: GL.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  terms: {
    fontSize: 12,
    color: GL.dimGreen,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: Spacing.lg,
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: GL.green200,
  },
  orText: {
    marginHorizontal: 14,
    fontSize: 13,
    color: GL.dimGreen,
    fontWeight: '500',
  },

  // ── Social buttons ────────────────────────────────────────────────────────
  socialRow: {
    flexDirection: 'row',
    gap: 10,
  },
  socialButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GL.green200,
    backgroundColor: GL.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonPressed: {
    backgroundColor: GL.green50,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: GL.green900,
    letterSpacing: 0.1,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
    color: GL.dimGreen,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: GL.green600,
  },
});