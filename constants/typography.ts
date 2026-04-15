import { StyleSheet } from 'react-native';

/**
 * Typography styles for consistent text styling throughout the application.
 * All styles use the Inter font family to match the design system.
 */
export const Typography = StyleSheet.create({
  // Headers
  h1: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.02,
  },
  // Page title (used for tab page titles like "Portfolio", "Watchlist")
  pageTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.02,
  },
  // Section titles
  sectionTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
  },
  // Body text
  body: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
  },
  // Body text - medium weight
  bodyMedium: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
  },
  // Small text (axis labels, etc.)
  small: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 14,
  },
  // Button text
  button: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
  },
  // Brand text (Greenlight)
  brand: {
    fontFamily: 'Gasoek One',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 32,
    lineHeight: 48,
    letterSpacing: -0.01,
  },
});

