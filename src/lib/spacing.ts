/**
 * Spacing constants for consistent card and layout spacing across the application
 */

export const SPACING = {
  // Header spacing
  HEADER_BUFFER: 20, // px - buffer between header and content
  
  // Card spacing
  CARD_GAP: 12, // px - gap between cards
  CARD_MARGIN_TOP: 0, // px - margin above first card
  CARD_MARGIN_BOTTOM: 0, // px - margin below last card
  
  // Section spacing
  SECTION_PADDING_X: 28, // px - horizontal padding for sections
  SECTION_PADDING_Y: 0, // px - vertical padding for sections
  
  // Page spacing
  PAGE_PADDING_TOP_DEFAULT: 'calc(var(--header-height, 0px) + 20px)', // CSS calc for header-aware spacing
  PAGE_PADDING_BOTTOM: 40, // px - bottom padding
  
  // Container constraints
  MAX_WIDTH_STANDARD: 500, // px - standard max width for card containers
  MAX_WIDTH_FULL: null, // no max width constraint
  
  // Mobile considerations
  MOBILE_NAV_HEIGHT: 80, // px - height of mobile navigation
} as const;

/**
 * Layout presets for different page types
 */
export const LAYOUT_PRESETS = {
  /**
   * Simple list pages (Routines, Train, History)
   * - Dynamic header-aware top padding
   * - Standard card gap
   * - Centered 500px max width
   */
  SIMPLE_LIST: {
    paddingTop: SPACING.PAGE_PADDING_TOP_DEFAULT,
    paddingBottom: 0,
    gap: SPACING.CARD_GAP,
    maxWidth: SPACING.MAX_WIDTH_STANDARD,
    paddingX: 20, // Standard horizontal padding
  },
  
  /**
   * Section-based pages (RoutineBuilder, ActiveWorkout)
   * - No top padding (handled by parent)
   * - Custom horizontal padding
   * - Reorderable cards
   */
  SECTION_BASED: {
    paddingTop: 0,
    paddingBottom: 0,
    gap: SPACING.CARD_GAP,
    maxWidth: SPACING.MAX_WIDTH_STANDARD,
    paddingX: SPACING.SECTION_PADDING_X,
  },
  
  /**
   * Full-width pages (Account, Sharing)
   * - No width constraints
   * - Minimal padding
   * - Full viewport usage
   */
  FULL_WIDTH: {
    paddingTop: 0,
    paddingBottom: 0,
    gap: SPACING.CARD_GAP,
    maxWidth: SPACING.MAX_WIDTH_FULL,
    paddingX: 0,
  },
} as const;

/**
 * Get standard padding top calculation
 * @param customPadding - Custom padding value to override default
 * @returns CSS calc string or custom value
 */
export const getStandardPaddingTop = (customPadding?: number | string): string | number => {
  return customPadding ?? SPACING.PAGE_PADDING_TOP_DEFAULT;
};

/**
 * Get spacing configuration for a specific layout preset
 * @param preset - Layout preset key
 * @returns Spacing configuration object
 */
export const getSpacingConfig = (preset: keyof typeof LAYOUT_PRESETS) => {
  return LAYOUT_PRESETS[preset];
};

export type LayoutPreset = keyof typeof LAYOUT_PRESETS;
