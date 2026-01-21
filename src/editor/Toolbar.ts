import { ContentEditor } from './Editor';
import { icons } from '../utils/icons';
import { DragDropManager, DragData } from '../utils/DragDropManager';

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
  private dragDropManager: DragDropManager | null = null;
  private onToggleSidebar?: () => void;
  private sidebarExpanded = false;

  constructor(config: ToolbarConfig) {
    this.editor = config.editor;
    this.container = config.container;
    this.onToggleSidebar = config.onToggleSidebar;
    this.element = this.createToolbar();
    this.container.prepend(this.element);
    this.setupUpdateListener();
    this.initDragDrop();
  }

  private initDragDrop(): void {
    // Delayed initialization to ensure editor element exists
    setTimeout(() => {
      const editorElement = this.container.querySelector('.tiptap') as HTMLElement;
      if (editorElement) {
        this.dragDropManager = new DragDropManager({
          editor: this.editor.getTipTapEditor(),
          editorElement,
          brandColor: 'var(--brand-primary, #007f00)',
        });
      }
    }, 100);
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
    
    // Make button draggable if configured - setup after DragDropManager is ready
    if (config.draggable && config.dragData) {
      // Store reference for delayed setup
      const dragData = config.dragData as DragData;
      const title = config.title;
      
      // Setup drag events immediately (dragDropManager handles the drop zone)
      button.draggable = true;
      button.classList.add('draggable');
      
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
    }
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      config.action();
    });

    return button;
  }

  private getToolbarGroups(): ToolbarGroup[] {
    return [
      {
        name: 'history',
        buttons: [
          {
            id: 'undo',
            icon: icons.undo,
            title: 'Undo (Ctrl+Z)',
            action: () => this.editor.undo(),
            isDisabled: () => !this.editor.canUndo(),
          },
          {
            id: 'redo',
            icon: icons.redo,
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
            icon: icons.paragraph,
            title: 'Paragraph',
            action: () => this.editor.setParagraph(),
            isActive: () => this.editor.isActive('paragraph'),
          },
          {
            id: 'h1',
            icon: icons.h1,
            title: 'Heading 1',
            action: () => this.editor.setHeading(1),
            isActive: () => this.editor.isActive('heading', { level: 1 }),
          },
          {
            id: 'h2',
            icon: icons.h2,
            title: 'Heading 2',
            action: () => this.editor.setHeading(2),
            isActive: () => this.editor.isActive('heading', { level: 2 }),
          },
          {
            id: 'h3',
            icon: icons.h3,
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
            icon: icons.bold,
            title: 'Bold (Ctrl+B)',
            action: () => this.editor.toggleBold(),
            isActive: () => this.editor.isActive('bold'),
          },
          {
            id: 'italic',
            icon: icons.italic,
            title: 'Italic (Ctrl+I)',
            action: () => this.editor.toggleItalic(),
            isActive: () => this.editor.isActive('italic'),
          },
          {
            id: 'strike',
            icon: icons.strike,
            title: 'Strikethrough',
            action: () => this.editor.toggleStrike(),
            isActive: () => this.editor.isActive('strike'),
          },
          {
            id: 'code',
            icon: icons.code,
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
            icon: icons.bulletList,
            title: 'Bullet List',
            action: () => this.editor.toggleBulletList(),
            isActive: () => this.editor.isActive('bulletList'),
          },
          {
            id: 'orderedList',
            icon: icons.orderedList,
            title: 'Numbered List',
            action: () => this.editor.toggleOrderedList(),
            isActive: () => this.editor.isActive('orderedList'),
          },
          {
            id: 'taskList',
            icon: icons.taskList,
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
            icon: icons.blockquote,
            title: 'Blockquote',
            action: () => this.editor.toggleBlockquote(),
            isActive: () => this.editor.isActive('blockquote'),
            draggable: true,
            dragData: { type: 'blockquote' },
          },
          {
            id: 'codeBlock',
            icon: icons.codeBlock,
            title: 'Code Block',
            action: () => this.editor.toggleCodeBlock(),
            isActive: () => this.editor.isActive('codeBlock'),
            draggable: true,
            dragData: { type: 'codeBlock' },
          },
          {
            id: 'divBlock',
            icon: icons.divBlock,
            title: 'Div Block (drag or click)',
            action: () => this.editor.toggleDivBlock(),
            isActive: () => this.editor.isActive('divBlock'),
            draggable: true,
            dragData: { type: 'divBlock' },
          },
          {
            id: 'horizontalRule',
            icon: icons.horizontalRule,
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
            icon: icons.link,
            title: 'Insert Link',
            action: () => this.handleLinkAction(),
            isActive: () => this.editor.isActive('link'),
          },
          {
            id: 'image',
            icon: icons.image,
            title: 'Insert Image (drag or click)',
            action: () => this.handleImageAction(),
            draggable: true,
            dragData: { type: 'image' },
          },
          {
            id: 'table',
            icon: icons.table,
            title: 'Insert Table (drag or click)',
            action: () => this.editor.insertTable(3, 3),
            draggable: true,
            dragData: { type: 'table' },
          },
          {
            id: 'columns2',
            icon: icons.columns2,
            title: '2 Columns (drag or click)',
            action: () => this.editor.insertTwoColumns(),
            isActive: () => this.editor.isActive('columnLayout', { columns: 2 }),
            draggable: true,
            dragData: { type: 'columnLayout', content: { columns: 2 } },
          },
          {
            id: 'columns3',
            icon: icons.columns3,
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
            icon: icons.sidebar,
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

}
