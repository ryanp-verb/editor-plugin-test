import { ContentEditor } from '../editor/Editor';
import { Toolbar } from '../editor/Toolbar';
import { Sidebar } from '../editor/Sidebar';
import { BubbleMock, BubbleProperties } from '../mock/BubbleMock';
import { EventBridge } from './events';
import { ActionHandler } from './actions';
import { applyTheme, watchSystemTheme, ThemeProperties } from '../utils/themeApplier';

export interface BubbleElementConfig {
  container: HTMLElement;
  bubble: BubbleMock;
}

/**
 * BubbleElement - The main integration layer between the TipTap editor and Bubble.io
 * 
 * This class:
 * - Creates and manages the editor instance
 * - Syncs Bubble properties to editor config
 * - Publishes editor state back to Bubble
 * - Routes events and actions between Bubble and the editor
 */
export class BubbleElement {
  private container: HTMLElement;
  private bubble: BubbleMock;
  private editor: ContentEditor | null = null;
  private toolbar: Toolbar | null = null;
  private sidebar: Sidebar | null = null;
  private sidebarExpanded = false;
  private eventBridge: EventBridge;
  private actionHandler: ActionHandler | null = null;
  private editorWrapper: HTMLElement | null = null;
  private unsubscribeProps: (() => void) | null = null;
  private unsubscribeSystemTheme: (() => void) | null = null;
  private lastInitialContentApplyAt = 0;
  private static readonly INITIAL_CONTENT_APPLY_COOLDOWN_MS = 1500;
  /** Debounce: publish html_content at most this often while typing; always publish on blur. */
  private static readonly PUBLISH_DEBOUNCE_MS = 1500;
  private publishDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  /** Cooldown after Set content (e.g. Revert) before "ready for revert" is true again; avoids double-apply. */
  private static readonly READY_FOR_REVERT_COOLDOWN_MS = 400;
  private readyForRevertCooldownTimer: ReturnType<typeof setTimeout> | null = null;
  /** State key in Bubble for "Ready for revert" (bind button disabled when false). */
  private static readonly STATE_READY_FOR_REVERT = 'ready_for_revert';
  /** After applying set_content_trigger, ignore it for this long to break Update echo loops. */
  private static readonly SET_CONTENT_TRIGGER_COOLDOWN_MS = 2000;
  private lastSetContentTriggerApplyAt = 0;
  /** Skip the next sync/content_changed when we just applied initial_content to avoid a loop. */
  private skipNextSync = false;

  constructor(config: BubbleElementConfig) {
    this.container = config.container;
    this.bubble = config.bubble;
    this.eventBridge = new EventBridge(this.bubble);
  }

