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

import { ContentEditor } from './Editor';
import { defaultColorPalette } from '../utils/themeApplier';

export interface SidebarConfig {
  editor: ContentEditor;
  container: HTMLElement;
  colorPalette?: string[];
  onCollapse?: () => void;
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
  borderRadiusTopLeft: number;
  borderRadiusTopRight: number;
  borderRadiusBottomRight: number;
  borderRadiusBottomLeft: number;
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
  private colorPalette: string[];
  private onCollapse?: () => void;
  private dropIndicator: HTMLElement | null = null;
  private editorElement: HTMLElement | null = null;
  
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
    this.colorPalette = config.colorPalette || defaultColorPalette;
    this.onCollapse = config.onCollapse;
    this.element = this.createSidebar();
    this.container.appendChild(this.element);
    this.setupUpdateListener();
    this.setupDraggableButtons();
    this.setupDropZone();
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
            ${this.icons.undo}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="redo" title="Redo (Ctrl+Y)">
            ${this.icons.redo}
          </button>
        </div>
        <button class="bp-sidebar-close" data-action="collapse" title="Switch to compact toolbar">
          ${this.icons.collapse}
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
          </div>
          <div class="bp-btn-row" style="margin-top: 8px;">
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
            ${this.icons.alignLeft}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="align" data-align="center" title="Align Center">
            ${this.icons.alignCenter}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="align" data-align="right" title="Align Right">
            ${this.icons.alignRight}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="align" data-align="justify" title="Justify">
            ${this.icons.alignJustify}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="bold" title="Bold">
            ${this.icons.bold}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="italic" title="Italic">
            ${this.icons.italic}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="strike" title="Strikethrough">
            ${this.icons.strike}
          </button>
        </div>
        <div class="bp-btn-row" style="margin-top: 8px;">
          <button class="bp-btn bp-btn-icon" data-action="blockquote" title="Quote">
            ${this.icons.quote}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="bulletList" title="Bullet List">
            ${this.icons.bulletList}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="orderedList" title="Numbered List">
            ${this.icons.orderedList}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="taskList" title="Task List">
            ${this.icons.taskList}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="code" title="Inline Code">
            ${this.icons.code}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="link" title="Insert Link">
            ${this.icons.link}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="clearFormatting" title="Clear Formatting">
            ${this.icons.clearFormat}
          </button>
        </div>
      </section>
    `;
  }

  private createTextColorSection(): string {
    return `
      <section class="bp-sidebar-section">
        <h3 class="bp-sidebar-title">Text color</h3>
        <div class="bp-color-palette" data-target="textColor">
          ${this.createColorPaletteHTML()}
          <div class="bp-color-row">
            <button class="bp-color-swatch bp-swatch-white" data-color="#ffffff" title="White"></button>
            <button class="bp-color-swatch bp-swatch-transparent" data-color="transparent" title="Transparent">
              ${this.icons.noColor}
            </button>
          </div>
        </div>
      </section>
    `;
  }

  private createElementsSection(): string {
    return `
      <section class="bp-sidebar-section">
        <h3 class="bp-sidebar-title">Elements</h3>
        <div class="bp-btn-row">
          <button class="bp-btn bp-btn-icon draggable" data-action="table" data-drag-type="table" title="Insert Table (drag or click)">
            ${this.icons.table}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="insertLink" title="Insert Link">
            ${this.icons.link}
          </button>
          <button class="bp-btn bp-btn-icon draggable" data-action="image" data-drag-type="image" title="Insert Image (drag or click)">
            ${this.icons.image}
          </button>
          <button class="bp-btn bp-btn-icon draggable" data-action="divider" data-drag-type="horizontalRule" title="Insert Divider (drag or click)">
            ${this.icons.divider}
          </button>
          <button class="bp-btn bp-btn-icon" data-action="lineBreak" title="Line Break">
            ${this.icons.lineBreak}
          </button>
          <button class="bp-btn bp-btn-icon draggable" data-action="divBlock" data-drag-type="divBlock" title="Div Block (drag or click)">
            ${this.icons.divBlock}
          </button>
          <button class="bp-btn bp-btn-icon draggable" data-action="codeBlock" data-drag-type="codeBlock" title="Code Block (drag or click)">
            ${this.icons.codeBlock}
          </button>
          <button class="bp-btn bp-btn-icon draggable" data-action="blockquote" data-drag-type="blockquote" title="Quote (drag or click)">
            ${this.icons.quote}
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
            ${this.icons.cursor}
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
              <button class="bp-border-center bp-border-all" data-side="all" title="Link/unlink all borders">
                ${this.icons.linkBroken}
                <span>ALL</span>
              </button>
            </div>
          </div>
          <div class="bp-radius-control" data-control="radius">
            <div class="bp-radius-visual">
              <button class="bp-radius-corner bp-radius-tl" data-corner="topLeft" title="Top left radius"></button>
              <button class="bp-radius-corner bp-radius-tr" data-corner="topRight" title="Top right radius"></button>
              <button class="bp-radius-corner bp-radius-br" data-corner="bottomRight" title="Bottom right radius"></button>
              <button class="bp-radius-corner bp-radius-bl" data-corner="bottomLeft" title="Bottom left radius"></button>
            </div>
          </div>
          <div class="bp-border-inputs">
            <div class="bp-input-row">
              <input type="number" class="bp-input bp-input-sm" data-input="borderWidth" value="0" min="0" max="50">
              <span class="bp-input-unit">px</span>
            </div>
            <div class="bp-input-row">
              <input type="number" class="bp-input bp-input-sm" data-input="radius" value="0" min="0" max="50">
              <span class="bp-input-unit">px</span>
            </div>
            <button class="bp-btn bp-btn-sm bp-btn-link-all" data-action="toggleRadiusAll">
              ${this.icons.link}
              <span>ALL</span>
            </button>
          </div>
        </div>
        <div class="bp-control-group">
          <label class="bp-control-label">Border width</label>
          <div class="bp-btn-row">
            <button class="bp-btn bp-btn-icon active" data-action="borderWidth" data-width="0" title="No border">
              ${this.icons.borderNone}
            </button>
            <button class="bp-btn bp-btn-icon" data-action="borderWidth" data-width="2" title="Thin border">
              ${this.icons.borderThin}
            </button>
            <button class="bp-btn bp-btn-icon" data-action="borderWidth" data-width="4" title="Medium border">
              ${this.icons.borderMedium}
            </button>
            <button class="bp-btn bp-btn-icon" data-action="borderWidth" data-width="6" title="Thick border">
              ${this.icons.borderThick}
            </button>
          </div>
        </div>
        <div class="bp-color-palette" data-target="borderColor">
          ${this.createColorPaletteHTML()}
          <div class="bp-color-row">
            <button class="bp-color-swatch bp-swatch-white" data-color="#ffffff" title="White"></button>
            <button class="bp-color-swatch bp-swatch-transparent" data-color="transparent" title="No border">
              ${this.icons.noColor}
            </button>
          </div>
        </div>
      </section>
    `;
  }

  private createBackgroundsSection(): string {
    return `
      <section class="bp-sidebar-section">
        <h3 class="bp-sidebar-title">Backgrounds</h3>
        <div class="bp-control-group">
          <label class="bp-control-label">Background colors</label>
          <div class="bp-color-palette" data-target="backgroundColor">
            ${this.createColorPaletteHTML()}
            <div class="bp-color-row">
              <button class="bp-color-swatch bp-swatch-white active" data-color="#ffffff" title="White"></button>
              <button class="bp-color-swatch bp-swatch-transparent" data-color="transparent" title="Transparent">
                ${this.icons.noColor}
              </button>
            </div>
          </div>
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
              ${this.icons.col1}
            </button>
            <button class="bp-btn bp-btn-icon draggable" data-action="columns" data-cols="2" data-drag-type="columnLayout" data-drag-columns="2" title="2 Columns (drag or click)">
              ${this.icons.col2}
            </button>
            <button class="bp-btn bp-btn-icon draggable" data-action="columns" data-cols="3" data-drag-type="columnLayout" data-drag-columns="3" title="3 Columns (drag or click)">
              ${this.icons.col3}
            </button>
            <button class="bp-btn bp-btn-icon draggable" data-action="columns" data-cols="1-2" data-drag-type="columnLayout" data-drag-columns="2" title="1/3 + 2/3 (drag or click)">
              ${this.icons.col1_2}
            </button>
            <button class="bp-btn bp-btn-icon draggable" data-action="columns" data-cols="2-1" data-drag-type="columnLayout" data-drag-columns="2" title="2/3 + 1/3 (drag or click)">
              ${this.icons.col2_1}
            </button>
            <button class="bp-btn bp-btn-icon draggable" data-action="columns" data-cols="4" data-drag-type="columnLayout" data-drag-columns="4" title="4 Columns (drag or click)">
              ${this.icons.col4}
            </button>
          </div>
        </div>
        <div class="bp-control-group">
          <label class="bp-control-label">Padding</label>
          <div class="bp-padding-control">
            <div class="bp-padding-visual">
              <input type="number" class="bp-input bp-padding-input bp-padding-top" data-padding="top" value="20" min="0" placeholder="0">
              <input type="number" class="bp-input bp-padding-input bp-padding-right" data-padding="right" value="0" min="0" placeholder="0">
              <input type="number" class="bp-input bp-padding-input bp-padding-bottom" data-padding="bottom" value="0" min="0" placeholder="0">
              <input type="number" class="bp-input bp-padding-input bp-padding-left" data-padding="left" value="0" min="0" placeholder="0">
              <button class="bp-padding-center" data-action="togglePaddingAll" title="Link all padding">
                ${this.icons.link}
                <span>ALL</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  private createColorPaletteHTML(): string {
    const rows: string[] = [];
    const colorsPerRow = 12;
    
    for (let i = 0; i < this.colorPalette.length; i += colorsPerRow) {
      const rowColors = this.colorPalette.slice(i, i + colorsPerRow);
      const swatches = rowColors.map(color => 
        `<button class="bp-color-swatch" data-color="${color}" style="background-color: ${color};" title="${color}"></button>`
      ).join('');
      rows.push(`<div class="bp-color-row">${swatches}</div>`);
    }
    
    return rows.join('');
  }

