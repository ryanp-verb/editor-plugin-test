import { ContentEditor } from './Editor';

export interface ToolbarConfig {
  editor: ContentEditor;
  container: HTMLElement;
  onToggleSidebar?: () => void;
}

interface ToolbarButton {
  id: string;
  icon: string;
  title: string;
  action: () => void;
  isActive?: () => boolean;
  isDisabled?: () => boolean;
  draggable?: boolean;
  dragData?: {
    type: string;
    content?: Record<string, unknown>;
  };
}

interface ToolbarGroup {
  name: string;
  buttons: ToolbarButton[];
}

export class Toolbar {
  private editor: ContentEditor;
  private container: HTMLElement;
  private element: HTMLElement;
  private dropIndicator: HTMLElement | null = null;
  private editorElement: HTMLElement | null = null;
  private onToggleSidebar?: () => void;
  private sidebarExpanded = false;

  constructor(config: ToolbarConfig) {
    this.editor = config.editor;
    this.container = config.container;
    this.onToggleSidebar = config.onToggleSidebar;
    this.element = this.createToolbar();
    this.container.prepend(this.element);
    this.setupUpdateListener();
    this.setupDropZone();
  }

  setSidebarExpanded(expanded: boolean): void {
    this.sidebarExpanded = expanded;
    const btn = this.element.querySelector('[data-action="toggleSidebar"]');
    btn?.classList.toggle('active', expanded);
  }

  private createToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';

    const groups = this.getToolbarGroups();
    
    groups.forEach((group, index) => {
      const groupElement = document.createElement('div');
      groupElement.className = 'toolbar-group';
      groupElement.dataset.group = group.name;

      group.buttons.forEach(button => {
        const btn = this.createButton(button);
        groupElement.appendChild(btn);
      });

      toolbar.appendChild(groupElement);

      // Add separator between groups (except last)
      if (index < groups.length - 1) {
        const separator = document.createElement('div');
        separator.className = 'toolbar-separator';
        toolbar.appendChild(separator);
      }
    });