  /**
   * Initialize the editor element
   */
  initialize(): void {
    const props = this.bubble.getProperties();

    // Make container a flex layout for editor + sidebar
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'row';
    this.container.style.height = '100%';
    this.container.style.overflow = 'hidden';

    // Create editor wrapper (will flex to fill available space)
    this.editorWrapper = document.createElement('div');
    this.editorWrapper.className = 'bubble-editor-wrapper';
    this.editorWrapper.style.flex = '1';
    this.editorWrapper.style.minWidth = '0'; // Allow flex shrinking
    this.editorWrapper.style.overflow = 'hidden';
    this.container.appendChild(this.editorWrapper);

    // Create content area
    const contentArea = document.createElement('div');
    contentArea.className = 'editor-content';
    this.editorWrapper.appendChild(contentArea);

    // Initialize editor (placeholder via getter so it always reads current value from Bubble)
    const initialContent = props.initial_content || '';
    this.editor = new ContentEditor({
      element: contentArea,
      getPlaceholder: () => {
        const p = this.bubble.getProperties();
        return (p.placeholder && String(p.placeholder).trim()) || 'Start writing...';
      },
      content: initialContent,
      editable: props.editable,
      onUpdate: () => this.handleEditorUpdate(),
      onFocus: () => this.handleEditorFocus(),
      onBlur: () => this.handleEditorBlur(),
      onCreate: () => this.handleEditorCreate(),
    });
    // Initialize toolbar
    this.toolbar = new Toolbar({
      editor: this.editor,
      container: this.editorWrapper,
      onToggleSidebar: () => this.toggleSidebar(),
    });

    if (!props.toolbar_visible) {
      this.toolbar.hide();
    }

    // Initialize sidebar (appended to main container, not editor wrapper)
    this.sidebar = new Sidebar({
      editor: this.editor,
      container: this.container, // Sidebar sits next to editor, not inside
      onCollapse: () => this.toggleSidebar(),
    });
    this.sidebar.hide();

    // Setup action handler (onSetContent: cooldown "ready for revert" and sync reverted content immediately)
    this.actionHandler = new ActionHandler(this.editor, this.bubble, {
      onSetContent: () => this.handleSetContentFromAction(),
    });

    // Listen for property changes
    this.unsubscribeProps = this.bubble.onPropertyChange((changes) => {
      this.handlePropertyChanges(changes);
    });

    // Deferred refresh so placeholder picks up values from Bubble's update (which may run same tick)
    queueMicrotask(() => {
      this.editor?.refreshPlaceholder();
    });

    // Apply initial styles
    this.applyDimensionStyles(props);
    
    // Apply theme
    this.applyThemeFromProps(props);
    
    // Watch for system theme changes if using auto mode
    if (props.theme === 'auto') {
      this.unsubscribeSystemTheme = watchSystemTheme(() => {
        this.applyThemeFromProps(this.bubble.getProperties());
      });
    }
  }
  
  private applyThemeFromProps(props: BubbleProperties): void {
    if (!this.editorWrapper) return;

    const themeProps: Partial<ThemeProperties> = {
      theme: props.theme,
      brand_primary: props.brand_primary || props.accent_color,
      brand_light_1: props.brand_light_1,
      brand_light_2: props.brand_light_2,
      brand_dark_1: props.brand_dark_1,
      accent_color: props.accent_color,
      background_color: props.background_color,
      toolbar_background: props.toolbar_background,
      text_color: props.text_color,
      text_muted_color: props.text_muted_color,
      border_color: props.border_color,
      icon_color: props.icon_color,
      icon_active_color: props.icon_active_color,
      font_family: props.font_family,
      font_size: props.font_size,
      border_radius: props.border_radius,
    };

    // Apply theme to container so both editor and sidebar inherit accent/brand variables
    applyTheme(this.container, themeProps);
  }

  private handleEditorCreate(): void {
    // Do NOT sync state here. The editor is often still empty (initial_content from Bubble
    // hasn't arrived yet). Syncing would publish <p></p> and the workflow would overwrite
    // the draft field with empty. First sync happens on first edit or blur instead.
    this.bubble.publishState(BubbleElement.STATE_READY_FOR_REVERT, true);
  }

  private handleEditorUpdate(): void {
    // When we just applied initial_content, skip one sync so we don't fire content_changed and
    // trigger the user's workflow (draft = content), which would make Bubble re-run Update in a loop.
    if (this.skipNextSync) {
      this.skipNextSync = false;
      return;
    }
    // Debounce publishing to Bubble so the draft field isn't updated on every keystroke
    this.scheduleSyncToBubble();
    this.eventBridge.triggerDebounced('content_changed', {
      html: this.editor?.getHTML(),
      isEmpty: this.editor?.isEmpty(),
    });
  }

  private handleEditorFocus(): void {
    this.eventBridge.trigger('editor_focused');
  }

  private handleEditorBlur(): void {
    this.cancelScheduledSync();
    this.syncStatesToBubble();
    this.eventBridge.trigger('editor_blurred');
  }

  private scheduleSyncToBubble(): void {
    if (this.publishDebounceTimer !== null) return;
    this.publishDebounceTimer = setTimeout(() => {
      this.publishDebounceTimer = null;
      this.syncStatesToBubble();
    }, BubbleElement.PUBLISH_DEBOUNCE_MS);
  }

