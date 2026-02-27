/**
 * Parse a length input string (e.g. "10", "10px", "1em", "0.5rem", "50%").
 * Defaults to px when only a number is entered.
 */
export type LengthUnit = 'px' | 'em' | 'rem' | '%';

export interface ParsedLength {
  value: number;
  unit: LengthUnit;
  /** CSS value string, e.g. "10px", "1em", "50%" */
  css: string;
}

const LENGTH_REGEX = /^(-?\d*\.?\d+)\s*(px|em|rem|%)?$/i;

export function parseLengthInput(input: string): ParsedLength | null {
  const s = input.trim();
  if (!s) return null;
  const m = s.match(LENGTH_REGEX);
  if (!m) return null;
  const value = parseFloat(m[1]);
  if (isNaN(value)) return null;
  const unit = (m[2]?.toLowerCase() || 'px') as LengthUnit;
  const css = unit === 'px' ? `${value}px` : `${value}${unit}`;
  return { value, unit, css };
}

/** Font size used to convert rem/em to px in demo contexts (no real element). */
export const DEMO_FONT_SIZE_PX = 16;
/** Reference size for % (e.g. viewBox width); 100% = refSizePx. */
export const DEMO_REF_SIZE_PX = 50;

/**
 * Convert a parsed length to px for demo stroke/bg radius.
 * rem/em use DEMO_FONT_SIZE_PX; % uses (value/100) * refSizePx.
 */
export function lengthToPxForDemo(
  parsed: ParsedLength | null,
  refSizePx: number = DEMO_REF_SIZE_PX
): number {
  if (!parsed || parsed.value === 0) return 0;
  switch (parsed.unit) {
    case 'px':
      return parsed.value;
    case 'rem':
    case 'em':
      return parsed.value * DEMO_FONT_SIZE_PX;
    case '%':
      return (parsed.value / 100) * refSizePx;
    default:
      return 0;
  }
}
