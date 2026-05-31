/**
 * Blink Design System — single source of truth for color, type, radii, shadows,
 * spacing, and brand gradients. Values reverse-engineered from `Blink UI_UX.fig`
 * and the Blink DS spec (`.design-system-extract/colors_and_type.css`).
 *
 * Currency throughout the app is DZD ("Da").
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

/* ==========================================================================
   BRAND PALETTE (raw tokens — most-used color in the file: blink-500, 2,723×)
   ========================================================================== */
export const BlinkPalette = {
  // Brand raspberry
  blink300: '#FF6C90', // header gradient start
  blink400: '#FF5E84', // lighter — gradient top, glows
  blink500: '#EE335F', // PRIMARY — buttons, active states, brand
  blink600: '#DE2555', // pressed / deeper hero fills
  blink700: '#B9003F', // darkest crimson — agent hero gradient

  // iOS accent red (secondary)
  iosRed: '#FF2D55',

  // Brand tints — pale pink surfaces, news/info cards, icon halos
  tint50: '#FFF1F2',  // lightest wash (active nav pill)
  tint100: '#FFE1E3', // soft pink card
  tint150: '#FFF0F3', // warm pale surface
  tint200: '#FDE8EE', // icon halo behind glyphs
  tint300: '#FBC9D6', // blob decoration on deal banners

  // Warm text used on pink-tint surfaces
  warm900: '#271719',
  warm700: '#8F6F72',
  warm600: '#5B4042',
  crimson900: '#63001E',

  // Slate scale — primary neutral ramp
  slate900: '#0F172A',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',

  // Gray scale — appears alongside slate in app chrome
  gray900: '#111827',
  gray700: '#374151',
  gray600: '#4B5563',
  gray500: '#6B7280',
  gray400: '#9CA3AF', // inactive nav icon + label
  gray300: '#D1D5DB', // card borders
  gray200: '#E5E7EB',
  gray100: '#F3F4F6', // glass navbar fill base
  gray50: '#F9FAFB',  // CUSTOMER app page background

  // Warm gray — Agent app surface
  warmBg: '#F8F6F6',

  // Semantic
  success: '#16A34A',
  successBg: '#D9F7E3',
  credit: '#00657B',
  creditBg: '#D8EEF2',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#2563EB',
};

export const Colors = {
  light: {
    // Brand
    primary: BlinkPalette.blink500,
    primaryDark: BlinkPalette.blink600,
    primaryDeep: BlinkPalette.blink700,
    primaryLight: BlinkPalette.blink400,

    // Text
    text: BlinkPalette.slate900,
    subtext: BlinkPalette.slate500,
    textStrong: BlinkPalette.slate700,
    textMuted: BlinkPalette.slate400,

    // Surfaces
    background: BlinkPalette.gray50,        // customer app
    backgroundWarm: BlinkPalette.warmBg,    // agent app
    cardBackground: '#FFFFFF',
    iconBackground: '#FFFFFF',
    mutedBackground: BlinkPalette.slate50,
    mutedBorder: BlinkPalette.gray200,

    // Soft pink surfaces
    softCard: BlinkPalette.tint100,
    softBorder: BlinkPalette.tint300,
    softPink: BlinkPalette.tint50,
    softPinkWarm: BlinkPalette.tint150,
    iconHalo: BlinkPalette.tint200,

    // Borders & dividers
    border: BlinkPalette.gray300,
    lightGrey: BlinkPalette.gray300,
    divider: BlinkPalette.slate200,

    // Accents
    accentPink: BlinkPalette.iosRed,
    accentYellow: '#FFCC00',
    accentBlue: '#4A90E2',
    accentGreen: '#4CD964',

    // Neutrals (legacy keys — kept for compatibility)
    charcoal: BlinkPalette.slate700,
    deepCharcoal: BlinkPalette.gray900,
    slate: BlinkPalette.slate900,

    // Semantic
    success: BlinkPalette.success,
    successLight: BlinkPalette.successBg,
    credit: BlinkPalette.credit,
    creditLight: BlinkPalette.creditBg,
    danger: BlinkPalette.danger,
    dangerLight: '#FEE2E2',
    warning: BlinkPalette.warning,
    warningLight: '#FEF3C7',
    info: BlinkPalette.info,
    infoLight: '#DBEAFE',

    // Chrome
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: BlinkPalette.gray400,
    tabIconSelected: BlinkPalette.blink500,
    navBarFill: 'rgba(243,244,246,0.94)', // frosted glass navbar
    modalScrim: 'rgba(0,0,0,0.5)',
  },
  dark: {
    primary: BlinkPalette.blink500,
    primaryDark: BlinkPalette.blink600,
    primaryDeep: BlinkPalette.blink700,
    primaryLight: BlinkPalette.blink400,

    text: '#ECEDEE',
    subtext: '#9BA1A6',
    textStrong: '#E5E7EB',
    textMuted: '#9BA1A6',

    background: '#020617',
    backgroundWarm: '#1A1416',
    cardBackground: '#1C1C1E',
    iconBackground: '#2C2C2E',
    mutedBackground: '#1A1A1A',
    mutedBorder: '#333333',

    softCard: '#2A1C20',
    softBorder: '#3A1F26',
    softPink: '#2A1C20',
    softPinkWarm: '#2A1C20',
    iconHalo: '#331517',

    border: '#2C2C2C',
    lightGrey: '#2C2C2C',
    divider: '#2C2C2C',

    accentPink: BlinkPalette.iosRed,
    accentYellow: '#FFCC00',
    accentBlue: '#4A90E2',
    accentGreen: '#4CD964',

    charcoal: '#ECEDEE',
    deepCharcoal: '#ECEDEE',
    slate: '#ECEDEE',

    success: BlinkPalette.success,
    successLight: '#0F3E23',
    credit: '#3DB3C9',
    creditLight: '#0F3540',
    danger: BlinkPalette.danger,
    dangerLight: '#331517',
    warning: BlinkPalette.warning,
    warningLight: '#3A2A0A',
    info: BlinkPalette.info,
    infoLight: '#1E2E4B',

    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    navBarFill: 'rgba(28,28,30,0.94)',
    modalScrim: 'rgba(0,0,0,0.6)',
  },
};

