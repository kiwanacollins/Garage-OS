/**
 * Branding constants for the German Car Medic application
 */

export const BRAND_NAME = "German Car Medic";
export const BRAND_SHORT_NAME = "Car Medic";
export const BRAND_ALT_TEXT = "German Car Medic Logo";

export const LOGO_PATHS = {
  full: "/logos/logo-full.png",
  medium: "/logos/logo-medium.png",
  small: "/logos/logo-small.png",
  dark: "/logos/logo-dark.png",
  favicon: "/logos/favicon-32.png",
  icon192: "/logos/icon-192.png",
  icon512: "/logos/icon-512.png",
} as const;

export const LOGO_DIMENSIONS = {
  full: { width: 832, height: 437 },
  medium: { width: 200, height: 105 },
  small: { width: 120, height: 63 },
  favicon: { width: 32, height: 32 },
  icon192: { width: 192, height: 192 },
  icon512: { width: 512, height: 512 },
} as const;