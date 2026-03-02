/**
 * Sidebar - BP Brand Formatting Panel
 * 
 * Matches Figma design with:
 * - Text controls (headings, size)
 * - Formatting (alignment, bold, italic, etc.)
 * - Color palettes for text and backgrounds
 * - Border/corner visual controls
 * - Padding controls with ALL toggle
 */

import { ContentEditor, EditorCommandOptions } from './Editor';
import { showLinkPopup } from './LinkPopup';
import { defaultColorPalette } from '../utils/themeApplier';

/** Run editor commands without focusing (keeps toolbar hidden when sidebar is open). */
const NO_FOCUS: EditorCommandOptions = { focus: false };
import { icons } from '../utils/icons';
import { DragDropManager, DragData } from '../utils/DragDropManager';
import { createLinkAllControlHTML } from '../components/LinkAllControl';
import { createRadiusCornerControlHTML, getCornerPathPx, type RadiusCorner } from '../components/RadiusCornerControl';
import { createColorDropdownHTML, type ColorDropdownTarget } from '../components/ColorDropdown';
import { parseLengthInput, lengthToPxForDemo } from '../utils/parseLength';
import { normalizeColorPalette, type ColorOption, type BubbleColorThing } from '../utils/colorOptions';

export interface SidebarConfig {
  editor: ContentEditor;
  container: HTMLElement;
  /** List of colors (Bubble option set or ColorOption[] or legacy string[]); normalized to ColorOption[] internally. */
  colorPalette?: unknown;
  onCollapse?: () => void;
  /** Returns current theme variables for the link popup (text/input colors in light/dark). */
  getThemeForPopup?: () => Record<string, string>;
}

interface BlockStyleState {
  textAlign: 'left' | 'center' | 'right' | 'justify';
  textColor: string;
  backgroundColor: string;
  borderTop: number;
  borderRight: number;
  borderBottom: number;
  borderLeft: number;
  borderColor: string;
  borderRadiusTopLeft: number | string;
  borderRadiusTopRight: number | string;
  borderRadiusBottomRight: number | string;
  borderRadiusBottomLeft: number | string;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  // Index signature for dynamic access
  [key: string]: string | number;
}

export class Sidebar {
  private editor: ContentEditor;
  private container: HTMLElement;
  private element: HTMLElement;
  private colorPalette: ColorOption[];
  private onCollapse?: () => void;
  private getThemeForPopup?: () => Record<string, string>;
  private dragDropManager: DragDropManager | null = null;
  
  // Current state for block styling
  private blockStyle: BlockStyleState = {
    textAlign: 'left',
    textColor: '#121000',
    backgroundColor: 'transparent',
    borderTop: 0,
    borderRight: 0,
    borderBottom: 0,
    borderLeft: 0,
    borderColor: '#007f00',
    borderRadiusTopLeft: 0,
    borderRadiusTopRight: 0,
    borderRadiusBottomRight: 0,
    borderRadiusBottomLeft: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
  };

  // Toggle states
  private borderAllLinked = false; // Default: sides unlinked
  private radiusAllLinked = true;
  private paddingAllLinked = true;

  constructor(config: SidebarConfig) {
    this.editor = config.editor;
    this.container = config.container;
    const raw = config.colorPalette as ColorOption[] | string[] | BubbleColorThing[] | undefined | null;
    const normalized = normalizeColorPalette(raw);
    this.colorPalette = normalized?.length ? normalized : defaultColorPalette;
    this.onCollapse = config.onCollapse;
    this.getThemeForPopup = config.getThemeForPopup;
    this.element = this.createSidebar();
    this.container.appendChild(this.element);
    this.setupUpdateListener();
    this.setupDraggableButtons();
    this.initDragDrop();
  }

  private initDragDrop(): void {
    // Delayed initialization to ensure editor element exists
    setTimeout(() => {
      const editorWrapper = this.container.closest('.app')?.querySelector('.editor-wrapper');
      const editorElement = editorWrapper?.querySelector('.tiptap') as HTMLElement;
      if (editorElement) {
        this.dragDropManager = new DragDropManager({
          editor: this.editor.getTipTapEditor(),
          editorElement,
          brandColor: 'var(--brand-primary, #007f00)',
        });
      }
    }, 100);
  }

  private createSidebar(): HTMLElement {
    const sidebar = document.createElement('div');
    sidebar.className = 'bp-sidebar';
    sidebar.innerHTML = `
      ${this.createHeader()}
      <div class="bp-sidebar-scroll">
        ${this.createTextSection()}
        ${this.createFormattingSection()}
        ${this.createTextColorSection()}
        ${this.createElementsSection()}
        ${this.createBordersSection()}
        ${this.createBackgroundsSection()}
        ${this.createLayoutSection()}
      </div>
    `;
    
    this.bindEvents(sidebar);
    return sidebar;
  }

  private createHeader(): string {
    return `
      <div class="bp-sidebar-header">
        <div class="bp-header-controls">
          <button class="bp-btn bp-btn-icon" data-action="undo" title="Undo (Ctrl+Z)">
            ${icons.undo}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="redo" title="Redo (Ctrl+Y)">
            ${icons.redo}
          </button>
        </div>
        <button class="bp-sidebar-close" data-action="collapse" title="Switch to compact toolbar">
          ${icons.collapse}
        </button>
      </div>
    `;
  }

  private createTextSection(): string {
    return `
      <section class="bp-sidebar-section">
        <h3 class="bp-sidebar-title">Text</h3>
        <div class="bp-control-group">
          <label class="bp-control-label">Heading</label>
          <div class="bp-btn-row">
            <button class="bp-btn" data-action="heading" data-level="1" title="Heading 1">H1</button>
            <button class="bp-btn" data-action="heading" data-level="2" title="Heading 2">H2</button>
            <button class="bp-btn" data-action="heading" data-level="3" title="Heading 3">H3</button>
            <button class="bp-btn" data-action="heading" data-level="4" title="Heading 4">H4</button>
            <button class="bp-btn" data-action="heading" data-level="5" title="Heading 5">H5</button>
            <button class="bp-btn" data-action="heading" data-level="6" title="Heading 6">H6</button>
            <button class="bp-btn bp-btn-wide active" data-action="paragraph" title="Paragraph">P</button>
          </div>
        </div>
        <div class="bp-control-group">
          <label class="bp-control-label">Text size</label>
          <div class="bp-btn-row">
            <button class="bp-btn" data-action="textSize" data-size="small" title="Small">S</button>
            <button class="bp-btn active" data-action="textSize" data-size="medium" title="Medium">M</button>
            <button class="bp-btn" data-action="textSize" data-size="large" title="Large">L</button>
            <button class="bp-btn" data-action="textSize" data-size="xlarge" title="Extra Large">XL</button>
          </div>
        </div>
      </section>
    `;
  }

  private createFormattingSection(): string {
    return `
      <section class="bp-sidebar-section">
        <h3 class="bp-sidebar-title">Formatting</h3>
        <div class="bp-btn-row">
          <button class="bp-btn bp-btn-icon active" data-action="align" data-align="left" title="Align Left">
            ${icons.alignLeft}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="align" data-align="center" title="Align Center">
            ${icons.alignCenter}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="align" data-align="right" title="Align Right">
            ${icons.alignRight}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="align" data-align="justify" title="Justify">
            ${icons.alignJustify}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="bold" title="Bold">
            ${icons.bold}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="italic" title="Italic">
            ${icons.italic}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="strike" title="Strikethrough">
            ${icons.strike}
          </button>
        </div>
        <div class="bp-btn-row" style="margin-top: 8px;">
          <button class="bp-btn bp-btn-icon" data-action="blockquote" title="Quote">
            ${icons.quote}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="bulletList" title="Bullet List">
            ${icons.bulletList}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="orderedList" title="Numbered List">
            ${icons.orderedList}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="taskList" title="Task List">
            ${icons.taskList}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="code" title="Inline Code">
            ${icons.code}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="link" title="Insert Link">
            ${icons.link}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="clearFormatting" title="Clear Formatting">
            ${icons.clearFormat}
          </button>
        </div>
      </section>
    `;
  }

