/**
 * DragDropManager - Shared drag-and-drop functionality for editor elements
 * 
 * Handles:
 * - Drag image creation
 * - Drop indicator positioning
 * - Content insertion at drop position
 */

import { Editor as TipTapEditor } from '@tiptap/core';

export interface DragData {
  type: string;
  content?: Record<string, unknown>;
}

export interface DragDropConfig {
  editor: TipTapEditor;
  editorElement: HTMLElement;
  brandColor?: string;
}

export class DragDropManager {
  private editor: TipTapEditor;
  private editorElement: HTMLElement;
  private dropIndicator: HTMLElement | null = null;
  private brandColor: string;

  constructor(config: DragDropConfig) {
    this.editor = config.editor;
    this.editorElement = config.editorElement;
    this.brandColor = config.brandColor || '#007f00';
    this.setupDropZone();
  }

  /**
   * Create a drag image element for visual feedback
   */
  createDragImage(title: string): HTMLElement {
    const el = document.createElement('div');
    el.className = 'drag-image';
    el.textContent = title;
    el.style.cssText = `
      position: absolute;
      top: -1000px;
      left: -1000px;
      padding: 8px 12px;
      background: ${this.brandColor};
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

  /**
   * Setup the drop zone event listeners
   */
  private setupDropZone(): void {
    // Create drop indicator
    this.dropIndicator = document.createElement('div');
    this.dropIndicator.className = 'editor-drop-indicator';

    this.editorElement.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.editorElement.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.editorElement.addEventListener('drop', (e) => this.handleDrop(e));
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
    if (!this.editorElement.contains(relatedTarget)) {
      this.hideDropIndicator();
    }
  }

  private handleDrop(e: DragEvent): void {
    e.preventDefault();
    this.hideDropIndicator();

    const data = e.dataTransfer?.getData('application/json');
    if (!data) return;

    try {
      const dragData = JSON.parse(data) as DragData;
      this.insertAtDropPosition(e, dragData);
    } catch {
      console.error('Failed to parse drag data');
    }
  }

  private showDropIndicator(e: DragEvent): void {
    if (!this.dropIndicator) return;

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

  hideDropIndicator(): void {
    if (this.dropIndicator) {
      this.dropIndicator.style.display = 'none';
    }
  }

  private getDropPosition(e: DragEvent): { top: number; pos: number } | null {
    const view = this.editor.view;
    const coords = { left: e.clientX, top: e.clientY };
    const posAtCoords = view.posAtCoords(coords);

    if (!posAtCoords) return null;

    const resolvedPos = view.state.doc.resolve(posAtCoords.pos);
    let blockPos = posAtCoords.pos;

    if (resolvedPos.parent.isBlock) {
      blockPos = resolvedPos.before(resolvedPos.depth);
    }

    const coordsAtPos = view.coordsAtPos(blockPos);
    const editorRect = this.editorElement.getBoundingClientRect();

    return {
      top: coordsAtPos.top - editorRect.top,
      pos: blockPos,
    };
  }

  private insertAtDropPosition(e: DragEvent, dragData: DragData): void {
    const view = this.editor.view;
    const coords = { left: e.clientX, top: e.clientY };
    const posAtCoords = view.posAtCoords(coords);

    if (!posAtCoords) return;

    const resolvedPos = view.state.doc.resolve(posAtCoords.pos);
    let insertPos = posAtCoords.pos;

    if (resolvedPos.parent.isBlock && resolvedPos.parent.type.name !== 'doc') {
      insertPos = resolvedPos.after(resolvedPos.depth);
    }

    this.insertContent(insertPos, dragData);
  }

  /**
   * Insert content at a specific position based on drag data type
   */
  private insertContent(insertPos: number, dragData: DragData): void {
    switch (dragData.type) {
      case 'divBlock':
        this.editor.chain().focus().insertContentAt(insertPos, {
          type: 'divBlock',
          content: [{ type: 'paragraph' }],
        }).run();
        break;

      case 'columnLayout': {
        const columns = (dragData.content?.columns as number) || 2;
        const columnNodes = Array.from({ length: columns }, () => ({
          type: 'column',
          content: [{ type: 'paragraph' }],
        }));
        this.editor.chain().focus().insertContentAt(insertPos, {
          type: 'columnLayout',
          attrs: { columns },
          content: columnNodes,
        }).run();
        break;
      }

      case 'table':
        this.editor.chain().focus().insertContentAt(insertPos, {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                { type: 'tableHeader', content: [{ type: 'paragraph' }] },
                { type: 'tableHeader', content: [{ type: 'paragraph' }] },
                { type: 'tableHeader', content: [{ type: 'paragraph' }] },
              ],
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', content: [{ type: 'paragraph' }] },
                { type: 'tableCell', content: [{ type: 'paragraph' }] },
                { type: 'tableCell', content: [{ type: 'paragraph' }] },
              ],
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', content: [{ type: 'paragraph' }] },
                { type: 'tableCell', content: [{ type: 'paragraph' }] },
                { type: 'tableCell', content: [{ type: 'paragraph' }] },
              ],
            },
          ],
        }).run();
        break;

      case 'image': {
        const url = prompt('Enter image URL:');
        if (url) {
          this.editor.chain().focus().insertContentAt(insertPos, {
            type: 'image',
            attrs: { src: url },
          }).run();
        }
        break;
      }

      case 'codeBlock':
        this.editor.chain().focus().insertContentAt(insertPos, {
          type: 'codeBlock',
          content: [],
        }).run();
        break;

      case 'blockquote':
        this.editor.chain().focus().insertContentAt(insertPos, {
          type: 'blockquote',
          content: [{ type: 'paragraph' }],
        }).run();
        break;

      case 'horizontalRule':
        this.editor.chain().focus().insertContentAt(insertPos, {
          type: 'horizontalRule',
        }).run();
        break;
    }
  }

  /**
   * Setup drag events on a button
   */
  setupDraggableButton(
    button: HTMLElement,
    dragData: DragData,
    title: string
  ): void {
    button.draggable = true;
    button.classList.add('draggable');

    button.addEventListener('dragstart', (e) => {
      if (e.dataTransfer) {
        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'copy';
        button.classList.add('dragging');

        const dragImage = this.createDragImage(title);
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

  destroy(): void {
    this.dropIndicator?.remove();
    this.dropIndicator = null;
  }
}
