/**
 * CollapsibleSection - Shared UI for sidebar sections that can be expanded/collapsed.
 * Renders a clickable header with title + caret (up when expanded, down when collapsed)
 * and a body that is shown/hidden based on state.
 */

import { icons } from '../utils/icons';

export const SIDEBAR_SECTION_IDS = [
  'text',
  'formatting',
  'textColor',
  'elements',
  'borders',
  'backgrounds',
  'layout',
] as const;

export type SidebarSectionId = (typeof SIDEBAR_SECTION_IDS)[number];

export interface CollapsibleSectionOptions {
  /** Unique section id (used for data-section-id and for plugin options). */
  id: SidebarSectionId;
  /** Header label. */
  title: string;
  /** HTML for the section body (controls content). */
  bodyHTML: string;
  /** When true, section is collapsed (body hidden, caret down). */
  collapsed: boolean;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Returns HTML for one collapsible sidebar section.
 * Parent must bind click on .bp-section-header to toggle collapsed and update DOM/caret.
 */
export function createCollapsibleSectionHTML(options: CollapsibleSectionOptions): string {
  const { id, title, bodyHTML, collapsed } = options;
  const caret = collapsed ? icons.chevronDown : icons.chevronUp;
  const sectionClass = `bp-sidebar-section${collapsed ? ' bp-section-collapsed' : ''}`;
  return `
<section class="${sectionClass}" data-section-id="${escapeAttr(id)}">
  <button type="button" class="bp-section-header" data-section-id="${escapeAttr(id)}" aria-expanded="${!collapsed}" aria-controls="bp-section-body-${escapeAttr(id)}">
    <span class="bp-section-title">${escapeAttr(title)}</span>
    <span class="bp-section-caret" aria-hidden="true">${caret}</span>
  </button>
  <div id="bp-section-body-${escapeAttr(id)}" class="bp-section-body" role="region" aria-label="${escapeAttr(title)}">
    ${bodyHTML}
  </div>
</section>`;
}
