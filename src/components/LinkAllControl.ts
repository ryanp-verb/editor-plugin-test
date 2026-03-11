/**
 * LinkAllControl - UI control to toggle "link all" for any 4-value group (borders, radius, padding, etc.).
 *
 * Generic behavior (implemented by the parent):
 * - Active (linked): shown when all 4 values are equal.
 * - If active and one value is changed by the user → become inactive.
 * - Click when inactive: set all 4 to the same value (default, or current input, or "all on" for booleans) and activate.
 * - Click when active: clear all 4 to default (0 or off) and deactivate.
 *
 * Use with or without the value readout (e.g. padding/radius show "N px"; border can omit it).
 * Based on Figma "Border Radius Control - all"; same styles for off/on and hover (light green).
 */

import { icons } from '../utils/icons';

export interface LinkAllControlOptions {
  /** Data attribute for the action (e.g. "toggleRadiusAll"). */
  dataAction: string;
  /** When set (e.g. "all"), adds data-side for border center handling. */
  dataSide?: string;
  /** Whether "all" are linked (same value). */
  linked: boolean;
  /** Optional numeric value to show when linked (e.g. radius in px). */
  value?: number;
  /** Whether to show the value readout when linked. */
  showValue?: boolean;
  /** When true, value is an editable input (accepts px, em, rem, %; default px). */
  valueAsInput?: boolean;
  /** Data attribute for the value input so parent can bind (e.g. "radius", "padding"). */
  valueInputData?: string;
  /** Initial display string for the value input (e.g. "10", "10px", "1em"). */
  valueDisplay?: string;
  /** Label text (default "ALL"). */
  label?: string;
  /** Optional unit for value (default "px"). */
  unit?: string;
  /** Extra CSS classes (e.g. bp-border-center bp-border-all for border). */
  className?: string;
  /** When "vertical", icon and label stack above; with valueAsInput, input only visible when linked. */
  layout?: 'horizontal' | 'vertical';
}

/**
 * Returns HTML for a single LinkAll control button.
 * Parent is responsible for toggling `active` class and updating icon/value on state change.
 */
export function createLinkAllControlHTML(options: LinkAllControlOptions): string {
  const {
    dataAction,
    dataSide,
    linked,
    value = 0,
    showValue = false,
    valueAsInput = false,
    valueInputData = '',
    valueDisplay,
    label = 'ALL',
    unit = 'px',
    className = '',
    layout = 'horizontal',
  } = options;

  const icon = linked ? icons.linkSm : icons.linkBroken;
  const displayStr = valueDisplay ?? (showValue ? `${value}` : '');
  const valuePart =
    showValue && linked && !valueAsInput
      ? `<span class="bp-link-all-value" aria-hidden="true">${value} ${unit}</span>`
      : '';

  if (showValue && valueAsInput && valueInputData) {
    // One rectangle: container with toggle button + input inside
    const layoutClass = layout === 'vertical' ? ' bp-link-all-vertical' : '';
    const containerClasses = ['bp-link-all-control', 'bp-link-all-with-input', layoutClass, linked ? 'active' : '', className].filter(Boolean).join(' ');
    const buttonAttrs = [
      'type="button"',
      'class="bp-link-all-toggle"',
      `data-action="${dataAction}"`,
      dataSide ? `data-side="${dataSide}"` : '',
      `title="${linked ? 'Unlink (set individually)' : 'Link all (same value)'}"`,
    ].filter(Boolean).join(' ');
    const inputAttrs = [
      'type="text"',
      'inputmode="decimal"',
      'class="bp-link-all-value-input"',
      `data-link-all-value="${valueInputData}"`,
      `value="${displayStr}"`,
      'placeholder="0"',
      'aria-label="Value"',
    ].join(' ');
    const toggleContent = layout === 'vertical'
      ? `<span class="bp-link-all-icon-wrap" aria-hidden="true">${icon}</span><span class="bp-link-all-label">${label}</span>`
      : `${icon}<span class="bp-link-all-label">${label}</span>`;
    return `<div class="${containerClasses}">
  <button ${buttonAttrs}>${toggleContent}</button>
  <input ${inputAttrs}>
</div>`;
  }

  const classNames = ['bp-link-all-control', linked ? 'active' : '', className].filter(Boolean).join(' ');
  const attrs = [
    `class="${classNames}"`,
    `data-action="${dataAction}"`,
    dataSide ? `data-side="${dataSide}"` : '',
    `title="${linked ? 'Unlink (set individually)' : 'Link all (same value)'}"`,
  ].filter(Boolean).join(' ');
  return `<button type="button" ${attrs}>
  ${icon}
  <span class="bp-link-all-label">${label}</span>
  ${valuePart}
</button>`;
}
