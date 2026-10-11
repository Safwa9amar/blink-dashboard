// Blink Design System - Color Tokens
// Light-theme values (the default); keep in sync with src/app/globals.css.
// Matches the mobile app's theme from /blink/constants/theme.ts

export const colors = {
  primary: "#EE335F",
  primaryHover: "#D92B53",

  background: "#F6F7F9",
  card: "#FFFFFF",
  cardHover: "#F9FAFB",
  iconBg: "#F1F5F9",

  text: "#0F172A",
  subtext: "#64748B",
  border: "#E6E8EC",
  lightGrey: "#2C2C2C",
  muted: "#F1F5F9",
  mutedBorder: "#333333",

  // Soft pink accents
  softPink: "#FFF1F2",
  softBorder: "#FECDD3",

  // Accent colors
  accentPink: "#FF2D55",
  accentYellow: "#FFCC00",
  accentBlue: "#4A90E2",
  accentGreen: "#4CD964",

  // Status colors
  success: "#059669",
  successLight: "#ECFDF5",
  danger: "#DC2626",
  dangerLight: "#FEF2F2",
  info: "#2563EB",
  infoLight: "#EFF6FF",
  warning: "#B45309",
  warningLight: "#FFFBEB",

  // Shell rail
  rail: "#0F172A",
  railText: "#94A3B8",
  railActive: "#FFFFFF",

  // Deep tones
  charcoal: "#2D3436",
  deepCharcoal: "#101827",
  slate: "#232624",
} as const;
