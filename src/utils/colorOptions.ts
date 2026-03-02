/**
 * Color options for sidebar dropdowns.
 * Matches Bubble option set "Brand Color" with attributes "Display" and "Hex code".
 * Bubble may serialize option set items with different key names (e.g. Display vs display, "Hex code" vs hex_code).
 */

export interface ColorOption {
  name: string;
  value: string;
}

/** Raw item from Bubble (list of option set values); attribute names may vary. */
export type BubbleColorThing = Record<string, unknown>;

/** Get first string value from obj for the given keys (exact match). */
function getStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string') return v;
  }
  return '';
}

/** Get first string value from obj for any key that includes the given substring (case-insensitive). */
function getStrByKeyContains(obj: Record<string, unknown>, substring: string): string {
  const lower = substring.toLowerCase();
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && k.toLowerCase().includes(lower)) return v;
  }
  return '';
}

/**
 * Normalize palette from Bubble or legacy format to ColorOption[].
 * - Array of { name, value } or Bubble option set items (Display + Hex code) → mapped to { name, value }.
 * - Array of strings → treat each as value, name = value.
 * Bubble can send option set items with various key names; we check exact names first, then any key containing "display"/"hex".
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
      const obj = item as Record<string, unknown>;
      const name =
        getStr(obj, 'name', 'Name', 'Display', 'display', 'Label', 'label', 'title', 'Title', 'text', 'Text') ||
        getStrByKeyContains(obj, 'display') ||
        getStrByKeyContains(obj, 'name') ||
        getStrByKeyContains(obj, 'label');
      const value =
        getStr(obj, 'value', 'Value', 'Hex', 'hex', 'hex_code', 'Hex_code', 'Hex code', 'color', 'Color') ||
        getStrByKeyContains(obj, 'hex') ||
        getStrByKeyContains(obj, 'color') ||
        getStrByKeyContains(obj, 'value');
      const nameStr = typeof name === 'string' ? String(name).trim() : '';
      const valueStr = typeof value === 'string' ? String(value).trim() : '';
      return { name: nameStr || valueStr || 'Color', value: valueStr || '#000000' };
    }).filter((o) => o.value);
  }
  return [];
}
