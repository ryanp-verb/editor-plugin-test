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

/** Bubble list API: list properties expose .get(start, end) to load items (see Bubble "Loading Data" docs). */
function isBubbleListHandle(value: unknown): value is { get: (start: number, end: number) => unknown[] } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { get?: unknown }).get === 'function'
  );
}

/** If raw is a wrapped list (e.g. Bubble repeating group shape), return the inner array; otherwise return raw. */
function unwrapList(raw: unknown): unknown[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) return raw;
  if (isBubbleListHandle(raw)) {
    try {
      const arr = raw.get(0, 500);
      return Array.isArray(arr) ? arr : null;
    } catch (err) {
      if ((err as Error).message === 'not ready') throw err;
      return null;
    }
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const arr = obj.list ?? obj.results ?? obj.items ?? obj.data ?? obj.value ?? obj.options ?? obj.choices;
    if (Array.isArray(arr)) return arr;
  }
  return null;
}

/**
 * Normalize palette from Bubble or legacy format to ColorOption[].
 * - Array of { name, value } or Bubble option set items (Display + Hex code) → mapped to { name, value }.
 * - Array of strings → treat each as value, name = value.
 * - Wrapped list (object with .list / .results / .items etc.) → unwrap then normalize.
 * Bubble can send option set items with various key names; we check exact names first, then any key containing "display"/"hex".
 */
export function normalizeColorPalette(
  raw: ColorOption[] | string[] | BubbleColorThing[] | Record<string, unknown> | undefined | null
): ColorOption[] {
  const arr = unwrapList(raw);
  if (!arr || arr.length === 0) return [];
  const first = arr[0];
  if (typeof first === 'string') {
    return (arr as string[]).map((v) => ({ name: v, value: v.trim() })).filter((o) => o.value);
  }
  if (typeof first === 'object' && first !== null) {
    return (arr as (ColorOption | BubbleColorThing)[]).map((item) => {
      const obj = item as Record<string, unknown>;
      const name =
        getStr(obj, 'name', 'Name', 'Display', 'display', 'Label', 'label', 'title', 'Title', 'text', 'Text') ||
        getStrByKeyContains(obj, 'display') ||
        getStrByKeyContains(obj, 'name') ||
        getStrByKeyContains(obj, 'label');
      const value =
        getStr(obj, 'value', 'Value', 'Hex', 'hex', 'hex_code', 'Hex_code', 'Hex code', 'Hex Code', 'color', 'Color') ||
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
