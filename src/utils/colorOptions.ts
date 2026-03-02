/**
 * Color options for sidebar dropdowns.
 * Matches Bubble option set "Brand Color" with attributes "Display" and "Hex code".
 */

export interface ColorOption {
  name: string;
  value: string;
}

/** Raw item from Bubble (list of option set values); attribute names may vary. */
export type BubbleColorThing = Record<string, unknown> & {
  Display?: string;
  display?: string;
  Name?: string;
  name?: string;
  'Hex code'?: string;
  hex_code?: string;
  Hex?: string;
  hex?: string;
  Value?: string;
  value?: string;
};

/**
 * Normalize palette from Bubble or legacy format to ColorOption[].
 * - Array of { name, value } or { Display, "Hex code" } → use as-is or map keys.
 * - Array of strings → treat each as value, name = value.
 */
export function normalizeColorPalette(
  raw: ColorOption[] | string[] | BubbleColorThing[] | undefined | null
): ColorOption[] {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return [];
  const first = raw[0];
  if (typeof first === 'string') {
    return (raw as string[]).map((v) => ({ name: v, value: v.trim() })).filter((o) => o.value);
  }
  if (typeof first === 'object' && first !== null) {
    return (raw as (ColorOption | BubbleColorThing)[]).map((item) => {
      const name =
        (item as BubbleColorThing).Display ??
        (item as BubbleColorThing).display ??
        (item as ColorOption).name ??
        (item as BubbleColorThing).Name ??
        (item as BubbleColorThing).name;
      const value =
        (item as BubbleColorThing)['Hex code'] ??
        (item as BubbleColorThing).hex_code ??
        (item as BubbleColorThing).Hex ??
        (item as BubbleColorThing).hex ??
        (item as ColorOption).value ??
        (item as BubbleColorThing).Value ??
        (item as BubbleColorThing).value;
      const nameStr = typeof name === 'string' ? name : '';
      const valueStr = typeof value === 'string' ? String(value).trim() : '';
      return { name: nameStr || valueStr || 'Color', value: valueStr || '#000000' };
    }).filter((o) => o.value);
  }
  return [];
}
