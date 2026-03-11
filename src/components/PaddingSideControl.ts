/**
 * PaddingSideControl - Single side padding control for the Padding row.
 *
 * Matches the radius control pattern: one control per side (top, right, bottom, left).
 * Active when value > 0; same hover/active styling as radius corner control.
 * Parent adds .all-linked on the wrapper when the ALL Padding control is active.
 */

export type PaddingSide = 'top' | 'right' | 'bottom' | 'left';

export interface PaddingSideControlOptions {
  /** Which side this control represents. */
  side: PaddingSide;
  /** Display value for the input (e.g. "0", "16"). */
  valueDisplay: string;
  /** Whether this side has non-zero padding (active state). */
  active: boolean;
  /** Optional title for the control. */
  title?: string;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const SIDE_LABEL: Record<PaddingSide, string> = {
  top: 'T',
  right: 'R',
  bottom: 'B',
  left: 'L',
};

const SIDE_TITLE: Record<PaddingSide, string> = {
  top: 'Top padding',
  right: 'Right padding',
  bottom: 'Bottom padding',
  left: 'Left padding',
};

/**
 * Returns HTML for one padding side control.
 * Parent is responsible for toggling .active and updating value on state change.
 * Parent should add .all-linked to .bp-padding-side-controls when ALL is active.
 */
export function createPaddingSideControlHTML(options: PaddingSideControlOptions): string {
  const {
    side,
    valueDisplay,
    active,
    title = SIDE_TITLE[side],
  } = options;

  const label = SIDE_LABEL[side];
  const classes = ['bp-padding-side-control', active ? 'active' : ''].filter(Boolean).join(' ');
  const inputValue = (valueDisplay || '0').trim();

  return `<div class="${classes}" data-padding-side="${side}" title="${escapeAttr(title)}" role="group" aria-label="${escapeAttr(title)}">
  <span class="bp-padding-side-control-inner">
    <span class="bp-padding-side-control-label" aria-hidden="true">${escapeAttr(label)}</span>
    <input type="text" inputmode="numeric" class="bp-padding-side-control-input" data-padding="${side}" value="${escapeAttr(inputValue)}" placeholder="0" aria-label="${escapeAttr(title)} value" min="0">
  </span>
</div>`;
}
