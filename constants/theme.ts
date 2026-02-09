/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#188343';
const tintColorDark = '#2DFF54';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ECFFEA',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primaryGreen: '#188343',
    secondaryGreen: '#2DFF54',
    errorRed: '#D52020',
    stockCardBackground: '#F38989',
    white: '#FFFFFF',
    black: '#000000',
    textPrimary: '#000000',
    textSecondary: 'rgba(0, 0, 0, 0.5)',
    textTertiary: '#828282',
    borderLight: '#E0E0E0',
    borderGrid: 'rgba(230, 230, 230, 0.5)',
    borderGridSolid: '#E6E6E6',
    tabBarBackground: '#69B788',
    chartGradientStart: 'rgba(45, 255, 101, 0.15)',
    chartGradientEnd: 'rgba(45, 255, 101, 0)',
    timePeriodActive: 'rgba(134, 190, 109, 0.64)',
    dotGlow: 'rgba(59, 255, 45, 0.1)',
    greenlightBrand: '#188343',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0F2E1A',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primaryGreen: '#2DFF54',
    secondaryGreen: '#188343',
    errorRed: '#FF6B6B',
    stockCardBackground: '#F38989',
    white: '#FFFFFF',
    black: '#000000',
    textPrimary: '#ECEDEE',
    textSecondary: 'rgba(236, 237, 238, 0.5)',
    textTertiary: '#9BA1A6',
    borderLight: '#2C2C2E',
    borderGrid: 'rgba(230, 230, 230, 0.2)',
    borderGridSolid: '#2C2C2E',
    tabBarBackground: '#69B788',
    chartGradientStart: 'rgba(45, 255, 101, 0.15)',
    chartGradientEnd: 'rgba(45, 255, 101, 0)',
    timePeriodActive: 'rgba(134, 190, 109, 0.64)',
    dotGlow: 'rgba(59, 255, 45, 0.1)',
    greenlightBrand: '#2DFF54',
  },
};

/**
 * Font family definitions for different platforms.
 * Uses Inter as the primary sans-serif font to match the design system.
 */
export const Fonts = Platform.select({
  ios: {
    sans: 'Inter',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Inter',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

/**
 * Spacing scale for consistent spacing throughout the application.
 * Values are in pixels and follow a 2px base unit system.
 */
export const Spacing = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
};

/**
 * Border radius scale for consistent rounded corners throughout the application.
 * Values are in pixels.
 */
export const BorderRadius = {
  sm: 8,
  md: 10,
  lg: 26,
  xl: 32,
  full: 100,
};