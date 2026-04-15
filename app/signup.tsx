import { BorderRadius, Spacing } from '@/constants/theme';
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Text style={[Typography.brand, { color: colors.greenlightBrand }]}>Greenlight</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.white,
                  color: colors.textPrimary,
                  borderColor: colors.borderLight,
                },
              ]}
              placeholder="Name"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.white,
                  color: colors.textPrimary,
                  borderColor: colors.borderLight,
                },
              ]}
              placeholder="Email"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.white,
                  color: colors.textPrimary,
                  borderColor: colors.borderLight,
                },
              ]}
              placeholder="Phone"
              placeholderTextColor={colors.textTertiary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.white,
                  color: colors.textPrimary,
                  borderColor: colors.borderLight,
                },
              ]}
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Pressable
              style={[styles.continueButton, { backgroundColor: colors.greenlightBrand }]}
              onPress={handleContinue}>
              <Text style={[Typography.button, styles.continueButtonText]}>Continue</Text>
            </Pressable>

            <Text style={[Typography.small, styles.terms, { color: colors.textSecondary }]}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.borderLight }]} />
            <Text style={[Typography.body, styles.orText, { color: colors.textTertiary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.borderLight }]} />
          </View>

          {/* Social login */}
          <View style={styles.socialRow}>
            <Pressable
              style={[styles.socialButton, { backgroundColor: colors.white, borderColor: colors.borderLight }]}
              onPress={() => {}}>
              <Text style={[Typography.bodyMedium, { color: colors.textPrimary }]}>Apple</Text>
            </Pressable>
            <Pressable
              style={[styles.socialButton, { backgroundColor: colors.white, borderColor: colors.borderLight }]}
              onPress={() => {}}>
              <Text style={[Typography.bodyMedium, { color: colors.textPrimary }]}>Google</Text>
            </Pressable>
          </View>

          {/* Login link */}
          <View style={styles.footer}>
            <Text style={[Typography.body, { color: colors.textSecondary }]}>Already have an account? </Text>
            <Pressable onPress={() => router.push('/login' as Href)} hitSlop={8}>
              <Text style={[Typography.bodyMedium, { color: colors.greenlightBrand }]}>Log in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    paddingTop: 60,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    alignSelf: 'center',
    marginBottom: Spacing.xxl,
  },
  form: {
    gap: Spacing.lg,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.xl,
    ...Typography.body,
  },
  continueButton: {
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  continueButtonText: {
    color: '#FFFFFF',
  },
  terms: {
    textAlign: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: Spacing.lg,
  },
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
  },
});