  private bindEvents(sidebar: HTMLElement): void {
    // Button clicks
    sidebar.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('[data-action]') as HTMLElement;
      if (btn) {
        this.handleAction(btn);
      }
      
      // Color swatch clicks
      const swatch = target.closest('.bp-color-swatch') as HTMLElement;
      if (swatch) {
        this.handleColorSelect(swatch);
      }
      
      // Border side clicks
      const borderSide = target.closest('.bp-border-side, .bp-border-center') as HTMLElement;
      if (borderSide) {
        this.handleBorderSideClick(borderSide);
      }
      
      // Radius corner clicks  
      const radiusCorner = target.closest('.bp-radius-corner') as HTMLElement;
      if (radiusCorner) {
        this.handleRadiusCornerClick(radiusCorner);
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
  }

  private handleAction(btn: HTMLElement): void {
    const action = btn.dataset.action;
    
    switch (action) {
      case 'collapse':
        this.onCollapse?.();
        return;
      case 'undo':
        this.editor.undo();
        break;
      case 'redo':
        this.editor.redo();
        break;
      case 'heading':
        const level = parseInt(btn.dataset.level || '1', 10) as 1 | 2 | 3 | 4 | 5 | 6;
        this.editor.setHeading(level as 1 | 2 | 3);
        break;
      case 'paragraph':
        this.editor.setParagraph();
        break;
      case 'textSize':
        this.setTextSize(btn.dataset.size || 'medium');
        break;
      case 'align':
        this.setTextAlign(btn.dataset.align as 'left' | 'center' | 'right' | 'justify');
        break;
      case 'bold':
        this.editor.toggleBold();
        break;
      case 'italic':
        this.editor.toggleItalic();
        break;
      case 'strike':
        this.editor.toggleStrike();
        break;
      case 'blockquote':
        this.editor.toggleBlockquote();
        break;
      case 'bulletList':
        this.editor.toggleBulletList();
        break;
      case 'orderedList':
        this.editor.toggleOrderedList();
        break;
      case 'taskList':
        this.editor.toggleTaskList();
        break;
      case 'code':
        this.editor.toggleCode();
        break;
      case 'link':
      case 'insertLink':
        this.handleLinkAction();
        break;
      case 'clearFormatting':
        this.clearFormatting();
        break;
      case 'table':
        this.editor.insertTable(3, 3);
        break;
      case 'image':
        this.handleImageAction();
        break;
      case 'divider':
        this.editor.setHorizontalRule();
        break;
      case 'lineBreak':
        this.insertLineBreak();
        break;
      case 'columns':
        this.insertColumns(btn.dataset.cols || '2');
        break;
      case 'divBlock':
        this.editor.toggleDivBlock();
        break;
      case 'codeBlock':
        this.editor.toggleCodeBlock();
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

  private handleColorSelect(swatch: HTMLElement): void {
    const color = swatch.dataset.color || '#000000';
    const palette = swatch.closest('.bp-color-palette') as HTMLElement;
    const target = palette?.dataset.target;
    
    // Update active state
    palette?.querySelectorAll('.bp-color-swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
    
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
    
    const currentWidth = parseInt(
      (this.element.querySelector('[data-input="borderWidth"]') as HTMLInputElement)?.value || '2'
    , 10) || 2;
    
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
        // ALL is OFF and no sides selected - turn ON all sides and link
        this.borderAllLinked = true;
        sides.forEach(s => s.classList.add('active'));
        this.blockStyle.borderTop = currentWidth;
        this.blockStyle.borderRight = currentWidth;
        this.blockStyle.borderBottom = currentWidth;
        this.blockStyle.borderLeft = currentWidth;
      } else {
        // ALL is OFF but some sides selected - just link them (activate ALL mode)
        this.borderAllLinked = true;
        // Keep current selection, sync all to match
        sides.forEach(s => s.classList.add('active'));
        this.blockStyle.borderTop = currentWidth;
        this.blockStyle.borderRight = currentWidth;
        this.blockStyle.borderBottom = currentWidth;
        this.blockStyle.borderLeft = currentWidth;
      }
      
      // Update ALL button state
      element.classList.toggle('active', this.borderAllLinked);
      borderVisual?.classList.toggle('all-linked', this.borderAllLinked);
      
      // Swap icon
      if (allBtn) {
        const iconHtml = this.borderAllLinked ? this.icons.link : this.icons.linkBroken;
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
            const iconHtml = this.icons.linkBroken;
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
              this.blockStyle[sideMap[otherSide]] = currentWidth;
            }
          });
        } else {
          // Individual side control - just toggle this side
          element.classList.toggle('active');
          const isActive = element.classList.contains('active');
          this.blockStyle[sideMap[side]] = isActive ? currentWidth : 0;
        }
      }
    }
    
    this.updateBorderVisual();
    this.applyBlockStyles();
  }

  private handleRadiusCornerClick(element: HTMLElement): void {
    element.classList.toggle('active');
    this.updateRadiusVisual();
  }

  private handlePaddingChange(input: HTMLInputElement): void {
    const side = input.dataset.padding as 'top' | 'right' | 'bottom' | 'left';
    const value = parseInt(input.value, 10) || 0;
    
    if (this.paddingAllLinked) {
      // Update all padding values
      this.blockStyle.paddingTop = value;
      this.blockStyle.paddingRight = value;
      this.blockStyle.paddingBottom = value;
      this.blockStyle.paddingLeft = value;
      
      // Update all inputs
      this.element.querySelectorAll('.bp-padding-input').forEach((el) => {
        (el as HTMLInputElement).value = String(value);
      });
    } else {
      // Update single side
      const key = `padding${side.charAt(0).toUpperCase() + side.slice(1)}`;
      this.blockStyle[key] = value;
    }
    
    this.applyBlockStyles();
  }

  private handleInputChange(input: HTMLInputElement): void {
    const inputType = input.dataset.input;
    const value = parseInt(input.value, 10) || 0;
    
    switch (inputType) {
      case 'borderWidth':
        this.setBorderWidth(value);
        break;
      case 'radius':
        this.setRadius(value);
        break;
    }
  }

  private setTextSize(size: string): void {
    const tipTap = this.editor.getTipTapEditor();
    
    if (size === 'medium') {
      // Medium is the default, so unset the mark
      tipTap.chain().focus().unsetTextSize().run();
    } else {
      tipTap.chain().focus().setTextSize(size).run();
    }
    
    // Update button states
    this.element.querySelectorAll('[data-action="textSize"]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-size') === size);
    });
  }

  private setTextAlign(align: 'left' | 'center' | 'right' | 'justify'): void {
    this.blockStyle.textAlign = align;
    // Apply alignment via TipTap
    const tipTap = this.editor.getTipTapEditor();
    tipTap.chain().focus().setTextAlign(align).run();
    
    // Update button states
    this.element.querySelectorAll('[data-action="align"]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-align') === align);
    });
  }

  private setTextColor(color: string): void {
    this.blockStyle.textColor = color;
    const tipTap = this.editor.getTipTapEditor();
    if (color === 'transparent' || color === 'inherit') {
      tipTap.chain().focus().unsetColor().run();
    } else {
      tipTap.chain().focus().setColor(color).run();
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

  private setRadius(value: number): void {
    if (this.radiusAllLinked) {
      this.blockStyle.borderRadiusTopLeft = value;
      this.blockStyle.borderRadiusTopRight = value;
      this.blockStyle.borderRadiusBottomRight = value;
      this.blockStyle.borderRadiusBottomLeft = value;
    }
    this.applyBlockStyles();
  }

  private togglePaddingLinked(): void {
    this.paddingAllLinked = !this.paddingAllLinked;
    const btn = this.element.querySelector('[data-action="togglePaddingAll"]');
    btn?.classList.toggle('active', this.paddingAllLinked);
  }

  private toggleRadiusLinked(): void {
    this.radiusAllLinked = !this.radiusAllLinked;
    const btn = this.element.querySelector('[data-action="toggleRadiusAll"]');
    btn?.classList.toggle('active', this.radiusAllLinked);
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
    
    // Check selection type - NodeSelection means a whole block is selected
    // TextSelection/other means cursor is in text
    const isNodeSelection = selection.constructor.name === 'NodeSelection' && 
                            'node' in selection && 
                            (selection as any).node;
    
    if (isNodeSelection && containerTypes.includes((selection as any).node.type.name)) {
      // Explicitly selected container block
      containerNode = (selection as any).node;
    } else {
      // Text cursor - traverse up to find nearest container
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
      console.log('[Sidebar] No container, resetting to defaults');
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
      console.log('[Sidebar] Syncing from container:', containerNode.type.name);
      console.log('[Sidebar] All attrs on node:', JSON.stringify(attrs, null, 2));
      
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
      console.log('[Sidebar] Extracted blockStyle:', this.blockStyle);
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
    
    // Update radius input
    const radiusInput = this.element.querySelector('[data-input="radius"]') as HTMLInputElement;
    if (radiusInput) {
      const maxRadius = Math.max(
        this.blockStyle.borderRadiusTopLeft,
        this.blockStyle.borderRadiusTopRight,
        this.blockStyle.borderRadiusBottomRight,
        this.blockStyle.borderRadiusBottomLeft
      );
      radiusInput.value = String(maxRadius);
    }
    
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
    
    // Determine if ALL borders are linked (all equal and > 0, or all 0)
    const allBordersEqual = 
      this.blockStyle.borderTop === this.blockStyle.borderRight &&
      this.blockStyle.borderRight === this.blockStyle.borderBottom &&
      this.blockStyle.borderBottom === this.blockStyle.borderLeft;
    
    // Update the ALL button state based on whether borders are uniform
    this.borderAllLinked = allBordersEqual && this.blockStyle.borderTop > 0;
    
    // Update the ALL button visual
    const allBtn = this.element.querySelector('.bp-border-all');
    const borderVisual = this.element.querySelector('.bp-border-visual');
    if (allBtn && borderVisual) {
      allBtn.classList.toggle('active', this.borderAllLinked);
      borderVisual.classList.toggle('all-linked', this.borderAllLinked);
      
      // Update link icon
      if (this.borderAllLinked) {
        allBtn.innerHTML = `${this.icons.link}<span>ALL</span>`;
      } else {
        allBtn.innerHTML = `${this.icons.linkBroken}<span>ALL</span>`;
      }
    }
  }

  private clearFormatting(): void {
    const tipTap = this.editor.getTipTapEditor();
    tipTap.chain().focus().unsetAllMarks().clearNodes().run();
  }

  private handleLinkAction(): void {
    if (this.editor.isActive('link')) {
      this.editor.unsetLink();
      return;
    }
    const url = prompt('Enter URL:');
    if (url) {
      this.editor.setLink(url);
    }
  }

  private handleImageAction(): void {
    const url = prompt('Enter image URL:');
    if (url) {
      this.editor.insertImage(url);
    }
  }

  private insertLineBreak(): void {
    const tipTap = this.editor.getTipTapEditor();
    tipTap.chain().focus().setHardBreak().run();
  }

  private insertColumns(cols: string): void {
    switch (cols) {
      case '1':
        // Single column - remove column layout
        this.editor.removeColumnLayout();
        break;
      case '2':
        this.editor.insertTwoColumns();
        break;
      case '3':
        this.editor.insertThreeColumns();
        break;
      case '4':
        this.editor.insertColumns(4);
        break;
      case '1-2':
      case '2-1':
        // These would need custom column width support
        this.editor.insertTwoColumns();
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

  private updateRadiusVisual(): void {
    // Update corner visual states
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
      button.draggable = true;
      
      button.addEventListener('dragstart', (e) => {
        const dragType = button.dataset.dragType;
        const dragColumns = button.dataset.dragColumns;
        
        const dragData: { type: string; content?: Record<string, unknown> } = {
          type: dragType || 'divBlock'
        };
        
        // Add columns info for column layouts
        if (dragColumns) {
          dragData.content = { columns: parseInt(dragColumns, 10) };
        }
        
        if (e.dataTransfer) {
          e.dataTransfer.setData('application/json', JSON.stringify(dragData));
          e.dataTransfer.effectAllowed = 'copy';
          button.classList.add('dragging');
          
          // Create custom drag image
          const title = button.getAttribute('title') || 'Block';
          const dragImage = this.createDragImage(title.replace(' (drag or click)', ''));
          document.body.appendChild(dragImage);
          e.dataTransfer.setDragImage(dragImage, 40, 20);
          setTimeout(() => dragImage.remove(), 0);
        }
      });
      
      button.addEventListener('dragend', () => {
        button.classList.remove('dragging');
        this.hideDropIndicator();
      });
    });
  }

  private createDragImage(title: string): HTMLElement {
    const el = document.createElement('div');
    el.className = 'sidebar-drag-image';
    el.textContent = title;
    el.style.cssText = `
      position: absolute;
      top: -1000px;
      left: -1000px;
      padding: 8px 12px;
      background: var(--brand-primary, #007f00);
      color: white;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      font-family: system-ui, sans-serif;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    return el;
  }

  private setupDropZone(): void {
    // Find the editor content area
    setTimeout(() => {
      // Look for the editor in the main container (sibling to sidebar)
      const editorWrapper = this.container.closest('.app')?.querySelector('.editor-wrapper');
      this.editorElement = editorWrapper?.querySelector('.tiptap') as HTMLElement || null;
      if (!this.editorElement) return;
      
      // Create drop indicator
      this.dropIndicator = document.createElement('div');
      this.dropIndicator.className = 'editor-drop-indicator';
      
      this.editorElement.addEventListener('dragover', (e) => this.handleDragOver(e));
      this.editorElement.addEventListener('dragleave', (e) => this.handleDragLeave(e));
      this.editorElement.addEventListener('drop', (e) => this.handleDrop(e));
    }, 100);
  }

  private handleDragOver(e: DragEvent): void {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    this.showDropIndicator(e);
  }

  private handleDragLeave(e: DragEvent): void {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!this.editorElement?.contains(relatedTarget)) {
      this.hideDropIndicator();
    }
  }

  private handleDrop(e: DragEvent): void {
    e.preventDefault();
    this.hideDropIndicator();
    
    const data = e.dataTransfer?.getData('application/json');
    if (!data) return;
    
    try {
      const dragData = JSON.parse(data) as { type: string; content?: Record<string, unknown> };
      this.insertAtDropPosition(e, dragData);
    } catch {
      console.error('Failed to parse drag data');
    }
  }

  private showDropIndicator(e: DragEvent): void {
    if (!this.dropIndicator || !this.editorElement) return;
    
    const pos = this.getDropPosition(e);
    if (!pos) return;
    
    if (!this.dropIndicator.parentElement) {
      this.editorElement.style.position = 'relative';
      this.editorElement.appendChild(this.dropIndicator);
    }
    
    this.dropIndicator.style.display = 'block';
    this.dropIndicator.style.top = `${pos.top}px`;
    this.dropIndicator.style.left = '0';
    this.dropIndicator.style.right = '0';
  }

  private hideDropIndicator(): void {
    if (this.dropIndicator) {
      this.dropIndicator.style.display = 'none';
    }
  }

  private getDropPosition(e: DragEvent): { top: number; pos: number } | null {
    const tipTapEditor = this.editor.getTipTapEditor();
    const view = tipTapEditor.view;
    
    const coords = { left: e.clientX, top: e.clientY };
    const posAtCoords = view.posAtCoords(coords);
    
    if (!posAtCoords) return null;
    
    const resolvedPos = view.state.doc.resolve(posAtCoords.pos);
    
    let blockPos = posAtCoords.pos;
    if (resolvedPos.parent.isBlock) {
      blockPos = resolvedPos.before(resolvedPos.depth);
    }
    
    const coordsAtPos = view.coordsAtPos(blockPos);
    const editorRect = this.editorElement!.getBoundingClientRect();
    
    return {
      top: coordsAtPos.top - editorRect.top,
      pos: blockPos
    };
  }

  private insertAtDropPosition(e: DragEvent, dragData: { type: string; content?: Record<string, unknown> }): void {
    const tipTapEditor = this.editor.getTipTapEditor();
    const view = tipTapEditor.view;
    
    const coords = { left: e.clientX, top: e.clientY };
    const posAtCoords = view.posAtCoords(coords);
    
    if (!posAtCoords) return;
    
    const resolvedPos = view.state.doc.resolve(posAtCoords.pos);
    let insertPos = posAtCoords.pos;
    
    if (resolvedPos.parent.isBlock && resolvedPos.parent.type.name !== 'doc') {
      insertPos = resolvedPos.after(resolvedPos.depth);
    }
    
    switch (dragData.type) {
      case 'divBlock':
        tipTapEditor.chain()
          .focus()
          .insertContentAt(insertPos, {
            type: 'divBlock',
            content: [{ type: 'paragraph' }]
          })
          .run();
        break;
        
      case 'columnLayout':
        const columns = (dragData.content?.columns as number) || 2;
        const columnNodes = [];
        for (let i = 0; i < columns; i++) {
          columnNodes.push({
            type: 'column',
            content: [{ type: 'paragraph' }]
          });
        }
        tipTapEditor.chain()
          .focus()
          .insertContentAt(insertPos, {
            type: 'columnLayout',
            attrs: { columns },
            content: columnNodes
          })
          .run();
        break;
        
      case 'table':
        tipTapEditor.chain()
          .focus()
          .insertContentAt(insertPos, {
            type: 'table',
            content: [
              {
                type: 'tableRow',
                content: [
                  { type: 'tableHeader', content: [{ type: 'paragraph' }] },
                  { type: 'tableHeader', content: [{ type: 'paragraph' }] },
                  { type: 'tableHeader', content: [{ type: 'paragraph' }] }
                ]
              },
              {
                type: 'tableRow',
                content: [
                  { type: 'tableCell', content: [{ type: 'paragraph' }] },
                  { type: 'tableCell', content: [{ type: 'paragraph' }] },
                  { type: 'tableCell', content: [{ type: 'paragraph' }] }
                ]
              }
            ]
          })
          .run();
        break;
        
      case 'image':
        const url = prompt('Enter image URL:');
        if (url) {
          tipTapEditor.chain()
            .focus()
            .insertContentAt(insertPos, {
              type: 'image',
              attrs: { src: url }
            })
            .run();
        }
        break;
        
      case 'codeBlock':
        tipTapEditor.chain()
          .focus()
          .insertContentAt(insertPos, {
            type: 'codeBlock',
            content: []
          })
          .run();
        break;
        
      case 'blockquote':
        tipTapEditor.chain()
          .focus()
          .insertContentAt(insertPos, {
            type: 'blockquote',
            content: [{ type: 'paragraph' }]
          })
          .run();
        break;
        
      case 'horizontalRule':
        tipTapEditor.chain()
          .focus()
          .insertContentAt(insertPos, {
            type: 'horizontalRule'
          })
          .run();
        break;
    }
  }

  private setupUpdateListener(): void {
    const tipTap = this.editor.getTipTapEditor();
    tipTap.on('transaction', () => this.updateButtonStates());
    tipTap.on('selectionUpdate', () => {
      this.updateButtonStates();
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

  // SVG Icons
  private icons = {
    collapse: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>`,
    undo: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
    redo: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>`,
    code: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    taskList: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><line x1="13" y1="6" x2="21" y2="6"/><line x1="13" y1="12" x2="21" y2="12"/><line x1="13" y1="18" x2="21" y2="18"/></svg>`,
    alignLeft: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>`,
    alignCenter: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>`,
    alignRight: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>`,
    alignJustify: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
    bold: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>`,
    italic: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
    strike: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></svg>`,
    quote: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>`,
    bulletList: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>`,
    orderedList: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>`,
    link: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    linkBroken: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 7h2a5 5 0 0 1 0 10h-2"/><path d="M9 17H7a5 5 0 0 1 0-10h2"/><line x1="9" y1="12" x2="11" y2="12"/><line x1="13" y1="12" x2="15" y2="12"/></svg>`,
    clearFormat: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>`,
    table: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`,
    image: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    divider: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/></svg>`,
    lineBreak: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 12H3"/><path d="m11 18-6-6 6-6"/><path d="M21 5v14"/></svg>`,
    divBlock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>`,
    codeBlock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m10 10-2 2 2 2"/><path d="m14 14 2-2-2-2"/></svg>`,
    noColor: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="4" x2="20" y2="20"/></svg>`,
    borderNone: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"><rect x="4" y="4" width="16" height="16" rx="1"/></svg>`,
    borderThin: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="4" y="4" width="16" height="16" rx="1"/></svg>`,
    borderMedium: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="1"/></svg>`,
    borderThick: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="4" y="4" width="16" height="16" rx="1"/></svg>`,
    col1: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
    col2: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>`,
    col3: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`,
    col1_2: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>`,
    col2_1: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`,
    col4: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7.5" y1="3" x2="7.5" y2="21"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="16.5" y1="3" x2="16.5" y2="21"/></svg>`,
    cursor: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 9-9 4-5 8z"/></svg>`,
  };
}