    return toolbar;
  }

  private createButton(config: ToolbarButton): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'toolbar-btn';
    button.dataset.action = config.id;
    button.title = config.title;
    button.innerHTML = config.icon;
    
    // Make button draggable if configured
    if (config.draggable && config.dragData) {
      button.draggable = true;
      button.classList.add('draggable');
      
      button.addEventListener('dragstart', (e) => {
        if (e.dataTransfer) {
          e.dataTransfer.setData('application/json', JSON.stringify(config.dragData));
          e.dataTransfer.effectAllowed = 'copy';
          button.classList.add('dragging');
          
          // Create custom drag image
          const dragImage = this.createDragImage(config.title);
          document.body.appendChild(dragImage);
          e.dataTransfer.setDragImage(dragImage, 40, 20);
          setTimeout(() => dragImage.remove(), 0);
        }
      });
      
      button.addEventListener('dragend', () => {
        button.classList.remove('dragging');
        this.hideDropIndicator();
      });
    }
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      config.action();
    });

    return button;
  }
  
  private createDragImage(title: string): HTMLElement {
    const el = document.createElement('div');
    el.className = 'toolbar-drag-image';
    el.textContent = title;
    el.style.cssText = `
      position: absolute;
      top: -1000px;
      left: -1000px;
      padding: 8px 12px;
      background: var(--editor-accent, #6366f1);
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
      this.editorElement = this.container.querySelector('.tiptap');
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
    // Only hide if we're leaving the editor entirely
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
    
    // Get drop position
    const pos = this.getDropPosition(e);
    if (!pos) return;
    
    // Add indicator to editor if not already there
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
    
    // Get position from coordinates
    const coords = { left: e.clientX, top: e.clientY };
    const posAtCoords = view.posAtCoords(coords);
    
    if (!posAtCoords) return null;
    
    // Get the DOM position for the indicator
    const resolvedPos = view.state.doc.resolve(posAtCoords.pos);
    
    // Find the nearest block boundary
    let blockPos = posAtCoords.pos;
    if (resolvedPos.parent.isBlock) {
      blockPos = resolvedPos.before(resolvedPos.depth);
    }
    
    // Get coordinates at this position
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
    
    // Get position from coordinates
    const coords = { left: e.clientX, top: e.clientY };
    const posAtCoords = view.posAtCoords(coords);
    
    if (!posAtCoords) return;
    
    // Resolve to find the best insertion point
    const resolvedPos = view.state.doc.resolve(posAtCoords.pos);
    let insertPos = posAtCoords.pos;
    
    // Find the end of the current block for insertion
    if (resolvedPos.parent.isBlock && resolvedPos.parent.type.name !== 'doc') {
      insertPos = resolvedPos.after(resolvedPos.depth);
    }
    
    // Insert the appropriate content based on type
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

  private getToolbarGroups(): ToolbarGroup[] {
    return [
      {
        name: 'history',
        buttons: [
          {
            id: 'undo',
            icon: this.icons.undo,
            title: 'Undo (Ctrl+Z)',
            action: () => this.editor.undo(),
            isDisabled: () => !this.editor.canUndo(),
          },
          {
            id: 'redo',
            icon: this.icons.redo,
            title: 'Redo (Ctrl+Y)',
            action: () => this.editor.redo(),
            isDisabled: () => !this.editor.canRedo(),
          },
        ],
      },
      {
        name: 'headings',
        buttons: [
          {
            id: 'paragraph',
            icon: this.icons.paragraph,
            title: 'Paragraph',
            action: () => this.editor.setParagraph(),
            isActive: () => this.editor.isActive('paragraph'),
          },
          {
            id: 'h1',
            icon: this.icons.h1,
            title: 'Heading 1',
            action: () => this.editor.setHeading(1),
            isActive: () => this.editor.isActive('heading', { level: 1 }),
          },
          {
            id: 'h2',
            icon: this.icons.h2,
            title: 'Heading 2',
            action: () => this.editor.setHeading(2),
            isActive: () => this.editor.isActive('heading', { level: 2 }),
          },
          {
            id: 'h3',
            icon: this.icons.h3,
            title: 'Heading 3',
            action: () => this.editor.setHeading(3),
            isActive: () => this.editor.isActive('heading', { level: 3 }),
          },
        ],
      },
      {
        name: 'formatting',
        buttons: [
          {
            id: 'bold',
            icon: this.icons.bold,
            title: 'Bold (Ctrl+B)',
            action: () => this.editor.toggleBold(),
            isActive: () => this.editor.isActive('bold'),
          },
          {
            id: 'italic',
            icon: this.icons.italic,
            title: 'Italic (Ctrl+I)',
            action: () => this.editor.toggleItalic(),
            isActive: () => this.editor.isActive('italic'),
          },
          {
            id: 'strike',
            icon: this.icons.strike,
            title: 'Strikethrough',
            action: () => this.editor.toggleStrike(),
            isActive: () => this.editor.isActive('strike'),
          },
          {
            id: 'code',
            icon: this.icons.code,
            title: 'Inline Code',
            action: () => this.editor.toggleCode(),
            isActive: () => this.editor.isActive('code'),
          },
        ],
      },
      {
        name: 'lists',
        buttons: [
          {
            id: 'bulletList',
            icon: this.icons.bulletList,
            title: 'Bullet List',
            action: () => this.editor.toggleBulletList(),
            isActive: () => this.editor.isActive('bulletList'),
          },
          {
            id: 'orderedList',
            icon: this.icons.orderedList,
            title: 'Numbered List',
            action: () => this.editor.toggleOrderedList(),
            isActive: () => this.editor.isActive('orderedList'),
          },
          {
            id: 'taskList',
            icon: this.icons.taskList,
            title: 'Task List',
            action: () => this.editor.toggleTaskList(),
            isActive: () => this.editor.isActive('taskList'),
          },
        ],
      },
      {
        name: 'blocks',
        buttons: [
          {
            id: 'blockquote',
            icon: this.icons.blockquote,
            title: 'Blockquote',
            action: () => this.editor.toggleBlockquote(),
            isActive: () => this.editor.isActive('blockquote'),
            draggable: true,
            dragData: { type: 'blockquote' },
          },
          {
            id: 'codeBlock',
            icon: this.icons.codeBlock,
            title: 'Code Block',
            action: () => this.editor.toggleCodeBlock(),
            isActive: () => this.editor.isActive('codeBlock'),
            draggable: true,
            dragData: { type: 'codeBlock' },
          },
          {
            id: 'divBlock',
            icon: this.icons.divBlock,
            title: 'Div Block (drag or click)',
            action: () => this.editor.toggleDivBlock(),
            isActive: () => this.editor.isActive('divBlock'),
            draggable: true,
            dragData: { type: 'divBlock' },
          },
          {
            id: 'horizontalRule',
            icon: this.icons.horizontalRule,
            title: 'Horizontal Rule',
            action: () => this.editor.setHorizontalRule(),
            draggable: true,
            dragData: { type: 'horizontalRule' },
          },
        ],
      },
      {
        name: 'insert',
        buttons: [
          {
            id: 'link',
            icon: this.icons.link,
            title: 'Insert Link',
            action: () => this.handleLinkAction(),
            isActive: () => this.editor.isActive('link'),
          },
          {
            id: 'image',
            icon: this.icons.image,
            title: 'Insert Image (drag or click)',
            action: () => this.handleImageAction(),
            draggable: true,
            dragData: { type: 'image' },
          },
          {
            id: 'table',
            icon: this.icons.table,
            title: 'Insert Table (drag or click)',
            action: () => this.editor.insertTable(3, 3),
            draggable: true,
            dragData: { type: 'table' },
          },
          {
            id: 'columns2',
            icon: this.icons.columns2,
            title: '2 Columns (drag or click)',
            action: () => this.editor.insertTwoColumns(),
            isActive: () => this.editor.isActive('columnLayout', { columns: 2 }),
            draggable: true,
            dragData: { type: 'columnLayout', content: { columns: 2 } },
          },
          {
            id: 'columns3',
            icon: this.icons.columns3,
            title: '3 Columns (drag or click)',
            action: () => this.editor.insertThreeColumns(),
            isActive: () => this.editor.isActive('columnLayout', { columns: 3 }),
            draggable: true,
            dragData: { type: 'columnLayout', content: { columns: 3 } },
          },
        ],
      },
      {
        name: 'sidebar',
        buttons: [
          {
            id: 'toggleSidebar',
            icon: this.icons.sidebar,
            title: 'Toggle Tools Panel',
            action: () => this.onToggleSidebar?.(),
            isActive: () => this.sidebarExpanded,
          },
        ],
      },
    ];
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

  private setupUpdateListener(): void {
    // Update button states when editor changes
    const tipTap = this.editor.getTipTapEditor();
    tipTap.on('transaction', () => this.updateButtonStates());
    tipTap.on('selectionUpdate', () => this.updateButtonStates());
  }

  private updateButtonStates(): void {
    const groups = this.getToolbarGroups();
    
    groups.forEach(group => {
      group.buttons.forEach(buttonConfig => {
        const btn = this.element.querySelector(`[data-action="${buttonConfig.id}"]`) as HTMLButtonElement;
        if (!btn) return;

        // Update active state
        if (buttonConfig.isActive) {
          btn.classList.toggle('active', buttonConfig.isActive());
        }

        // Update disabled state
        if (buttonConfig.isDisabled) {
          btn.disabled = buttonConfig.isDisabled();
        }
      });
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

  // SVG Icons
  private icons = {
    undo: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
    redo: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>`,
    paragraph: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4v16"/><path d="M17 4v16"/><path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13"/></svg>`,
    h1: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="m17 12 3-2v8"/></svg>`,
    h2: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/></svg>`,
    h3: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2"/><path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2"/></svg>`,
    bold: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>`,
    italic: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
    strike: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></svg>`,
    code: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    bulletList: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>`,
    orderedList: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>`,
    taskList: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><line x1="13" y1="6" x2="21" y2="6"/><line x1="13" y1="12" x2="21" y2="12"/><line x1="13" y1="18" x2="21" y2="18"/></svg>`,
    blockquote: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>`,
    codeBlock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m10 10-2 2 2 2"/><path d="m14 14 2-2-2-2"/></svg>`,
    horizontalRule: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/></svg>`,
    divBlock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>`,
    link: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    image: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    table: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`,
    columns2: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>`,
    columns3: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`,
    sidebar: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`,
  };
}