  private cancelScheduledSync(): void {
    if (this.publishDebounceTimer !== null) {
      clearTimeout(this.publishDebounceTimer);
      this.publishDebounceTimer = null;
    }
  }

  /** Called when Set content action runs (e.g. Revert). Cooldown "ready for revert" and sync now. */
  private handleSetContentFromAction(): void {
    this.bubble.publishState(BubbleElement.STATE_READY_FOR_REVERT, false);
    this.cancelScheduledSync();
    this.syncStatesToBubble();
    if (this.readyForRevertCooldownTimer !== null) {
      clearTimeout(this.readyForRevertCooldownTimer);
    }
    this.readyForRevertCooldownTimer = setTimeout(() => {
      this.readyForRevertCooldownTimer = null;
      this.bubble.publishState(BubbleElement.STATE_READY_FOR_REVERT, true);
    }, BubbleElement.READY_FOR_REVERT_COOLDOWN_MS);
  }

  /** Strip editor-only attributes from HTML so saved content is clean (e.g. no contenteditable on resize handles) */
  private sanitizeHtmlForStorage(html: string): string {
    return html.replace(/\s+contenteditable="false"/gi, '').replace(/\s+contenteditable='false'/gi, '');
  }

  /** True if HTML is empty or just an empty paragraph (don't use for initial load - avoids overwriting with empty) */
  private isEffectivelyEmptyHtml(html: string): boolean {
    const trimmed = html.trim();
    return !trimmed || trimmed === '<p></p>' || trimmed === '<p><br></p>' || trimmed === '<p><br/></p>';
  }

  private syncStatesToBubble(): void {
    if (!this.editor) return;

    const stats = this.editor.getStats();
    const rawHtml = this.editor.getHTML();
    const htmlForStorage = this.sanitizeHtmlForStorage(rawHtml);

    // Bubble uses individual publishState calls, not batch
    // State names must match what's defined in Bubble plugin
    this.bubble.publishState('html_content', htmlForStorage);
    this.bubble.publishState('is_empty', stats.isEmpty);
    this.bubble.publishState('word_count', stats.wordCount);
    this.bubble.publishState('json_content', JSON.stringify(this.editor.getJSON()));
  }

  private handlePropertyChanges(changes: Partial<BubbleProperties>): void {
    if (!this.editor) return;

    // Set content trigger: when workflow sets this property (e.g. to saved HTML), replace editor content.
    // Cooldown: after we apply once, ignore trigger for 2s so repeated Updates from Bubble don't re-apply (loop).
    // Also skip when incoming matches current content.
    if ('set_content_trigger' in changes && changes.set_content_trigger !== undefined) {
      const html = typeof changes.set_content_trigger === 'string' ? changes.set_content_trigger : '';
      if (html && !this.isEffectivelyEmptyHtml(html)) {
        const now = Date.now();
        const inCooldown = now - this.lastSetContentTriggerApplyAt < BubbleElement.SET_CONTENT_TRIGGER_COOLDOWN_MS;
        const normalizedIncoming = this.sanitizeHtmlForStorage(html);
        const currentHtml = this.sanitizeHtmlForStorage(this.editor.getHTML());
        if (!inCooldown && normalizedIncoming !== currentHtml) {
          this.lastSetContentTriggerApplyAt = now;
          const editor = this.editor;
          if (typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame(() => {
              editor!.setContent(html);
              this.handleSetContentFromAction();
            });
          } else {
            setTimeout(() => {
              editor!.setContent(html);
              this.handleSetContentFromAction();
            }, 0);
          }
        }
      }
    }

    // One-way binding (like reference plugin): use initial_content only at first load.
    // Never re-apply from property updates after that — avoids echo overwriting.
    if ('initial_content' in changes && changes.initial_content !== undefined) {
      const html = typeof changes.initial_content === 'string' ? changes.initial_content : '';
      const editor = this.editor;
      const now = Date.now();
      const inCooldown = now - this.lastInitialContentApplyAt < BubbleElement.INITIAL_CONTENT_APPLY_COOLDOWN_MS;
      const isLoadWhileEmpty =
        editor.isEmpty() && !this.isEffectivelyEmptyHtml(html) && !inCooldown;
      const shouldApply = editor && !this.isEffectivelyEmptyHtml(html) && isLoadWhileEmpty;
      if (shouldApply) {
        this.lastInitialContentApplyAt = now;
        this.skipNextSync = true; // avoid sync → content_changed → workflow → Update loop
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(() => editor!.setContent(html));
        } else {
          setTimeout(() => editor!.setContent(html), 0);
        }
      }
    }

