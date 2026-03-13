/**
 * RadiusCornerControl - Single corner radius control for the Border Radius row.
 *
 * Figma: "Border Radius Control" — one of four corners (top-left, bottom-left, top-right, bottom-right).
 * States (when ALL is inactive): default/off (0px), default hovered, active (non-zero), active hovered.
 * States (when ALL is active): active corners show light green; when ALL off, default/default hovered and active/active hovered.
 * Parent adds .all-linked on the wrapper when the ALL Radius control is active.
 */

export type RadiusCorner = 'topLeft' | 'bottomLeft' | 'topRight' | 'bottomRight';

export interface RadiusCornerControlOptions {
  /** Which corner this control represents. */
  corner: RadiusCorner;
  /** Display string for the value (e.g. "0", "15", "1em"). */
  valueDisplay: string;
  /** Whether this corner has a non-zero radius (active state). */
  active: boolean;
  /** Numeric radius in px for the corner demo stroke (used for SVG arc). Pass 0 or omit for sharp corner. */
  radiusValuePx?: number;
  /** Optional title for the button. */
  title?: string;
}

const VIEWBOX_WIDTH = 50;
const VIEWBOX_HEIGHT = 28;
/** Control visual is 50×28px in layout, so 1 viewBox unit = 1px for radius. Cap so curve fits and stays concentric with control bg. */
const MAX_DEMO_RADIUS_PX = 20;
function toSvgRadius(px: number): number {
  if (px <= 0) return 0;
  return Math.min(px, MAX_DEMO_RADIUS_PX);
}

/** Stroke width in viewBox units (~2px when rendered). Matches border side bar thickness. */
const STROKE_WIDTH = 2;
const HALF = STROKE_WIDTH / 2;
const INSET = STROKE_WIDTH;

/** Returns SVG path d for the corner demo (centerline of L-stroke). Outer edge of stroke hugs the radius curve. Exported for Sidebar. */
export function getCornerPathPx(corner: RadiusCorner, radiusPx: number): string {
  return getCornerStrokeCenterline(corner, toSvgRadius(radiusPx));
}

const W = VIEWBOX_WIDTH;
const H = VIEWBOX_HEIGHT;

/**
 * Centerline path for the L-shaped stroke. Path uses INSET from edges so stroke doesn't clip on bottom/top.
 * Arc is centered at the actual corner so outer edge of stroke = radius (correct curve, no inversion).
 * SVG has overflow:visible so left-corner arcs can extend to (0,0) or (0,H).
 */
function getCornerStrokeCenterline(corner: RadiusCorner, r: number): string {
  const h = HALF;
  if (r <= h) {
    const sharp: Record<RadiusCorner, string> = {
      topLeft: `M ${W - INSET} ${h} L ${h} ${h} L ${h} ${H - INSET}`,
      topRight: `M ${INSET} ${h} L ${W - h} ${h} L ${W - h} ${H - INSET}`,
      bottomRight: `M ${W - h} ${INSET} L ${W - h} ${H - h} L ${INSET} ${H - h}`,
      bottomLeft: `M ${W - INSET} ${H - h} L ${h} ${H - h} L ${h} ${INSET}`,
    };
    return sharp[corner];
  }
  const rInner = r - h;
  const paths: Record<RadiusCorner, string> = {
    // topLeft: sweep 0 so arc is centered at (0,0) for correct convex curve (sweep 1 would use center (rInner,rInner) = inverted)
    topLeft: `M ${W - INSET} 0 L ${rInner} 0 A ${rInner} ${rInner} 0 0 0 0 ${rInner} L 0 ${H - INSET}`,
    topRight: `M ${INSET} 0 L ${W - rInner} 0 A ${rInner} ${rInner} 0 0 1 ${W} ${rInner} L ${W} ${H - INSET}`,
    bottomRight: `M ${W} ${INSET} L ${W} ${H - rInner} A ${rInner} ${rInner} 0 0 1 ${W - rInner} ${H} L ${INSET} ${H}`,
    bottomLeft: `M ${W - INSET} ${H} L ${rInner} ${H} A ${rInner} ${rInner} 0 0 1 0 ${H - rInner} L 0 ${INSET}`,
  };
  return paths[corner];
}

/**
 * Returns HTML for one corner radius control.
 * Parent is responsible for toggling .active and updating value display on state change.
 * Parent should add .all-linked to the wrapper (e.g. .bp-radius-corner-controls) when ALL is active.
 */
export function createRadiusCornerControlHTML(options: RadiusCornerControlOptions): string {
  const {
    corner,
    valueDisplay,
    active,
    radiusValuePx = 0,
    title = getDefaultTitle(corner),
  } = options;

  const r = toSvgRadius(radiusValuePx);
  const pathD = getCornerStrokeCenterline(corner, r);
  const sharpClass = r <= HALF ? ' bp-radius-corner-sharp' : '';
  const classes = ['bp-radius-corner-control', active ? 'active' : ''].filter(Boolean).join(' ');
  const inputValue = valueDisplay.trim();

  return `<div class="${classes}" data-corner="${corner}" title="${escapeAttr(title)}" role="group" aria-label="${escapeAttr(title)}">
  <span class="bp-radius-corner-control-inner">
    <span class="bp-radius-corner-control-visual" aria-hidden="true">
      <svg class="bp-radius-corner-control-svg${sharpClass}" viewBox="0 0 ${W} ${H}" fill="none" stroke="currentColor" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round" style="overflow:visible">
        <path d="${pathD}"/>
      </svg>
      <input type="text" inputmode="decimal" class="bp-radius-corner-control-input" data-radius-corner="${corner}" value="${escapeAttr(inputValue)}" placeholder="0" aria-label="${escapeAttr(title)} value">
    </span>
  </span>
</div>`;
}

function getDefaultTitle(corner: RadiusCorner): string {
  const labels: Record<RadiusCorner, string> = {
    topLeft: 'Top left radius',
    bottomLeft: 'Bottom left radius',
    topRight: 'Top right radius',
    bottomRight: 'Bottom right radius',
  };
  return labels[corner];
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
