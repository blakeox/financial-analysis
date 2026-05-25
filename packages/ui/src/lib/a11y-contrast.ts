/**
 * WCAG 2.1 contrast helpers and design-token guardrails.
 * @module a11y-contrast
 */

/** Minimum contrast for normal text (WCAG AA). */
export const WCAG_AA_NORMAL_TEXT = 4.5;

/** Minimum contrast for large text (18pt+ or 14pt bold) and UI components (WCAG AA). */
export const WCAG_AA_LARGE_TEXT = 3;

function channel(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function luminance(rgb: readonly [number, number, number]): number {
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

export function parseHexColor(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    throw new Error(`Expected 6-digit hex color, got "${hex}"`);
  }
  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function contrastRatio(foreground: string, background: string): number {
  const fg = luminance(parseHexColor(foreground));
  const bg = luminance(parseHexColor(background));
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWcagAaNormalText(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) >= WCAG_AA_NORMAL_TEXT;
}

/** Pairs used by shared tokens — keep in sync with classNames + global.css. */
export const REQUIRED_CONTRAST_PAIRS = [
  { name: 'muted copy on white', foreground: '#475569', background: '#ffffff' },
  { name: 'muted copy on dark shell', foreground: '#94a3b8', background: '#050816' },
  { name: 'secondary copy on white', foreground: '#475569', background: '#ffffff' },
  { name: 'secondary copy on dark shell', foreground: '#cbd5e1', background: '#050816' },
  { name: 'body copy on white', foreground: '#5e6478', background: '#ffffff' },
  { name: 'help copy on white', foreground: '#5e6478', background: '#ffffff' },
  { name: 'placeholder on white', foreground: '#64748b', background: '#ffffff' },
] as const;

export function validateRequiredContrastPairs(): string[] {
  const failures: string[] = [];
  for (const pair of REQUIRED_CONTRAST_PAIRS) {
    const ratio = contrastRatio(pair.foreground, pair.background);
    if (ratio < WCAG_AA_NORMAL_TEXT) {
      failures.push(
        `${pair.name}: ${pair.foreground} on ${pair.background} = ${ratio.toFixed(2)}:1 (need ${WCAG_AA_NORMAL_TEXT}:1)`
      );
    }
  }
  return failures;
}
