import { ContentEditor } from '../editor/Editor';
import { Toolbar } from '../editor/Toolbar';
import { Sidebar } from '../editor/Sidebar';
import { BubbleMock, BubbleProperties } from '../mock/BubbleMock';
import { EventBridge } from './events';
import { ActionHandler } from './actions';
import { applyTheme, watchSystemTheme, ThemeProperties, getThemeVariablesForPopup } from '../utils/themeApplier';
import { buildPaletteFromTwoLists } from '../utils/colorOptions';

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
  /** Last HTML we synced to Bubble; only sync when content actually changes (avoids spurious updates from setEditable etc.). */
  private lastSyncedHtml: string | null = null;

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

    // Debug: what keys did Bubble send? (so we can find the right property for color list)
    const allKeys = Object.keys(props);
    console.warn('[TipTap] initialize() called – checking for color_palette');
    console.group('[TipTap color_palette]');
    console.log('All property keys from Bubble:', allKeys);
    const propsAny = props as unknown as Record<string, unknown>;
    const colorPaletteRaw = this.getEffectiveColorPaletteRaw(props, propsAny);
    console.log('effective color palette raw (two-list or color_palette):', colorPaletteRaw);
    if (colorPaletteRaw === undefined) {
      const maybe = allKeys.filter((k) => /color|palette|names|hex/i.test(k));
      console.warn('No color palette. Keys that might be relevant:', maybe.length ? maybe : '(none – add Color palette or Color names + Color hex codes)');
    } else if (Array.isArray(colorPaletteRaw)) {
      console.log('Bubble sent', colorPaletteRaw.length, 'items. first:', colorPaletteRaw[0]);
    }
    console.groupEnd();

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
      getThemeForPopup: () => getThemeVariablesForPopup(this.bubble.getProperties()),
    });

    if (!props.toolbar_visible) {
      this.toolbar.hide();
    }

    // Initialize sidebar (appended to main container, not editor wrapper)
    this.sidebar = new Sidebar({
      editor: this.editor,
      container: this.container, // Sidebar sits next to editor, not inside
      colorPalette: colorPaletteRaw,
      onCollapse: () => this.toggleSidebar(),
      getThemeForPopup: () => getThemeVariablesForPopup(this.bubble.getProperties()),
    });
    this.sidebar.hide();

    // Setup action handler
    this.actionHandler = new ActionHandler(this.editor, this.bubble);

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
      text_muted_color: props.text_muted_color,
      border_color: props.border_color,
      icon_color: props.icon_color,
      icon_active_color: props.icon_active_color,
      font_family: props.font_family,
      font_size: props.font_size,
      border_radius: props.border_radius,
      default_text_color: props.default_text_color,
    };

    // Apply theme to container so both editor and sidebar inherit accent/brand variables
    applyTheme(this.container, themeProps);
  }

  private handleEditorCreate(): void {
    // Do NOT sync state here. The editor is often still empty (initial_content from Bubble
    // hasn't arrived yet). Syncing would publish <p></p> and overwrite the bound field with empty.
  }

  private handleEditorUpdate(): void {
    // Only sync when document content actually changed. TipTap fires 'update' for other reasons
    // (e.g. setEditable()), which would otherwise cause constant state publishes in Bubble.
    const rawHtml = this.editor?.getHTML() ?? '';
    const htmlForStorage = this.sanitizeHtmlForStorage(rawHtml);
    if (htmlForStorage !== this.lastSyncedHtml) {
      this.lastSyncedHtml = htmlForStorage;
      this.syncStatesToBubble();
      this.eventBridge.triggerDebounced('content_changed', {
        html: rawHtml,
        isEmpty: this.editor?.isEmpty(),
      });
    }
  }

  private handleEditorFocus(): void {
    this.eventBridge.trigger('editor_focused');
  }

  private handleEditorBlur(): void {
    // Always sync on blur so Bubble has latest content even if we skipped intermediate updates.
    this.syncStatesToBubble();
    this.eventBridge.trigger('editor_blurred');
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
    this.lastSyncedHtml = htmlForStorage;
  }

  private handlePropertyChanges(changes: Partial<BubbleProperties>): void {
    if (!this.editor) return;

    // Apply initial_content only when editor is empty and we have content (first load); cooldown avoids flashing.
    if ('initial_content' in changes && changes.initial_content !== undefined) {
      const html = typeof changes.initial_content === 'string' ? changes.initial_content : '';
      const editor = this.editor;
      const now = Date.now();
      const inCooldown = now - this.lastInitialContentApplyAt < BubbleElement.INITIAL_CONTENT_APPLY_COOLDOWN_MS;
      const shouldApply =
        editor &&
        editor.isEmpty() &&
        !this.isEffectivelyEmptyHtml(html) &&
        !inCooldown;
      if (shouldApply) {
        this.lastInitialContentApplyAt = now;
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
      if (changes.toolbar_visible && !this.sidebarExpanded) {
        this.toolbar?.show();
      } else if (!changes.toolbar_visible) {
        this.toolbar?.hide();
      }
      // When sidebar is expanded, never show toolbar (keep it hidden until user collapses sidebar)
    }

    if ('min_height' in changes || 'max_height' in changes) {
      this.applyDimensionStyles(this.bubble.getProperties());
    }

    // Handle theme property changes
    const themeProps = [
      'theme', 'accent_color', 'background_color', 'toolbar_background',
      'text_muted_color', 'border_color', 'icon_color',
      'icon_active_color', 'font_family', 'font_size', 'border_radius',
      'default_text_color',
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

    if ('color_palette' in changes || 'color_names' in changes || 'color_hex_codes' in changes) {
      const props = this.bubble.getProperties();
      const propsAny = props as unknown as Record<string, unknown>;
      const raw = this.getEffectiveColorPaletteRaw(props, propsAny);
      this.sidebar?.refreshColorPalette(raw);
    }
  }

  /**
   * Prefer two list-of-strings (color_names + color_hex_codes) when both set; otherwise use color_palette.
   * Bubble often does not send option set custom attributes (e.g. "Hex code") for "list of option set".
   */
  private getEffectiveColorPaletteRaw(
    props: BubbleProperties & { color_names?: unknown; color_hex_codes?: unknown },
    propsAny: Record<string, unknown>
  ): unknown {
    const namesRaw =
      props.color_names ??
      propsAny['Color names'] ??
      propsAny['Color display names'] ??
      (props as unknown as Record<string, unknown>)['AAS'];
    const hexesRaw =
      props.color_hex_codes ??
      propsAny['Color hex codes'] ??
      (props as unknown as Record<string, unknown>)['AAT'];
    if (namesRaw != null && hexesRaw != null) {
      const fromTwo = buildPaletteFromTwoLists(namesRaw, hexesRaw);
      if (fromTwo.length > 0) return fromTwo;
    }
    return (
      props.color_palette ??
      (props as unknown as { colorPalette?: unknown }).colorPalette ??
      propsAny['Color palette'] ??
      propsAny['color_palette']
    );
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
