import { useMemo } from 'react';
import { LAYOUT_PRESETS, SPACING, LayoutPreset, getSpacingConfig } from '@/lib/spacing';

/**
 * Hook for consistent spacing usage across components
 * @param preset - Layout preset to use
 * @param overrides - Optional overrides for specific spacing values
 * @returns Spacing configuration object
 */
export const useSpacing = (
  preset: LayoutPreset,
  overrides?: Partial<typeof LAYOUT_PRESETS[LayoutPreset]>
) => {
  return useMemo(() => {
    const baseConfig = getSpacingConfig(preset);
    return { ...baseConfig, ...overrides };
  }, [preset, overrides]);
};

/**
 * Hook for getting header-aware padding top
 * @param customPadding - Custom padding value to override default
 * @returns CSS calc string or custom value
 */
export const useHeaderAwarePadding = (customPadding?: number | string) => {
  return useMemo(() => {
    return customPadding ?? SPACING.PAGE_PADDING_TOP_DEFAULT;
  }, [customPadding]);
};

/**
 * Hook for getting card wrapper spacing
 * @param overrides - Optional overrides for card spacing
 * @returns Card spacing configuration
 */
export const useCardSpacing = (overrides?: {
  gap?: number;
  marginTop?: number;
  marginBottom?: number;
}) => {
  return useMemo(() => ({
    gap: SPACING.CARD_GAP,
    marginTop: SPACING.CARD_MARGIN_TOP,
    marginBottom: SPACING.CARD_MARGIN_BOTTOM,
    ...overrides,
  }), [overrides]);
};

/**
 * Hook for getting section spacing
 * @param overrides - Optional overrides for section spacing
 * @returns Section spacing configuration
 */
export const useSectionSpacing = (overrides?: {
  paddingX?: number;
  paddingY?: number;
  gap?: number;
}) => {
  return useMemo(() => ({
    paddingX: SPACING.SECTION_PADDING_X,
    paddingY: SPACING.SECTION_PADDING_Y,
    gap: SPACING.CARD_GAP,
    ...overrides,
  }), [overrides]);
};