  private createTextColorSection(): string {
    return `
      <section class="bp-sidebar-section">
        <h3 class="bp-sidebar-title">Text color</h3>
        ${createColorDropdownHTML({
          target: 'textColor',
          colors: this.colorPalette,
          value: this.blockStyle.textColor,
          label: '',
          includeTransparent: true,
          transparentLabel: 'Transparent',
        })}
      </section>
    `;
  }

  private createElementsSection(): string {
    return `
      <section class="bp-sidebar-section">
        <h3 class="bp-sidebar-title">Elements</h3>
        <div class="bp-btn-row">
          <button class="bp-btn bp-btn-icon draggable" data-action="table" data-drag-type="table" title="Insert Table (drag or click)">
            ${icons.table}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="insertLink" title="Insert Link">
            ${icons.link}
          </button>
          <button class="bp-btn bp-btn-icon draggable" data-action="image" data-drag-type="image" title="Insert Image (drag or click)">
            ${icons.image}
          </button>
          <button class="bp-btn bp-btn-icon draggable" data-action="divider" data-drag-type="horizontalRule" title="Insert Divider (drag or click)">
            ${icons.divider}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="lineBreak" title="Line Break">
            ${icons.lineBreak}
          </button>
          <button class="bp-btn bp-btn-icon draggable" data-action="divBlock" data-drag-type="divBlock" title="Div Block (drag or click)">
            ${icons.divBlock}
          </button>
          <button class="bp-btn bp-btn-icon draggable" data-action="codeBlock" data-drag-type="codeBlock" title="Code Block (drag or click)">
            ${icons.codeBlock}
          </button>
          <button class="bp-btn bp-btn-icon draggable" data-action="blockquote" data-drag-type="blockquote" title="Quote (drag or click)">
            ${icons.quote}
          </button>
        </div>
      </section>
    `;
  }

  private createBordersSection(): string {
    return `
      <section class="bp-sidebar-section bp-section-expanded">
        <h3 class="bp-sidebar-title">Borders & corners</h3>
        <div class="bp-container-target">
          <span class="bp-target-label">Target:</span>
          <span class="bp-target-name">Parent container</span>
          <button class="bp-btn bp-btn-xs" data-action="selectContainer" title="Select container block">
            ${icons.cursor}
          </button>
        </div>
        <div class="bp-borders-row">
          <div class="bp-border-control" data-control="border">
            <div class="bp-border-visual">
              <button class="bp-border-side bp-border-top" data-side="top" title="Top border">
                <span class="bp-border-bar"></span>
              </button>
              <button class="bp-border-side bp-border-right" data-side="right" title="Right border">
                <span class="bp-border-bar"></span>
              </button>
              <button class="bp-border-side bp-border-bottom" data-side="bottom" title="Bottom border">
                <span class="bp-border-bar"></span>
              </button>
              <button class="bp-border-side bp-border-left" data-side="left" title="Left border">
                <span class="bp-border-bar"></span>
              </button>
              <div class="bp-border-center">
                ${createLinkAllControlHTML({
                  dataAction: 'borderAll',
                  dataSide: 'all',
                  linked: this.borderAllLinked,
                  className: 'bp-btn-link-all bp-border-all',
                })}
              </div>
            </div>
          </div>
          <div class="bp-radius-control" data-control="radius">
            <div class="bp-radius-corner-group">
              <div class="bp-radius-corner-controls${this.radiusAllLinked ? ' all-linked' : ''}" data-radius-corner-controls>
                ${createRadiusCornerControlHTML({
                  corner: 'topLeft',
                  valueDisplay: this.formatRadiusForDisplay(this.blockStyle.borderRadiusTopLeft),
                  active: !this.isRadiusOff(this.blockStyle.borderRadiusTopLeft),
                  radiusValuePx: this.radiusToPxForDemo(this.blockStyle.borderRadiusTopLeft),
                })}
                ${createRadiusCornerControlHTML({
                  corner: 'topRight',
                  valueDisplay: this.formatRadiusForDisplay(this.blockStyle.borderRadiusTopRight),
                  active: !this.isRadiusOff(this.blockStyle.borderRadiusTopRight),
                  radiusValuePx: this.radiusToPxForDemo(this.blockStyle.borderRadiusTopRight),
                })}
                ${createRadiusCornerControlHTML({
                  corner: 'bottomLeft',
                  valueDisplay: this.formatRadiusForDisplay(this.blockStyle.borderRadiusBottomLeft),
                  active: !this.isRadiusOff(this.blockStyle.borderRadiusBottomLeft),
                  radiusValuePx: this.radiusToPxForDemo(this.blockStyle.borderRadiusBottomLeft),
                })}
                ${createRadiusCornerControlHTML({
                  corner: 'bottomRight',
                  valueDisplay: this.formatRadiusForDisplay(this.blockStyle.borderRadiusBottomRight),
                  active: !this.isRadiusOff(this.blockStyle.borderRadiusBottomRight),
                  radiusValuePx: this.radiusToPxForDemo(this.blockStyle.borderRadiusBottomRight),
                })}
              </div>
              <div class="bp-radius-all-center">
                ${createLinkAllControlHTML({
                  dataAction: 'toggleRadiusAll',
                  linked: this.radiusAllLinked,
                  value: typeof this.blockStyle.borderRadiusTopLeft === 'number' ? this.blockStyle.borderRadiusTopLeft : 0,
                  valueDisplay: this.formatRadiusForDisplay(this.blockStyle.borderRadiusTopLeft),
                  showValue: true,
                  valueAsInput: true,
                  valueInputData: 'radius',
                  className: 'bp-btn-link-all',
                })}
              </div>
            </div>
          </div>
          <div class="bp-border-inputs">
            <div class="bp-input-row">
              <input type="number" class="bp-input bp-input-sm" data-input="borderWidth" value="0" min="0" max="50">
              <span class="bp-input-unit">px</span>
            </div>
          </div>
        </div>
        <div class="bp-control-group">
          <label class="bp-control-label">Border width</label>
          <div class="bp-btn-row">
            <button class="bp-btn bp-btn-icon active" data-action="borderWidth" data-width="0" title="No border">
              ${icons.borderNone}
            </button>
            <button class="bp-btn bp-btn-icon" data-action="borderWidth" data-width="2" title="Thin border">
              ${icons.borderThin}
            </button>
            <button class="bp-btn bp-btn-icon" data-action="borderWidth" data-width="4" title="Medium border">
              ${icons.borderMedium}
            </button>
            <button class="bp-btn bp-btn-icon" data-action="borderWidth" data-width="6" title="Thick border">
              ${icons.borderThick}
            </button>
          </div>
        </div>
        ${createColorDropdownHTML({
          target: 'borderColor',
          colors: this.colorPalette,
          value: this.blockStyle.borderColor,
          label: 'Border color',
          includeTransparent: true,
          transparentLabel: 'No border',
        })}
      </section>
    `;
  }

  private createBackgroundsSection(): string {
    return `
      <section class="bp-sidebar-section">
        <h3 class="bp-sidebar-title">Backgrounds</h3>
        <div class="bp-control-group">
          ${createColorDropdownHTML({
            target: 'backgroundColor',
            colors: this.colorPalette,
            value: this.blockStyle.backgroundColor,
            label: 'Background colors',
            includeTransparent: true,
            includeWhite: true,
            transparentLabel: 'Transparent',
          })}
        </div>
      </section>
    `;
  }

