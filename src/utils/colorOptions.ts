/**
 * Color options for sidebar dropdowns.
 *
 * Two ways to supply colors from Bubble:
 *
 * 1. **List of option set** (e.g. "Brand Color" with attributes "Display" and "Hex code"):
 *    Set the element property "Color palette" to a list of that option set. Bubble often sends
 *    only the choice values (slugs like "brand_green"), not the custom attributes; we fall back
 *    to a small slug→hex map and to scanning object values for any hex.
 *
 * 2. **Two list-of-strings** (recommended if option set attributes don't come through):
 *    Add element properties "Color names" and "Color hex codes" (each list of text). Same order:
 *    names[0] with hexes[0]. Use buildPaletteFromTwoLists(); when both are set we prefer this.
 */

export interface ColorOption {
  name: string;
  value: string;
}

/**
 * Normalize a CSS color to hex so it can be matched against palette options (which use hex).
 * Handles rgb(r,g,b), rgba(r,g,b,a), and leaves hex/transparent as-is.
 */
export function normalizeColorToHex(color: string): string {
  const s = (color || '').trim();
  if (!s) return '';
  if (s.toLowerCase() === 'transparent') return 'transparent';
  const hexRe = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
  if (hexRe.test(s)) return s.length === 4 ? `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}` : s;
  const rgbMatch = s.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)$/);
  if (rgbMatch) {
    const r = Math.max(0, Math.min(255, parseInt(rgbMatch[1], 10)));
    const g = Math.max(0, Math.min(255, parseInt(rgbMatch[2], 10)));
    const b = Math.max(0, Math.min(255, parseInt(rgbMatch[3], 10)));
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  }
  return s;
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

/** If Bubble only sends option slugs (no Hex code on list items), map known slugs to hex so swatches and apply work. */
const SLUG_TO_HEX: Record<string, string> = {
  brand_green: '#007F00',
  dark_green: '#004F00',
};

/** Get first string in obj that looks like a hex code (e.g. #007F00). */
function getAnyHexFromObject(obj: Record<string, unknown>): string {
  const hexRe = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
  for (const v of Object.values(obj)) {
    if (typeof v === 'string' && hexRe.test(v.trim())) return v.trim();
  }
  return '';
}

function resolveValueToHex(valueStr: string, nameStr: string, obj?: Record<string, unknown>): string {
  const v = valueStr.trim();
  if (obj) {
    const hexFromObj = getAnyHexFromObject(obj);
    if (hexFromObj) return hexFromObj;
  }
  if (!v) return '';
  if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(v) || /^rgb\(|^rgba\(|^hsl\(|^hsla\(/.test(v)) return v;
  const slug = v.toLowerCase().replace(/\s+/g, '_');
  if (SLUG_TO_HEX[slug]) return SLUG_TO_HEX[slug];
  const nameSlug = nameStr.trim().toLowerCase().replace(/\s+/g, '_');
  if (SLUG_TO_HEX[nameSlug]) return SLUG_TO_HEX[nameSlug];
  return v;
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

/** Turn a single list value (Bubble list or array) into string[]. */
function toStringArray(raw: unknown): string[] {
  const arr = unwrapList(raw);
  if (!arr) return [];
  return arr.map((x) => (typeof x === 'string' ? x : String(x ?? '').trim())).filter(Boolean);
}

/**
 * Build palette from two list-of-strings fields (e.g. "Color display names" + "Color hex codes").
 * Uses same order: names[i] with hexes[i]. Handles Bubble list API (.get(0, n)).
 * Use this when "list of option set" does not send custom attributes (Hex code) from Bubble.
 */
export function buildPaletteFromTwoLists(namesRaw: unknown, hexesRaw: unknown): ColorOption[] {
  const names = toStringArray(namesRaw);
  const hexes = toStringArray(hexesRaw);
  const len = Math.min(names.length, hexes.length);
  if (len === 0) return [];
  const out: ColorOption[] = [];
  for (let i = 0; i < len; i++) {
    const name = names[i].trim();
    const value = hexes[i].trim();
    if (value) out.push({ name: name || value, value });
  }
  return out;
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
      // Prefer hex/color keys so we get actual hex, not the option slug (e.g. "brand_green")
      const value =
        getStrByKeyContains(obj, 'hex') ||
        getStrByKeyContains(obj, 'color') ||
        getStr(obj, 'Hex', 'hex', 'hex_code', 'Hex_code', 'Hex code', 'Hex Code', 'color', 'Color', 'value', 'Value');
      const nameStr = typeof name === 'string' ? String(name).trim() : '';
      let valueStr = typeof value === 'string' ? String(value).trim() : '';
      if (!valueStr && nameStr) {
        const n = nameStr.toLowerCase();
        if (n === 'black') valueStr = '#000000';
        else if (n === 'white') valueStr = '#ffffff';
      }
      // Resolve to hex: use value from object if it's already hex; else resolve slug via map (e.g. brand_green → #007F00)
      const resolved = resolveValueToHex(valueStr || '', nameStr, obj);
      return { name: nameStr || valueStr || 'Color', value: resolved || valueStr || '#000000' };
    }).filter((o) => o.value);
  }
  return [];
}