/* ==========================================================================
   GRADIENTS — used purposefully, not decoratively.
   Pass each as `colors={Gradients.header}` to LinearGradient.
   ========================================================================== */
export const Gradients = {
  header: ['#FF6C90', '#EE3160'] as const,   // customer header — vertical
  hero: ['#DE2555', '#B9003F'] as const,     // agent / rider hero — diagonal 135°
  deal: ['#EE335F', '#C9103F'] as const,     // deal banner — diagonal 135°
};

/* ==========================================================================
   RADII — pills everywhere; cards 16, hero 24, phone-frame 32.
   ========================================================================== */
export const Radii = {
  sm: 8,
  md: 12,    // small quick-action tiles
  lg: 16,    // standard cards (news, store, product)
  xl: 24,    // hero cards, large panels
  xxl: 32,   // phone-screen frame
  pill: 999, // buttons, inputs, chips, navbar, status
};

/* ==========================================================================
   SHADOWS — soft, low-contrast, neutral. Never harsh.
   RN style objects (iOS shadow* + Android elevation).
   ========================================================================== */
export const Shadows = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#D1D5DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 11,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  nav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
  brand: {
    shadowColor: BlinkPalette.blink500,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
};

/* ==========================================================================
   SPACING — 4px base grid.
   ========================================================================== */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

/* ==========================================================================
   TYPOGRAPHY — Poppins (display/headings/buttons) · Inter (body/UI).
   Plus Jakarta Sans appears on some newer Rider/Agent screens.
   Headings carry a signature +0.04em tracking ≈ +0.6 at 16px in RN units.
   ========================================================================== */
export const Typography = {
  fontFamily: {
    display: Platform.select({
      ios: 'Poppins',
      android: 'Poppins',
      default: 'Poppins',
    }),
    body: Platform.select({
      ios: 'Inter',
      android: 'Inter',
      default: 'Inter',
    }),
    alt: Platform.select({
      ios: 'PlusJakartaSans',
      android: 'PlusJakartaSans',
      default: 'PlusJakartaSans',
    }),
  },
  trackingDisplay: 0.04, // signature heading tracking (em)
  scale: {
    display: { size: 30, lineHeight: 33, weight: '800' as const },
    h1:      { size: 24, lineHeight: 28, weight: '700' as const },
    h2:      { size: 18, lineHeight: 22, weight: '700' as const },
    h3:      { size: 16, lineHeight: 20, weight: '600' as const },
    body:    { size: 14, lineHeight: 21, weight: '400' as const },
    sm:      { size: 12, lineHeight: 17, weight: '400' as const },
    xs:      { size: 10, lineHeight: 13, weight: '500' as const }, // nav labels
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
