import { AntDesign } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const GL = {
  green900: '#0A2E1A',
  green50: '#F0FDF4',
  green200: '#BBF7D0',
  white: '#FFFFFF',
};

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function GoogleSignInButton({
  onPress,
  loading = false,
  disabled = false,
}: GoogleSignInButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        (pressed || loading) && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={GL.green900} />
      ) : (
        <View style={styles.content}>
          <AntDesign name="google" size={18} color={GL.green900} />
          <Text style={styles.label}>Continue with Google</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GL.green200,
    backgroundColor: GL.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: GL.green50,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: GL.green900,
    letterSpacing: 0.1,
  },
});
