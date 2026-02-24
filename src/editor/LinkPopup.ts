/**
 * Link popup (Insert / Edit Link) – shared by Sidebar and Toolbar.
 * Shows a modal with URL input, "Open in new tab" checkbox, Save and Close.
 */

import { ContentEditor } from './Editor';
import { icons } from '../utils/icons';

export interface ShowLinkPopupOptions {
  initialUrl?: string;
  initialOpenInNewTab?: boolean;
  isEdit?: boolean;
  /** When true, commands run without focusing editor (e.g. when opened from sidebar). */
  noFocus?: boolean;
  /** Element to append the overlay to (default body). */
  themeRoot?: HTMLElement;
  /** Theme variables (--editor-text, --editor-bg, etc.) computed from current theme. When provided, applied directly to the overlay so dark mode text/input colors are correct. */
  themeVariables?: Record<string, string>;
}

const LINK_POPUP_THEME_VARS = [
  '--editor-text',
  '--editor-text-muted',
  '--editor-bg',
  '--editor-border',
  '--editor-accent-muted',
  '--sidebar-bg',
  '--toolbar-bg',
  '--toolbar-icon-active',
  '--brand-primary',
  '--border-radius',
  '--control-btn-bg-hover',
] as const;

export function showLinkPopup(editor: ContentEditor, options: ShowLinkPopupOptions = {}): void {
  const {
    initialUrl = '',
    initialOpenInNewTab = false,
    isEdit = false,
    noFocus = false,
    themeRoot,
    themeVariables,
  } = options;

  const mountTarget = themeRoot ?? document.body;

  const overlay = document.createElement('div');
  overlay.className = 'bp-link-popup-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'bp-link-popup-heading');

  const dialog = document.createElement('div');
  dialog.className = 'bp-link-popup';
  dialog.innerHTML = `
    <div class="bp-link-popup-header">
      <h2 class="bp-link-popup-title" id="bp-link-popup-heading">${isEdit ? 'Edit Link' : 'Insert Link'}</h2>
      <button type="button" class="bp-link-popup-close" title="Close" aria-label="Close">${icons.close}</button>
    </div>
    <div class="bp-link-popup-body">
      <label class="bp-link-popup-label" for="bp-link-url">URL</label>
      <input type="url" id="bp-link-url" class="bp-link-popup-input" placeholder="https://" value="${initialUrl.replace(/"/g, '&quot;')}" autocomplete="url" />
      <label class="bp-link-popup-checkbox-wrap">
        <input type="checkbox" id="bp-link-newtab" class="bp-link-popup-checkbox" ${initialOpenInNewTab ? 'checked' : ''} />
        <span>Open in new tab</span>
      </label>
    </div>
    <div class="bp-link-popup-footer">
      ${isEdit ? '<button type="button" class="bp-btn bp-btn-ghost bp-link-popup-remove">Remove link</button>' : ''}
      <div class="bp-link-popup-actions">
        <button type="button" class="bp-btn bp-btn-primary bp-link-popup-save">Save</button>
      </div>
    </div>
  `;
  overlay.appendChild(dialog);

  const close = (): void => {
    overlay.remove();
    document.body.style.overflow = overflowPrior;
  };

  const save = (): void => {
    const urlInput = dialog.querySelector('#bp-link-url') as HTMLInputElement;
    const newTabCheck = dialog.querySelector('#bp-link-newtab') as HTMLInputElement;
    const url = (urlInput?.value ?? '').trim();
    if (url) {
      editor.setLink(url, { focus: !noFocus, openInNewTab: newTabCheck?.checked ?? false });
    }
    close();
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  dialog.querySelector('.bp-link-popup-close')?.addEventListener('click', close);
  dialog.querySelector('.bp-link-popup-save')?.addEventListener('click', () => save());
  dialog.querySelector('.bp-link-popup-remove')?.addEventListener('click', () => {
    editor.unsetLink({ focus: !noFocus });
    close();
  });
  dialog.querySelector('#bp-link-url')?.addEventListener('keydown', (e) => {
    const ke = e as KeyboardEvent;
    if (ke.key === 'Enter') save();
    if (ke.key === 'Escape') close();
  });

  mountTarget.appendChild(overlay);

  // Apply theme variables so text and input colors match light/dark and brand.
  // Prefer explicitly computed themeVariables (reliable in all hosts); fallback to copying from themeRoot.
  if (themeVariables && Object.keys(themeVariables).length > 0) {
    for (const [key, value] of Object.entries(themeVariables)) {
      if (value) overlay.style.setProperty(key, value);
    }
  } else if (themeRoot) {
    const computed = window.getComputedStyle(themeRoot);
    for (const v of LINK_POPUP_THEME_VARS) {
      const value = computed.getPropertyValue(v).trim();
      if (value) overlay.style.setProperty(v, value);
    }
  }

  const overflowPrior = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const input = dialog.querySelector('#bp-link-url') as HTMLInputElement;
  input?.focus();
}
