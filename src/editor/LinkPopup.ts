/**
 * Link popup (Insert / Edit Link) – shared by Sidebar and Toolbar.
 * Shows a modal with URL input, "Open in new tab" checkbox, Save and Close.
 */

import { ContentEditor } from './Editor';
import { icons } from '../utils/icons';
import { getThemeVariablesForPopup } from '../utils/themeApplier';

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
  '--link-popup-save-text',
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

  // Apply theme variables so text and background use the same source.
  // Prefer theme root's computed style (same way the popup background gets its color when mounted inside themeRoot).
  const resolvedTheme =
    themeRoot?.dataset?.theme ||
    (themeRoot?.closest?.('[data-theme]') as HTMLElement)?.dataset?.theme;
  let varsToApply: Record<string, string> = {};
  if (themeRoot) {
    const computed = window.getComputedStyle(themeRoot);
    for (const v of LINK_POPUP_THEME_VARS) {
      const value = computed.getPropertyValue(v).trim();
      if (value) varsToApply[v] = value;
    }
  }
  // If theme root didn't have vars (or we didn't mount in it), use explicit theme or passed themeVariables.
  if (Object.keys(varsToApply).length === 0) {
    if (resolvedTheme === 'dark' || resolvedTheme === 'light') {
      varsToApply = getThemeVariablesForPopup({ theme: resolvedTheme });
    } else if (themeVariables && Object.keys(themeVariables).length > 0) {
      varsToApply = { ...themeVariables };
    }
  } else if (resolvedTheme === 'dark' || resolvedTheme === 'light') {
    const preset = getThemeVariablesForPopup({ theme: resolvedTheme });
    // When we have theme root, keep its computed background; ensure text vars come from preset so they match.
    const textVarKeys = ['--editor-text', '--editor-text-muted', '--link-popup-save-text'];
    if (Object.keys(varsToApply).length > 0) {
      for (const k of textVarKeys) {
        if (preset[k]) varsToApply[k] = preset[k];
      }
    } else {
      Object.assign(varsToApply, preset);
    }
  }
  if (varsToApply && Object.keys(varsToApply).length > 0) {
    for (const [key, value] of Object.entries(varsToApply)) {
      if (value) overlay.style.setProperty(key, value);
    }
    // Apply background and text color as inline styles from the same vars so they
    // always match (Bubble/iframe can break var() inheritance for text).
    const bg = varsToApply['--sidebar-bg'] || varsToApply['--toolbar-bg'] || varsToApply['--editor-bg'];
    const text = varsToApply['--editor-text'];
    const textMuted = varsToApply['--editor-text-muted'];
    const saveText = varsToApply['--link-popup-save-text'];
    if (bg) dialog.style.background = bg;
    if (text) {
      dialog.style.color = text;
      dialog.querySelectorAll('.bp-link-popup-title, .bp-link-popup-label, .bp-link-popup-checkbox-wrap').forEach((el) => {
        (el as HTMLElement).style.color = text;
      });
    }
    if (textMuted) {
      dialog.querySelectorAll('.bp-link-popup-close, .bp-link-popup-remove').forEach((el) => {
        (el as HTMLElement).style.color = textMuted;
      });
    }
    const input = dialog.querySelector('.bp-link-popup-input') as HTMLElement;
    if (input) {
      if (varsToApply['--editor-bg']) input.style.background = varsToApply['--editor-bg'];
      if (text) input.style.color = text;
    }
    const saveBtn = dialog.querySelector('.bp-link-popup-save') as HTMLElement;
    if (saveBtn && saveText) saveBtn.style.color = saveText;
  }
  if (resolvedTheme === 'dark' || resolvedTheme === 'light') {
    overlay.setAttribute('data-theme', resolvedTheme);
  }

  const overflowPrior = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const input = dialog.querySelector('#bp-link-url') as HTMLInputElement;
  input?.focus();
}
