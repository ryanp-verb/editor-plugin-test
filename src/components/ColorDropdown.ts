/**
 * ColorDropdown - Custom styled color selector (trigger + panel).
 * Options from Bubble option set (e.g. Brand Color with Display + Hex code).
 * Uses theme vars for light/dark; no native select.
 */

import type { ColorOption } from '../utils/colorOptions';

export type ColorDropdownTarget = 'textColor' | 'borderColor' | 'backgroundColor';

export interface ColorDropdownOptions {
  target: ColorDropdownTarget;
  /** List of { name, value } from normalizeColorPalette(Bubble option set). */
  colors: ColorOption[];
  value: string;
  label?: string;
  includeTransparent?: boolean;
  includeWhite?: boolean;
  transparentLabel?: string;
}

const CHEVRON_DOWN =
  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Swatch style for a color value (transparent = checkered). */
function swatchStyle(value: string): string {
  const v = (value || '').trim().toLowerCase();
  if (v === 'transparent' || v === '') {
    return 'background: linear-gradient(45deg, var(--editor-border, #c9cbbe) 25%, transparent 25%), linear-gradient(-45deg, var(--editor-border, #c9cbbe) 25%, transparent 25%); background-size: 6px 6px; background-color: var(--neutral-warm-grey-1, #f5f5f2);';
  }
  return `background-color: ${escapeAttr(value)};`;
}

/** Resolve display name for current value from options list. */
function displayNameFor(value: string, options: ColorOption[], transparentLabel: string, includeWhite: boolean): string {
  const v = (value || '').trim().toLowerCase();
  if (v === 'transparent' || v === '') return transparentLabel;
  if (includeWhite && (v === '#ffffff' || v === 'ffffff')) return 'White';
  const found = options.find((o) => o.value.trim().toLowerCase() === v);
  return found ? found.name : value;
}

/**
 * Returns HTML for custom dropdown: trigger (swatch + name + chevron) + panel (list of options).
 * Panel is hidden by default; Sidebar toggles .bp-color-dropdown-open on the container and handles option click.
 */
export function createColorDropdownHTML(options: ColorDropdownOptions): string {
  const {
    target,
    colors,
    value,
    label = 'Color',
    includeTransparent = false,
    includeWhite = false,
    transparentLabel = 'Transparent',
  } = options;

  const normalizedValue = (value || '').trim().toLowerCase();
  const optionList: ColorOption[] = [];
  if (includeTransparent) optionList.push({ name: transparentLabel, value: 'transparent' });
  if (includeWhite) optionList.push({ name: 'White', value: '#ffffff' });
  colors.forEach((o) => {
    const key = o.value.trim().toLowerCase();
    if (key === 'transparent') return;
    if (includeWhite && (key === '#ffffff' || key === 'ffffff')) return;
    optionList.push(o);
  });

  const currentName = displayNameFor(value, optionList, transparentLabel, includeWhite);
  const triggerSwatchStyle = swatchStyle(value || 'transparent');

  const optionItems = optionList.map((opt) => {
    const selected = normalizedValue === opt.value.trim().toLowerCase();
    const style = swatchStyle(opt.value);
    return `<button type="button" class="bp-color-dropdown-option${selected ? ' bp-color-dropdown-option-selected' : ''}" data-value="${escapeAttr(opt.value)}" data-name="${escapeAttr(opt.name)}" title="${escapeAttr(opt.name)}"><span class="bp-color-dropdown-option-swatch" style="${style}"></span><span class="bp-color-dropdown-option-name">${escapeHtml(opt.name)}</span></button>`;
  });

  const triggerHtml = `
    <button type="button" class="bp-color-dropdown-trigger" data-target="${target}" aria-haspopup="listbox" aria-expanded="false" aria-label="${escapeAttr(label || 'Color')}">
      <span class="bp-color-dropdown-trigger-swatch" style="${triggerSwatchStyle}"></span>
      <span class="bp-color-dropdown-trigger-name">${escapeHtml(currentName)}</span>
      <span class="bp-color-dropdown-chevron" aria-hidden="true">${CHEVRON_DOWN}</span>
    </button>
  `;
  const panelHtml = `
    <div class="bp-color-dropdown-panel" role="listbox" aria-label="${escapeAttr(label || 'Color')}">
      ${optionItems.join('')}
    </div>
  `;

  const wrapper = `<div class="bp-color-dropdown" data-color-dropdown="${target}" data-target="${target}">${triggerHtml}${panelHtml}</div>`;
  if (!label) return wrapper;
  return `<div class="bp-color-dropdown-wrap"><label class="bp-control-label">${escapeAttr(label)}</label>${wrapper}</div>`;
}
