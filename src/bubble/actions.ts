import { ContentEditor } from '../editor/Editor';
import { BubbleMock, BubbleAction } from '../mock/BubbleMock';

export interface ActionHandlerOptions {
  /** Called after set_content runs so the element can e.g. set "ready for revert" cooldown and sync immediately. */
  onSetContent?: () => void;
}

/**
 * ActionHandler - Handles Bubble actions and routes them to the editor
 */
export class ActionHandler {
  private editor: ContentEditor;
  private bubble: BubbleMock;
  private options: ActionHandlerOptions;
  private unsubscribe: (() => void) | null = null;

  constructor(editor: ContentEditor, bubble: BubbleMock, options: ActionHandlerOptions = {}) {
    this.editor = editor;
    this.bubble = bubble;
    this.options = options;
    this.setupActionListener();
  }

  private setupActionListener(): void {
    this.unsubscribe = this.bubble.onAction((action: BubbleAction) => {
      this.handleAction(action);
    });
  }

  private handleAction(action: BubbleAction): void {
    switch (action.name) {
      case 'set_content':
        this.handleSetContent(action.params);
        break;
      case 'clear_content':
        this.handleClearContent();
        break;
      case 'focus':
        this.handleFocus();
        break;
      case 'insert_image':
        this.handleInsertImage(action.params);
        break;
      default:
        console.warn(`Unknown action: ${action.name}`);
    }
  }

  private handleSetContent(params?: Record<string, unknown>): void {
    if (!params) return;
    
    const content = params.content as string | undefined;
    if (content !== undefined) {
      this.editor.setContent(content);
      this.options.onSetContent?.();
    }
  }

  private handleClearContent(): void {
    this.editor.clearContent();
  }

  private handleFocus(): void {
    this.editor.focus();
  }

  private handleInsertImage(params?: Record<string, unknown>): void {
    if (!params) return;
    
    const url = params.url as string | undefined;
    const alt = params.alt as string | undefined;
    
    if (url) {
      this.editor.insertImage(url, alt);
    }
  }

  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