  private createLayoutSection(): string {
    return `
      <section class="bp-sidebar-section">
        <h3 class="bp-sidebar-title">Layout</h3>
        <div class="bp-control-group">
          <label class="bp-control-label">Columns & rows</label>
          <div class="bp-btn-row">
            <button class="bp-btn bp-btn-icon" data-action="columns" data-cols="1" title="1 Column">
              ${icons.col1}
            </button>
            <button class="bp-btn bp-btn-icon draggable" data-action="columns" data-cols="2" data-drag-type="columnLayout" data-drag-columns="2" title="2 Columns (drag or click)">
              ${icons.col2}
            </button>
            <button class="bp-btn bp-btn-icon draggable" data-action="columns" data-cols="3" data-drag-type="columnLayout" data-drag-columns="3" title="3 Columns (drag or click)">
              ${icons.col3}
            </button>
            <button class="bp-btn bp-btn-icon draggable" data-action="columns" data-cols="1-2" data-drag-type="columnLayout" data-drag-columns="2" title="1/3 + 2/3 (drag or click)">
              ${icons.col1_2}
            </button>
            <button class="bp-btn bp-btn-icon draggable" data-action="columns" data-cols="2-1" data-drag-type="columnLayout" data-drag-columns="2" title="2/3 + 1/3 (drag or click)">
              ${icons.col2_1}
            </button>
            <button class="bp-btn bp-btn-icon draggable" data-action="columns" data-cols="4" data-drag-type="columnLayout" data-drag-columns="4" title="4 Columns (drag or click)">
              ${icons.col4}
            </button>
          </div>
        </div>
        <div class="bp-control-group">
          <label class="bp-control-label">Padding</label>
          <div class="bp-padding-control">
            <div class="bp-padding-visual">
              <input type="number" class="bp-input bp-padding-input bp-padding-top" data-padding="top" value="0" min="0" placeholder="0">
              <input type="number" class="bp-input bp-padding-input bp-padding-right" data-padding="right" value="0" min="0" placeholder="0">
              <input type="number" class="bp-input bp-padding-input bp-padding-bottom" data-padding="bottom" value="0" min="0" placeholder="0">
              <input type="number" class="bp-input bp-padding-input bp-padding-left" data-padding="left" value="0" min="0" placeholder="0">
              <div class="bp-padding-center">
                ${createLinkAllControlHTML({
                  dataAction: 'togglePaddingAll',
                  linked: this.paddingAllLinked,
                  value: this.blockStyle.paddingTop,
                  valueDisplay: String(this.blockStyle.paddingTop),
                  showValue: true,
                  valueAsInput: true,
                  valueInputData: 'padding',
                  className: 'bp-btn-link-all',
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  private bindEvents(sidebar: HTMLElement): void {
    // Button clicks - stop propagation so parent/editor focus handlers don't run (keeps toolbar hidden)
    sidebar.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = e.target as HTMLElement;
      const btn = target.closest('[data-action]') as HTMLElement;
      if (btn) {
        this.handleAction(btn);
      }
      
      // Border side clicks
      const borderSide = target.closest('.bp-border-side, .bp-border-all') as HTMLElement;
      if (borderSide) {
        this.handleBorderSideClick(borderSide);
      }
      
      // Radius corner clicks (legacy .bp-radius-corner or new .bp-radius-corner-control; not when clicking the input)
      if (!target.closest('.bp-radius-corner-control-input')) {
        const radiusCorner = target.closest('.bp-radius-corner, .bp-radius-corner-control') as HTMLElement;
        if (radiusCorner) {
          this.handleRadiusCornerClick(radiusCorner);
        }
      }
    });
    
    // Input changes
    sidebar.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.dataset.padding) {
        this.handlePaddingChange(target);
      }
      if (target.dataset.input) {
        this.handleInputChange(target);
      }
    });
    sidebar.addEventListener('blur', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.dataset.linkAllValue) {
        this.handleLinkAllValueInput(target);
      }
      if (target.dataset.radiusCorner) {
        this.handleRadiusCornerInput(target);
      }
    }, true);

    // Color dropdown: trigger toggles panel; option click selects and closes; outside click closes
    sidebar.addEventListener('click', (e) => {
      const targetEl = e.target as HTMLElement;
      const trigger = targetEl.closest('.bp-color-dropdown-trigger') as HTMLElement;
      const option = targetEl.closest('.bp-color-dropdown-option') as HTMLElement;
      if (trigger?.dataset.target) {
        e.preventDefault();
        this.toggleColorDropdown(trigger);
        return;
      }
      if (option?.dataset.value != null) {
        const dropdown = option.closest('.bp-color-dropdown') as HTMLElement;
        const target = dropdown?.dataset.target as ColorDropdownTarget;
        if (target) {
          e.preventDefault();
          this.handleColorDropdownChange(target, option.dataset.value ?? '');
          this.closeAllColorDropdowns();
          this.updateColorDropdownValues();
        }
        return;
      }
      // Click outside any dropdown → close all
      if (!targetEl.closest('.bp-color-dropdown')) {
        this.closeAllColorDropdowns();
      }
    });
  }

  private toggleColorDropdown(trigger: HTMLElement): void {
    const dropdown = trigger.closest('.bp-color-dropdown') as HTMLElement;
    if (!dropdown) return;
    const isOpen = dropdown.classList.contains('bp-color-dropdown-open');
    this.closeAllColorDropdowns();
    if (!isOpen) {
      dropdown.classList.add('bp-color-dropdown-open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  }

  private closeAllColorDropdowns(): void {
    this.element.querySelectorAll('.bp-color-dropdown.bp-color-dropdown-open').forEach((el) => {
      el.classList.remove('bp-color-dropdown-open');
      const t = el.querySelector('.bp-color-dropdown-trigger');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }

  /** Format for display; number-only values show as "Npx" (default unit). */
  private formatRadiusForDisplay(r: number | string | undefined): string {
    if (r === undefined || r === null) return '';
    if (typeof r === 'number') return r === 0 ? '0' : `${r}px`;
    return r;
  }

  private isRadiusOff(r: number | string | undefined): boolean {
    if (r === undefined || r === null) return true;
    if (typeof r === 'number') return r === 0;
    const parsed = parseLengthInput(String(r));
    return !parsed || (parsed.value === 0 && parsed.unit === 'px');
  }

  /** Convert radius to px for corner demo SVG; rem/em use 16px, % uses ref size. */
  private radiusToPxForDemo(r: number | string | undefined): number {
    if (r === undefined || r === null) return 0;
    if (typeof r === 'number') return r;
    const parsed = parseLengthInput(String(r));
    return lengthToPxForDemo(parsed);
  }

  private handleLinkAllValueInput(input: HTMLInputElement): void {
    const kind = input.dataset.linkAllValue;
    if (kind === 'radius') {
      const parsed = parseLengthInput(input.value);
      if (!parsed) return;
      this.blockStyle.borderRadiusTopLeft = parsed.css;
      this.blockStyle.borderRadiusTopRight = parsed.css;
      this.blockStyle.borderRadiusBottomRight = parsed.css;
      this.blockStyle.borderRadiusBottomLeft = parsed.css;
      this.applyBlockStyles();
      this.updateRadiusLinkAllButton();
      this.updateRadiusCornerControls();
    }
    if (kind === 'padding') {
      const num = parseInt(input.value, 10) || 0;
      if (!this.paddingAllLinked) return;
      this.blockStyle.paddingTop = num;
      this.blockStyle.paddingRight = num;
      this.blockStyle.paddingBottom = num;
      this.blockStyle.paddingLeft = num;
      this.element.querySelectorAll('.bp-padding-input').forEach((el) => {
        (el as HTMLInputElement).value = String(num);
      });
      this.applyBlockStyles();
      this.updatePaddingLinkAllButton();
    }
  }

  private handleAction(btn: HTMLElement): void {
    const action = btn.dataset.action;
    
    switch (action) {
      case 'collapse':
        this.onCollapse?.();
        return;
      case 'undo':
        this.editor.undo(NO_FOCUS);
        break;
      case 'redo':
        this.editor.redo(NO_FOCUS);
        break;
      case 'heading':
        const level = parseInt(btn.dataset.level || '1', 10) as 1 | 2 | 3 | 4 | 5 | 6;
        this.editor.setHeading(level as 1 | 2 | 3, NO_FOCUS);
        break;
      case 'paragraph':
        this.editor.setParagraph(NO_FOCUS);
        break;
      case 'textSize':
        this.setTextSize(btn.dataset.size || 'medium');
        break;
      case 'align':
        this.setTextAlign(btn.dataset.align as 'left' | 'center' | 'right' | 'justify');
        break;
      case 'bold':
        this.editor.toggleBold(NO_FOCUS);
        break;
      case 'italic':
        this.editor.toggleItalic(NO_FOCUS);
        break;
      case 'strike':
        this.editor.toggleStrike(NO_FOCUS);
        break;
      case 'blockquote':
        this.editor.toggleBlockquote(NO_FOCUS);
        break;
      case 'bulletList':
        this.editor.toggleBulletList(NO_FOCUS);
        break;
      case 'orderedList':
        this.editor.toggleOrderedList(NO_FOCUS);
        break;
      case 'taskList':
        this.editor.toggleTaskList(NO_FOCUS);
        break;
      case 'code':
        this.editor.toggleCode(NO_FOCUS);
        break;
      case 'link':
      case 'insertLink':
        this.handleLinkAction();
        break;
      case 'clearFormatting':
        this.clearFormatting();
        break;
      case 'table':
        this.editor.insertTable(3, 3, NO_FOCUS);
        break;
      case 'image':
        this.handleImageAction();
        break;
      case 'divider':
        this.editor.setHorizontalRule(NO_FOCUS);
        break;
      case 'lineBreak':
        this.insertLineBreak();
        break;
      case 'columns':
        this.insertColumns(btn.dataset.cols || '2');
        break;
      case 'divBlock':
        this.editor.toggleDivBlock(NO_FOCUS);
        break;
      case 'codeBlock':
        this.editor.toggleCodeBlock(NO_FOCUS);
        break;
      case 'borderWidth':
        this.setBorderWidth(parseInt(btn.dataset.width || '0', 10));
        break;
      case 'togglePaddingAll':
        this.togglePaddingLinked();
        break;
      case 'toggleRadiusAll':
        this.toggleRadiusLinked();
        break;
      case 'selectContainer':
        this.selectParentContainer();
        break;
    }
    
    this.updateButtonStates();
  }

  private getColorDisplayName(target: ColorDropdownTarget, value: string): string {
    const v = (value || '').trim().toLowerCase();
    if (v === 'transparent' || v === '') {
      return target === 'borderColor' ? 'No border' : 'Transparent';
    }
    if (v === '#ffffff' || v === 'ffffff') return 'White';
    const found = this.colorPalette.find((o) => o.value.trim().toLowerCase() === v);
    return found ? found.name : value;
  }

  private updateColorDropdownValues(): void {
    const targets: { target: ColorDropdownTarget; value: string }[] = [
      { target: 'textColor', value: this.blockStyle.textColor },
      { target: 'borderColor', value: this.blockStyle.borderColor },
      { target: 'backgroundColor', value: this.blockStyle.backgroundColor },
    ];
    targets.forEach(({ target, value }) => {
      const dropdown = this.element.querySelector(`.bp-color-dropdown[data-target="${target}"]`) as HTMLElement;
      if (!dropdown) return;
      const trigger = dropdown.querySelector('.bp-color-dropdown-trigger') as HTMLElement;
      const swatch = dropdown.querySelector('.bp-color-dropdown-trigger-swatch') as HTMLElement;
      const nameEl = dropdown.querySelector('.bp-color-dropdown-trigger-name') as HTMLElement;
      if (!trigger || !swatch || !nameEl) return;
      const val = (value || '').trim();
      const displayName = this.getColorDisplayName(target, val);
      if (val === 'transparent' || val === '') {
        swatch.style.cssText = 'background: linear-gradient(45deg, var(--editor-border, #c9cbbe) 25%, transparent 25%), linear-gradient(-45deg, var(--editor-border, #c9cbbe) 25%, transparent 25%); background-size: 6px 6px; background-color: var(--neutral-warm-grey-1, #f5f5f2);';
      } else {
        swatch.style.cssText = `background-color: ${val};`;
      }
      nameEl.textContent = displayName;
      // Update selected state in panel
      dropdown.querySelectorAll('.bp-color-dropdown-option').forEach((opt) => {
        const optVal = (opt.getAttribute('data-value') || '').trim().toLowerCase();
        opt.classList.toggle('bp-color-dropdown-option-selected', optVal === (val || 'transparent').toLowerCase());
      });
    });
  }

  private handleColorDropdownChange(target: ColorDropdownTarget, value: string): void {
    const color = value || '#000000';
    switch (target) {
      case 'textColor':
        this.setTextColor(color);
        break;
      case 'borderColor':
        this.setBorderColor(color);
        break;
      case 'backgroundColor':
        this.setBackgroundColor(color);
        break;
    }
  }

  private handleBorderSideClick(element: HTMLElement): void {
    const side = element.dataset.side;
    const allBtn = this.element.querySelector('.bp-border-all') as HTMLElement;
    const borderVisual = this.element.querySelector('.bp-border-visual');
    const sides = this.element.querySelectorAll('.bp-border-side:not(.bp-border-all)');
    
    // Get current width from input, but use minimum of 2 when turning ON borders
    const inputWidth = parseInt(
      (this.element.querySelector('[data-input="borderWidth"]') as HTMLInputElement)?.value || '2'
    , 10);
    const widthToApply = inputWidth > 0 ? inputWidth : 2; // Default to 2px if 0
    
    if (side === 'all') {
      // Check current state
      const anyActive = Array.from(sides).some(s => s.classList.contains('active'));
      
      if (this.borderAllLinked) {
        // ALL is currently ON - clicking it turns OFF all sides and unlinks
        this.borderAllLinked = false;
        sides.forEach(s => s.classList.remove('active'));
        this.blockStyle.borderTop = 0;
        this.blockStyle.borderRight = 0;
        this.blockStyle.borderBottom = 0;
        this.blockStyle.borderLeft = 0;
      } else if (!anyActive) {
        // ALL is OFF (all 0 or no sides selected) - turn ON all sides with default 2px and link
        const widthWhenOff =
          this.blockStyle.borderTop === 0 &&
          this.blockStyle.borderRight === 0 &&
          this.blockStyle.borderBottom === 0 &&
          this.blockStyle.borderLeft === 0
            ? 2
            : widthToApply;
        this.borderAllLinked = true;
        sides.forEach(s => s.classList.add('active'));
        this.blockStyle.borderTop = widthWhenOff;
        this.blockStyle.borderRight = widthWhenOff;
        this.blockStyle.borderBottom = widthWhenOff;
        this.blockStyle.borderLeft = widthWhenOff;
        const widthInput = this.element.querySelector('[data-input="borderWidth"]') as HTMLInputElement;
        if (widthInput) widthInput.value = String(widthWhenOff);
        this.updateBorderWidthButtons(widthWhenOff);
      } else {
        // ALL is OFF but some sides selected - just link them (activate ALL mode)
        this.borderAllLinked = true;
        // Keep current selection, sync all to match
        sides.forEach(s => s.classList.add('active'));
        this.blockStyle.borderTop = widthToApply;
        this.blockStyle.borderRight = widthToApply;
        this.blockStyle.borderBottom = widthToApply;
        this.blockStyle.borderLeft = widthToApply;
      }
      
      // Update ALL button state
      element.classList.toggle('active', this.borderAllLinked);
      borderVisual?.classList.toggle('all-linked', this.borderAllLinked);
      
      // Swap icon
      if (allBtn) {
        const iconHtml = this.borderAllLinked ? icons.linkSm : icons.linkBroken;
        const iconContainer = allBtn.querySelector('svg');
        if (iconContainer) {
          const temp = document.createElement('div');
          temp.innerHTML = iconHtml;
          iconContainer.replaceWith(temp.firstChild!);
        }
      }
    } else {
      // Clicking a border side
      const sideMap: Record<string, keyof BlockStyleState> = {
        top: 'borderTop',
        right: 'borderRight',
        bottom: 'borderBottom',
        left: 'borderLeft'
      };
      
      if (side && sideMap[side]) {
        if (this.borderAllLinked) {
          // When ALL is linked, clicking a side UNLINKS and turns OFF just that side
          // Other sides remain ON individually
          this.borderAllLinked = false;
          
          // Update ALL button state
          allBtn?.classList.remove('active');
          borderVisual?.classList.remove('all-linked');
          
          // Swap icon to broken link
          if (allBtn) {
            const iconHtml = icons.linkBroken;
            const iconContainer = allBtn.querySelector('svg');
            if (iconContainer) {
              const temp = document.createElement('div');
              temp.innerHTML = iconHtml;
              iconContainer.replaceWith(temp.firstChild!);
            }
          }
          
          // Turn OFF just the clicked side, keep others ON
          element.classList.remove('active');
          this.blockStyle[sideMap[side]] = 0;
          
          // Make sure other sides stay on
          sides.forEach(s => {
            const otherSide = (s as HTMLElement).dataset.side;
            if (otherSide && otherSide !== side && sideMap[otherSide]) {
              s.classList.add('active');
              this.blockStyle[sideMap[otherSide]] = widthToApply;
            }
          });
        } else {
          // Individual side control - just toggle this side
          element.classList.toggle('active');
          const isActive = element.classList.contains('active');
          this.blockStyle[sideMap[side]] = isActive ? widthToApply : 0;
          // Update input to reflect applied width when turning on
          if (isActive) {
            const widthInput = this.element.querySelector('[data-input="borderWidth"]') as HTMLInputElement;
            if (widthInput && parseInt(widthInput.value, 10) === 0) {
              widthInput.value = String(widthToApply);
              this.updateBorderWidthButtons(widthToApply);
            }
          }
        }
      }
    }
    
    this.updateBorderVisual();
    this.applyBlockStyles();
  }

  private handleRadiusCornerInput(input: HTMLInputElement): void {
    const corner = input.dataset.radiusCorner as RadiusCorner | null;
    if (!corner) return;
    const parsed = parseLengthInput(input.value);
    if (!parsed) return;
    const key = corner === 'topLeft' ? 'borderRadiusTopLeft' : corner === 'topRight' ? 'borderRadiusTopRight' : corner === 'bottomRight' ? 'borderRadiusBottomRight' : 'borderRadiusBottomLeft';
    this.blockStyle[key] = parsed.css;
    this.radiusAllLinked = false;
    this.applyBlockStyles();
    this.updateRadiusLinkAllButton();
    this.updateRadiusCornerControls();
  }

  private handleRadiusCornerClick(element: HTMLElement): void {
    const corner = element.getAttribute('data-corner') as RadiusCorner | null;
    if (!corner) return;
    const key = corner === 'topLeft' ? 'borderRadiusTopLeft' : corner === 'topRight' ? 'borderRadiusTopRight' : corner === 'bottomRight' ? 'borderRadiusBottomRight' : 'borderRadiusBottomLeft';
    const current = this.blockStyle[key];
    const isOff = this.isRadiusOff(current);
    // Toggle: if off, set to 8px or current linked value; if on, set to 0
    const valueWhenOn = this.radiusAllLinked ? this.blockStyle.borderRadiusTopLeft : 8;
    const applied = isOff ? (this.isRadiusOff(valueWhenOn) ? 8 : valueWhenOn) : 0;
    this.blockStyle[key] = applied;
    this.radiusAllLinked = false;
    this.applyBlockStyles();
    this.updateRadiusLinkAllButton();
    this.updateRadiusCornerControls();
  }

  private handlePaddingChange(input: HTMLInputElement): void {
    const side = input.dataset.padding as 'top' | 'right' | 'bottom' | 'left';
    const value = parseInt(input.value, 10) || 0;
    const key = `padding${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof BlockStyleState;

    if (this.paddingAllLinked) {
      // One value changed while active → become inactive; only this side gets the new value
      this.paddingAllLinked = false;
      this.blockStyle[key] = value;
    } else {
      this.blockStyle[key] = value;
    }
    this.applyBlockStyles();
    this.updatePaddingLinkAllButton();
  }

  private handleInputChange(input: HTMLInputElement): void {
    const inputType = input.dataset.input;
    const value = parseInt(input.value, 10) || 0;
    
    if (inputType === 'borderWidth') {
      this.setBorderWidth(value);
    }
  }

  private setTextSize(size: string): void {
    const tipTap = this.editor.getTipTapEditor();
    // Don't focus editor so toolbar doesn't appear when sidebar is open
    if (size === 'medium') {
      tipTap.chain().unsetTextSize().run();
    } else {
      tipTap.chain().setTextSize(size).run();
    }
    
    // Update button states
    this.element.querySelectorAll('[data-action="textSize"]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-size') === size);
    });
  }

  private setTextAlign(align: 'left' | 'center' | 'right' | 'justify'): void {
    this.blockStyle.textAlign = align;
    const tipTap = this.editor.getTipTapEditor();
    tipTap.chain().setTextAlign(align).run();
    
    // Update button states
    this.element.querySelectorAll('[data-action="align"]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-align') === align);
    });
  }

  private setTextColor(color: string): void {
    this.blockStyle.textColor = color;
    const tipTap = this.editor.getTipTapEditor();
    if (color === 'transparent' || color === 'inherit') {
      tipTap.chain().unsetColor().run();
    } else {
      tipTap.chain().setColor(color).run();
    }
  }

  private setBorderColor(color: string): void {
    this.blockStyle.borderColor = color;
    this.applyBlockStyles();
  }

  private setBackgroundColor(color: string): void {
    this.blockStyle.backgroundColor = color;
    // Apply via the full style update to ensure it targets parent container
    this.applyBlockStyles();
  }

  private setBorderWidth(width: number): void {
    if (this.borderAllLinked) {
      // When linked, apply to all sides
      this.blockStyle.borderTop = width;
      this.blockStyle.borderRight = width;
      this.blockStyle.borderBottom = width;
      this.blockStyle.borderLeft = width;
      
      // Update visual state for all sides
      const sides = this.element.querySelectorAll('.bp-border-side:not(.bp-border-all)');
      sides.forEach(s => s.classList.toggle('active', width > 0));
    } else {
      // When unlinked, apply to currently active (selected) sides only
      const sideMap: Record<string, keyof BlockStyleState> = {
        top: 'borderTop',
        right: 'borderRight',
        bottom: 'borderBottom',
        left: 'borderLeft'
      };
      
      const sides = this.element.querySelectorAll('.bp-border-side:not(.bp-border-all)');
      sides.forEach(sideEl => {
        const side = (sideEl as HTMLElement).dataset.side;
        if (side && sideMap[side] && sideEl.classList.contains('active')) {
          this.blockStyle[sideMap[side]] = width;
        }
      });
    }
    
    this.applyBlockStyles();
    this.updateBorderWidthButtons(width);
    this.updateBorderVisual();
  }

  private togglePaddingLinked(): void {
    if (this.paddingAllLinked) {
      // Active → clear all to 0 and deactivate
      this.paddingAllLinked = false;
      this.blockStyle.paddingTop = 0;
      this.blockStyle.paddingRight = 0;
      this.blockStyle.paddingBottom = 0;
      this.blockStyle.paddingLeft = 0;
      this.element.querySelectorAll('.bp-padding-input').forEach((el) => {
        (el as HTMLInputElement).value = '0';
      });
    } else {
      // Inactive → set all 4 to same value and activate. If all are 0 ("off"), use default 10px.
      const topInput = this.element.querySelector('[data-padding="top"]') as HTMLInputElement | null;
      const current = topInput ? parseInt(topInput.value, 10) || 0 : 0;
      const allZero =
        this.blockStyle.paddingTop === 0 &&
        this.blockStyle.paddingRight === 0 &&
        this.blockStyle.paddingBottom === 0 &&
        this.blockStyle.paddingLeft === 0;
      const value = allZero ? 10 : current; // default "on" is 10px when coming from off
      this.paddingAllLinked = true;
      this.blockStyle.paddingTop = value;
      this.blockStyle.paddingRight = value;
      this.blockStyle.paddingBottom = value;
      this.blockStyle.paddingLeft = value;
      this.element.querySelectorAll('.bp-padding-input').forEach((el) => {
        (el as HTMLInputElement).value = String(value);
      });
    }
    this.applyBlockStyles();
    this.updatePaddingLinkAllButton();
  }

  private toggleRadiusLinked(): void {
    if (this.radiusAllLinked) {
      // Active → clear all to 0 and deactivate
      this.radiusAllLinked = false;
      this.blockStyle.borderRadiusTopLeft = 0;
      this.blockStyle.borderRadiusTopRight = 0;
      this.blockStyle.borderRadiusBottomRight = 0;
      this.blockStyle.borderRadiusBottomLeft = 0;
    } else {
      // Inactive → set all 4 to same value and activate. If all are 0 ("off"), use default 10px.
      const container = this.element.querySelector('[data-action="toggleRadiusAll"]')?.closest('.bp-link-all-control');
      const valueInput = container?.querySelector('[data-link-all-value="radius"]') as HTMLInputElement | null;
      const current = valueInput ? parseLengthInput(valueInput.value) : null;
      const allZero =
        this.isRadiusOff(this.blockStyle.borderRadiusTopLeft) &&
        this.isRadiusOff(this.blockStyle.borderRadiusTopRight) &&
        this.isRadiusOff(this.blockStyle.borderRadiusBottomRight) &&
        this.isRadiusOff(this.blockStyle.borderRadiusBottomLeft);
      const applied: number | string = allZero ? 10 : (current?.css ?? `${current?.value ?? 0}px`);
      this.radiusAllLinked = true;
      this.blockStyle.borderRadiusTopLeft = applied;
      this.blockStyle.borderRadiusTopRight = applied;
      this.blockStyle.borderRadiusBottomRight = applied;
      this.blockStyle.borderRadiusBottomLeft = applied;
    }
    this.applyBlockStyles();
    this.updateRadiusLinkAllButton();
    this.updateRadiusCornerControls();
  }

  /** Updates the radius "ALL" button: active state, icon, and value input. */
  private updateRadiusLinkAllButton(): void {
    const btn = this.element.querySelector('[data-action="toggleRadiusAll"]') as HTMLElement | null;
    if (!btn) return;
    const container = (btn.closest('.bp-link-all-control') || btn) as HTMLElement;
    const valueInput = container.querySelector('[data-link-all-value="radius"]') as HTMLInputElement | null;
    if (valueInput) valueInput.value = this.formatRadiusForDisplay(this.blockStyle.borderRadiusTopLeft);
    const icon = this.radiusAllLinked ? icons.linkSm : icons.linkBroken;
    container.classList.toggle('active', this.radiusAllLinked);
    btn.innerHTML = `${icon}<span class="bp-link-all-label">ALL</span>`;
  }

  /** Offset (px) added to corner value for the control's outer border-radius so it aligns with the demo stroke. */
  private static readonly CORNER_CONTROL_RADIUS_OFFSET = 6;
  /** Max radius the demo stroke displays (matches RadiusCornerControl cap). Keeps outer radius concentric. */
  private static readonly MAX_DEMO_RADIUS_PX = 20;

  /** Updates each radius corner control: .all-linked on wrapper, .active, value text, path, and outer border-radius. */
  private updateRadiusCornerControls(): void {
    const wrapper = this.element.querySelector('[data-radius-corner-controls]') as HTMLElement | null;
    if (!wrapper) return;
    wrapper.classList.toggle('all-linked', this.radiusAllLinked);
    const cornerKeys: { corner: RadiusCorner; key: keyof BlockStyleState }[] = [
      { corner: 'topLeft', key: 'borderRadiusTopLeft' },
      { corner: 'bottomLeft', key: 'borderRadiusBottomLeft' },
      { corner: 'topRight', key: 'borderRadiusTopRight' },
      { corner: 'bottomRight', key: 'borderRadiusBottomRight' },
    ];
    cornerKeys.forEach(({ corner, key }) => {
      const control = wrapper.querySelector(`.bp-radius-corner-control[data-corner="${corner}"]`) as HTMLElement | null;
      if (!control) return;
      const value = this.blockStyle[key];
      control.classList.toggle('active', !this.isRadiusOff(value));
      const inputEl = control.querySelector('.bp-radius-corner-control-input') as HTMLInputElement | null;
      if (inputEl) {
        const display = this.formatRadiusForDisplay(value);
        inputEl.value = /(?:px|em|rem|%)$/i.test(display.trim()) ? display : display;
      }
      const svgEl = control.querySelector('.bp-radius-corner-control-svg');
      const pathEl = svgEl?.querySelector('path');
      const radiusPx = this.radiusToPxForDemo(value);
      if (pathEl) pathEl.setAttribute('d', getCornerPathPx(corner, radiusPx));
      if (svgEl) svgEl.classList.toggle('bp-radius-corner-sharp', radiusPx <= 0);
      const outerR = radiusPx <= 0 ? 0 : Math.min(radiusPx + Sidebar.CORNER_CONTROL_RADIUS_OFFSET, Sidebar.MAX_DEMO_RADIUS_PX + Sidebar.CORNER_CONTROL_RADIUS_OFFSET);
      const primary = `${outerR}px`;
      const inner = '10px';  /* opposite the controlling corner */
      const other = '8px';   /* the other two corners */
      switch (corner) {
        case 'topLeft':
          control.style.borderTopLeftRadius = primary;
          control.style.borderTopRightRadius = other;
          control.style.borderBottomLeftRadius = other;
          control.style.borderBottomRightRadius = inner;
          break;
        case 'topRight':
          control.style.borderTopLeftRadius = other;
          control.style.borderTopRightRadius = primary;
          control.style.borderBottomLeftRadius = inner;
          control.style.borderBottomRightRadius = other;
          break;
        case 'bottomLeft':
          control.style.borderTopLeftRadius = other;
          control.style.borderTopRightRadius = inner;
          control.style.borderBottomLeftRadius = primary;
          control.style.borderBottomRightRadius = other;
          break;
        case 'bottomRight':
          control.style.borderTopLeftRadius = inner;
          control.style.borderTopRightRadius = other;
          control.style.borderBottomLeftRadius = other;
          control.style.borderBottomRightRadius = primary;
          break;
      }
    });
  }

  /** Updates the padding "ALL" button: active state, icon, and value input. */
  private updatePaddingLinkAllButton(): void {
    const btn = this.element.querySelector('[data-action="togglePaddingAll"]') as HTMLElement | null;
    if (!btn) return;
    const container = (btn.closest('.bp-link-all-control') || btn) as HTMLElement;
    const valueInput = container.querySelector('[data-link-all-value="padding"]') as HTMLInputElement | null;
    if (valueInput) valueInput.value = String(this.blockStyle.paddingTop);
    const icon = this.paddingAllLinked ? icons.linkSm : icons.linkBroken;
    container.classList.toggle('active', this.paddingAllLinked);
    btn.innerHTML = `${icon}<span class="bp-link-all-label">ALL</span>`;
  }

  private selectParentContainer(): void {
    const tipTap = this.editor.getTipTapEditor();
    tipTap.commands.selectParentContainer();
    this.updateContainerTargetLabel();
  }

  private updateContainerTargetLabel(): void {
    const tipTap = this.editor.getTipTapEditor();
    const { selection } = tipTap.state;
    const containerTypes = ['columnLayout', 'column', 'divBlock'];
    
    let containerName = 'None';
    let containerNode = null;
    
    // Check if it's a NodeSelection by checking for .node property
    // and that the selection range equals the node size (whole node selected)
    const hasNode = 'node' in selection && (selection as any).node;
    const isWholeNodeSelected = hasNode && 
      selection.from + (selection as any).node.nodeSize === selection.to;
    
    if (isWholeNodeSelected && containerTypes.includes((selection as any).node.type.name)) {
      // Explicitly selected container block
      containerNode = (selection as any).node;
    } else {
      // Text cursor or partial selection - traverse up to find nearest container
      let depth = selection.$from.depth;
      
      while (depth > 0) {
        const node = selection.$from.node(depth);
        if (containerTypes.includes(node.type.name)) {
          containerNode = node;
          break;
        }
        depth--;
      }
    }
    
    // Set the display name
    if (containerNode) {
      switch (containerNode.type.name) {
        case 'columnLayout':
          containerName = 'Column Layout';
          break;
        case 'column':
          containerName = 'Column';
          break;
        case 'divBlock':
          containerName = 'Div Block';
          break;
      }
    }
    
    const targetLabel = this.element.querySelector('.bp-target-name');
    if (targetLabel) {
      targetLabel.textContent = containerName;
    }
    
    // Read and sync the container's current styles to the sidebar
    this.syncStylesFromContainer(containerNode);
  }

  private syncStylesFromContainer(containerNode: any): void {
    // Reset to defaults if no container
    if (!containerNode) {
      this.blockStyle = {
        textAlign: 'left',
        textColor: '#121000',
        backgroundColor: 'transparent',
        borderTop: 0,
        borderRight: 0,
        borderBottom: 0,
        borderLeft: 0,
        borderColor: '#000000',
        borderRadiusTopLeft: 0,
        borderRadiusTopRight: 0,
        borderRadiusBottomRight: 0,
        borderRadiusBottomLeft: 0,
        paddingTop: 0,
        paddingRight: 0,
        paddingBottom: 0,
        paddingLeft: 0,
      };
    } else {
      // Read styles from the container's attributes
      const attrs = containerNode.attrs || {};
      this.blockStyle = {
        textAlign: this.blockStyle.textAlign, // Keep current text align
        textColor: this.blockStyle.textColor, // Keep current text color
        backgroundColor: attrs.backgroundColor || 'transparent',
        borderTop: attrs.borderTopWidth || 0,
        borderRight: attrs.borderRightWidth || 0,
        borderBottom: attrs.borderBottomWidth || 0,
        borderLeft: attrs.borderLeftWidth || 0,
        borderColor: attrs.borderColor || '#000000',
        borderRadiusTopLeft: attrs.borderTopLeftRadius || 0,
        borderRadiusTopRight: attrs.borderTopRightRadius || 0,
        borderRadiusBottomRight: attrs.borderBottomRightRadius || 0,
        borderRadiusBottomLeft: attrs.borderBottomLeftRadius || 0,
        paddingTop: attrs.paddingTop || 0,
        paddingRight: attrs.paddingRight || 0,
        paddingBottom: attrs.paddingBottom || 0,
        paddingLeft: attrs.paddingLeft || 0,
      };
    }
    
    // Update sidebar UI to reflect these values
    this.updateSidebarUIFromStyles();
  }

  private updateSidebarUIFromStyles(): void {
    // Update border width input
    const borderWidthInput = this.element.querySelector('[data-input="borderWidth"]') as HTMLInputElement;
    if (borderWidthInput) {
      // Use the max of any side as the displayed width
      const maxBorder = Math.max(
        this.blockStyle.borderTop,
        this.blockStyle.borderRight,
        this.blockStyle.borderBottom,
        this.blockStyle.borderLeft
      );
      borderWidthInput.value = String(maxBorder);
    }
    
    // Update border width buttons
    this.updateBorderWidthButtons(Math.max(
      this.blockStyle.borderTop,
      this.blockStyle.borderRight,
      this.blockStyle.borderBottom,
      this.blockStyle.borderLeft
    ));
    
    // Update border visual (side buttons)
    this.updateBorderVisual();
    
    // Update padding inputs
    const paddingInputs = {
      top: this.element.querySelector('[data-padding="top"]') as HTMLInputElement,
      right: this.element.querySelector('[data-padding="right"]') as HTMLInputElement,
      bottom: this.element.querySelector('[data-padding="bottom"]') as HTMLInputElement,
      left: this.element.querySelector('[data-padding="left"]') as HTMLInputElement,
    };
    
    if (paddingInputs.top) paddingInputs.top.value = String(this.blockStyle.paddingTop);
    if (paddingInputs.right) paddingInputs.right.value = String(this.blockStyle.paddingRight);
    if (paddingInputs.bottom) paddingInputs.bottom.value = String(this.blockStyle.paddingBottom);
    if (paddingInputs.left) paddingInputs.left.value = String(this.blockStyle.paddingLeft);
    
    // Update color dropdowns to match current block style
    this.updateColorDropdownValues();
    
    // Linked = active when all 4 values are equal and not "off" (0). All-0 is "off" for border and padding.
    const allBordersEqual =
      this.blockStyle.borderTop === this.blockStyle.borderRight &&
      this.blockStyle.borderRight === this.blockStyle.borderBottom &&
      this.blockStyle.borderBottom === this.blockStyle.borderLeft;
    this.borderAllLinked = allBordersEqual && this.blockStyle.borderTop > 0;

    const allRadiiEqual =
      this.blockStyle.borderRadiusTopLeft === this.blockStyle.borderRadiusTopRight &&
      this.blockStyle.borderRadiusTopRight === this.blockStyle.borderRadiusBottomRight &&
      this.blockStyle.borderRadiusBottomRight === this.blockStyle.borderRadiusBottomLeft;
    this.radiusAllLinked = allRadiiEqual && !this.isRadiusOff(this.blockStyle.borderRadiusTopLeft);

    const allPaddingsEqual =
      this.blockStyle.paddingTop === this.blockStyle.paddingRight &&
      this.blockStyle.paddingRight === this.blockStyle.paddingBottom &&
      this.blockStyle.paddingBottom === this.blockStyle.paddingLeft;
    this.paddingAllLinked = allPaddingsEqual && this.blockStyle.paddingTop > 0;
    
    // Update the ALL button visual
    const allBtn = this.element.querySelector('.bp-border-all');
    const borderVisual = this.element.querySelector('.bp-border-visual');
    if (allBtn && borderVisual) {
      allBtn.classList.toggle('active', this.borderAllLinked);
      borderVisual.classList.toggle('all-linked', this.borderAllLinked);
      
      // Update link icon (preserve .bp-link-all-label structure)
      const icon = this.borderAllLinked ? icons.linkSm : icons.linkBroken;
      allBtn.innerHTML = `${icon}<span class="bp-link-all-label">ALL</span>`;
    }
    this.updateRadiusLinkAllButton();
    this.updateRadiusCornerControls();
    this.updatePaddingLinkAllButton();
  }

  private clearFormatting(): void {
    const tipTap = this.editor.getTipTapEditor();
    tipTap.chain().unsetAllMarks().clearNodes().run();
  }

  private handleLinkAction(): void {
    const isEdit = this.editor.isActive('link');
    const attrs = this.editor.getLinkAttributes();
    showLinkPopup(this.editor, {
      initialUrl: attrs?.href ?? '',
      initialOpenInNewTab: attrs?.target === '_blank',
      isEdit,
      noFocus: true,
      themeRoot: this.container,
      themeVariables: this.getThemeForPopup?.(),
    });
  }

  private handleImageAction(): void {
    const url = prompt('Enter image URL:');
    if (url) {
      this.editor.insertImage(url, undefined, NO_FOCUS);
    }
  }

  private insertLineBreak(): void {
    const tipTap = this.editor.getTipTapEditor();
    tipTap.chain().setHardBreak().run();
  }

  private insertColumns(cols: string): void {
    switch (cols) {
      case '1':
        this.editor.removeColumnLayout(NO_FOCUS);
        break;
      case '2':
        this.editor.insertTwoColumns(NO_FOCUS);
        break;
      case '3':
        this.editor.insertThreeColumns(NO_FOCUS);
        break;
      case '4':
        this.editor.insertColumns(4, NO_FOCUS);
        break;
      case '1-2':
      case '2-1':
        this.editor.insertTwoColumns(NO_FOCUS);
        break;
    }
  }

  private applyBlockStyles(): void {
    const tipTap = this.editor.getTipTapEditor();
    
    // Apply all block styles to the nearest parent container (columnLayout, column, or divBlock)
    // Use commands directly to ensure proper transaction dispatch
    tipTap.commands.setParentContainerStyle({
      backgroundColor: this.blockStyle.backgroundColor,
      borderTopWidth: this.blockStyle.borderTop,
      borderRightWidth: this.blockStyle.borderRight,
      borderBottomWidth: this.blockStyle.borderBottom,
      borderLeftWidth: this.blockStyle.borderLeft,
      borderColor: this.blockStyle.borderColor,
      borderTopLeftRadius: this.blockStyle.borderRadiusTopLeft,
      borderTopRightRadius: this.blockStyle.borderRadiusTopRight,
      borderBottomRightRadius: this.blockStyle.borderRadiusBottomRight,
      borderBottomLeftRadius: this.blockStyle.borderRadiusBottomLeft,
      paddingTop: this.blockStyle.paddingTop,
      paddingRight: this.blockStyle.paddingRight,
      paddingBottom: this.blockStyle.paddingBottom,
      paddingLeft: this.blockStyle.paddingLeft,
    });
  }

  private updateBorderVisual(): void {
    const control = this.element.querySelector('.bp-border-control');
    const borderVisual = this.element.querySelector('.bp-border-visual');
    if (!control) return;
    
    const sides = ['top', 'right', 'bottom', 'left'];
    sides.forEach(side => {
      const sideEl = control.querySelector(`.bp-border-${side}`);
      const key = `border${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof BlockStyleState;
      const value = this.blockStyle[key] as number;
      sideEl?.classList.toggle('active', value > 0);
    });
    
    // Update ALL button and visual state
    const allBtn = control.querySelector('.bp-border-all');
    allBtn?.classList.toggle('active', this.borderAllLinked);
    borderVisual?.classList.toggle('all-linked', this.borderAllLinked);
  }

  private updateBorderWidthButtons(width: number): void {
    // Update button active states
    this.element.querySelectorAll('[data-action="borderWidth"]').forEach(btn => {
      const btnWidth = parseInt(btn.getAttribute('data-width') || '0', 10);
      btn.classList.toggle('active', btnWidth === width);
    });
    
    // Sync the input field so it's used when activating sides
    const input = this.element.querySelector('[data-input="borderWidth"]') as HTMLInputElement;
    if (input && width > 0) {
      input.value = String(width);
    }
  }

  private setupDraggableButtons(): void {
    const draggableButtons = this.element.querySelectorAll('.draggable[data-drag-type]');
    
    draggableButtons.forEach(btn => {
      const button = btn as HTMLElement;
      const dragType = button.dataset.dragType;
      const dragColumns = button.dataset.dragColumns;
      const title = (button.getAttribute('title') || 'Block').replace(' (drag or click)', '');
      
      const dragData: DragData = {
        type: dragType || 'divBlock',
      };
      
      // Add columns info for column layouts
      if (dragColumns) {
        dragData.content = { columns: parseInt(dragColumns, 10) };
      }
      
      button.draggable = true;
      
      button.addEventListener('dragstart', (e) => {
        if (e.dataTransfer) {
          e.dataTransfer.setData('application/json', JSON.stringify(dragData));
          e.dataTransfer.effectAllowed = 'copy';
          button.classList.add('dragging');
          
          // Create drag image using manager if available
          if (this.dragDropManager) {
            const dragImage = this.dragDropManager.createDragImage(title);
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 40, 20);
            setTimeout(() => dragImage.remove(), 0);
          }
        }
      });
      
      button.addEventListener('dragend', () => {
        button.classList.remove('dragging');
        this.dragDropManager?.hideDropIndicator();
      });
    });
  }

  private setupUpdateListener(): void {
    const tipTap = this.editor.getTipTapEditor();
    
    // Update on both transaction and selection changes
    tipTap.on('transaction', () => {
      this.updateButtonStates();
      this.updateContainerTargetLabel();
    });
    
    tipTap.on('selectionUpdate', () => {
      this.updateButtonStates();
      this.updateContainerTargetLabel();
    });
    
    // Also listen for focus to ensure updates when clicking back into editor
    tipTap.on('focus', () => {
      this.updateContainerTargetLabel();
    });
    
    // Initial update
    this.updateContainerTargetLabel();
  }

  private updateButtonStates(): void {
    // Update undo/redo disabled states
    const undoBtn = this.element.querySelector('[data-action="undo"]') as HTMLButtonElement;
    const redoBtn = this.element.querySelector('[data-action="redo"]') as HTMLButtonElement;
    if (undoBtn) undoBtn.disabled = !this.editor.canUndo();
    if (redoBtn) redoBtn.disabled = !this.editor.canRedo();
    
    // Update heading buttons
    for (let i = 1; i <= 6; i++) {
      const btn = this.element.querySelector(`[data-action="heading"][data-level="${i}"]`);
      btn?.classList.toggle('active', this.editor.isActive('heading', { level: i }));
    }
    
    // Update paragraph button
    const paraBtn = this.element.querySelector('[data-action="paragraph"]');
    paraBtn?.classList.toggle('active', this.editor.isActive('paragraph'));
    
    // Update formatting buttons
    const formatChecks: Record<string, string> = {
      bold: 'bold',
      italic: 'italic',
      strike: 'strike',
      code: 'code',
      blockquote: 'blockquote',
      bulletList: 'bulletList',
      orderedList: 'orderedList',
      taskList: 'taskList',
      link: 'link',
    };
    
    Object.entries(formatChecks).forEach(([action, nodeName]) => {
      const btn = this.element.querySelector(`[data-action="${action}"]`);
      btn?.classList.toggle('active', this.editor.isActive(nodeName));
    });
  }

  show(): void {
    this.element.style.display = '';
  }

  hide(): void {
    this.element.style.display = 'none';
  }

  destroy(): void {
    this.element.remove();
  }

  getElement(): HTMLElement {
    return this.element;
  }
}