    if ('placeholder' in changes) {
      this.editor.refreshPlaceholder();
    }

    if ('editable' in changes && changes.editable !== undefined) {
      this.editor.setEditable(changes.editable);
    }

    if ('toolbar_visible' in changes && changes.toolbar_visible !== undefined) {
      if (changes.toolbar_visible) {
        this.toolbar?.show();
      } else {
        this.toolbar?.hide();
      }
    }

    if ('min_height' in changes || 'max_height' in changes) {
      this.applyDimensionStyles(this.bubble.getProperties());
    }

    // Handle theme property changes
    const themeProps = [
      'theme', 'accent_color', 'background_color', 'toolbar_background',
      'text_color', 'text_muted_color', 'border_color', 'icon_color',
      'icon_active_color', 'font_family', 'font_size', 'border_radius'
    ];
    
    if (themeProps.some(prop => prop in changes)) {
      this.applyThemeFromProps(this.bubble.getProperties());
      
      // Update system theme watcher if theme mode changed
      if ('theme' in changes) {
        this.unsubscribeSystemTheme?.();
        this.unsubscribeSystemTheme = null;
        
        if (changes.theme === 'auto') {
          this.unsubscribeSystemTheme = watchSystemTheme(() => {
            this.applyThemeFromProps(this.bubble.getProperties());
          });
        }
      }
    }
  }

  private applyDimensionStyles(props: BubbleProperties): void {
    if (!this.editorWrapper) return;
    
    this.editorWrapper.style.minHeight = `${props.min_height}px`;
    if (props.max_height > 0) {
      this.editorWrapper.style.maxHeight = `${props.max_height}px`;
    }
  }

  /**
   * Get the editor instance (for external access if needed)
   */
  getEditor(): ContentEditor | null {
    return this.editor;
  }

  /**
   * Get the toolbar instance
   */
  getToolbar(): Toolbar | null {
    return this.toolbar;
  }

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar(): void {
    this.sidebarExpanded = !this.sidebarExpanded;
    
    if (this.sidebarExpanded) {
      this.sidebar?.show();
      this.toolbar?.hide();
    } else {
      this.sidebar?.hide();
      this.toolbar?.show();
    }
    
    this.toolbar?.setSidebarExpanded(this.sidebarExpanded);
  }

  /**
   * Set sidebar expanded state
   */
  setSidebarExpanded(expanded: boolean): void {
    if (this.sidebarExpanded !== expanded) {
      this.toggleSidebar();
    }
  }

  /**
   * Destroy the element and clean up
   */
  destroy(): void {
    this.cancelScheduledSync();
    if (this.readyForRevertCooldownTimer !== null) {
      clearTimeout(this.readyForRevertCooldownTimer);
      this.readyForRevertCooldownTimer = null;
    }
    this.unsubscribeProps?.();
    this.unsubscribeSystemTheme?.();
    this.actionHandler?.destroy();
    this.eventBridge.destroy();
    this.toolbar?.destroy();
    this.sidebar?.destroy();
    this.editor?.destroy();
    
    if (this.editorWrapper) {
      this.editorWrapper.remove();
      this.editorWrapper = null;
    }

    this.editor = null;
    this.toolbar = null;
    this.actionHandler = null;
  }
}
