import { Editor as TipTapEditor, JSONContent } from '@tiptap/core';
import { createExtensions, ExtensionOptions } from './extensions';
import { convertToEmailHTML, downloadEmailHTML, copyEmailHTMLToClipboard, EmailExportOptions } from '../utils/emailExport';

export interface EditorConfig {
  element: HTMLElement;
  /** Static placeholder (used if getPlaceholder not provided) */
  placeholder?: string;
  /** Dynamic placeholder getter (e.g. from Bubble properties) */
  getPlaceholder?: () => string;
  content?: string | JSONContent;
  editable?: boolean;
  characterLimit?: number;
  onUpdate?: (editor: ContentEditor) => void;
  onFocus?: (editor: ContentEditor) => void;
  onBlur?: (editor: ContentEditor) => void;
  onCreate?: (editor: ContentEditor) => void;
}

export interface EditorStats {
  wordCount: number;
  characterCount: number;
  isEmpty: boolean;
}

export class ContentEditor {
  private editor: TipTapEditor;
  private config: EditorConfig;

  constructor(config: EditorConfig) {
    this.config = config;

    const extensionOptions: ExtensionOptions = {
      placeholder: config.placeholder,
      getPlaceholder: config.getPlaceholder,
      characterLimit: config.characterLimit,
    };

    this.editor = new TipTapEditor({
      element: config.element,
      extensions: createExtensions(extensionOptions),
      content: config.content || '',
      editable: config.editable !== false,
      onUpdate: () => {
        this.config.onUpdate?.(this);
      },
      onFocus: () => {
        this.config.onFocus?.(this);
      },
      onBlur: () => {
        this.config.onBlur?.(this);
      },
      onCreate: () => {
        this.config.onCreate?.(this);
      },
    });
  }

  // Content Methods
  getHTML(): string {
    return this.editor.getHTML();
  }

  getJSON(): JSONContent {
    return this.editor.getJSON();
  }

  getText(): string {
    return this.editor.getText();
  }

  setContent(content: string | JSONContent): void {
    this.editor.commands.setContent(content);
  }

  clearContent(): void {
    this.editor.commands.clearContent();
  }

  // Editor State
  isEmpty(): boolean {
    return this.editor.isEmpty;
  }

  getStats(): EditorStats {
    const storage = this.editor.storage.characterCount;
    return {
      wordCount: storage?.words() || 0,
      characterCount: storage?.characters() || 0,
      isEmpty: this.editor.isEmpty,
    };
  }

  /** Force placeholder to re-render (e.g. after Bubble property change) */
  refreshPlaceholder(): void {
    this.editor.view.dispatch(this.editor.state.tr);
  }

  // Editing State
  setEditable(editable: boolean): void {
    this.editor.setEditable(editable);
  }

  isEditable(): boolean {
    return this.editor.isEditable;
  }

  // Focus
  focus(): void {
    this.editor.commands.focus();
  }

  blur(): void {
    this.editor.commands.blur();
  }

  isFocused(): boolean {
    return this.editor.isFocused;
  }

  // Formatting Commands
  toggleBold(): void {
    this.editor.chain().focus().toggleBold().run();
  }

  toggleItalic(): void {
    this.editor.chain().focus().toggleItalic().run();
  }

  toggleStrike(): void {
    this.editor.chain().focus().toggleStrike().run();
  }

  toggleCode(): void {
    this.editor.chain().focus().toggleCode().run();
  }

  toggleBlockquote(): void {
    this.editor.chain().focus().toggleBlockquote().run();
  }

  toggleBulletList(): void {
    this.editor.chain().focus().toggleBulletList().run();
  }

  toggleOrderedList(): void {
    this.editor.chain().focus().toggleOrderedList().run();
  }

  toggleTaskList(): void {
    this.editor.chain().focus().toggleTaskList().run();
  }

  toggleCodeBlock(): void {
    this.editor.chain().focus().toggleCodeBlock().run();
  }

  setHeading(level: 1 | 2 | 3): void {
    this.editor.chain().focus().toggleHeading({ level }).run();
  }

  setParagraph(): void {
    this.editor.chain().focus().setParagraph().run();
  }

  // Link
  setLink(url: string): void {
    this.editor.chain().focus().setLink({ href: url }).run();
  }

  unsetLink(): void {
    this.editor.chain().focus().unsetLink().run();
  }

  // Image
  insertImage(src: string, alt?: string): void {
    this.editor.chain().focus().setImage({ src, alt }).run();
  }

  // Table
  insertTable(rows = 3, cols = 3): void {
    this.editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
  }

  deleteTable(): void {
    this.editor.chain().focus().deleteTable().run();
  }

  addTableRowBefore(): void {
    this.editor.chain().focus().addRowBefore().run();
  }

  addTableRowAfter(): void {
    this.editor.chain().focus().addRowAfter().run();
  }

  deleteTableRow(): void {
    this.editor.chain().focus().deleteRow().run();
  }

  addTableColumnBefore(): void {
    this.editor.chain().focus().addColumnBefore().run();
  }

  addTableColumnAfter(): void {
    this.editor.chain().focus().addColumnAfter().run();
  }

  deleteTableColumn(): void {
    this.editor.chain().focus().deleteColumn().run();
  }

  // Undo/Redo
  undo(): void {
    this.editor.chain().focus().undo().run();
  }

  redo(): void {
    this.editor.chain().focus().redo().run();
  }

  // Check active state
  isActive(name: string, attributes?: Record<string, unknown>): boolean {
    return this.editor.isActive(name, attributes);
  }

  canUndo(): boolean {
    return this.editor.can().undo();
  }

  canRedo(): boolean {
    return this.editor.can().redo();
  }

  // Horizontal Rule
  setHorizontalRule(): void {
    this.editor.chain().focus().setHorizontalRule().run();
  }

  // Div Block
  toggleDivBlock(): void {
    this.editor.chain().focus().toggleDivBlock().run();
  }

  setDivBlock(): void {
    this.editor.chain().focus().setDivBlock().run();
  }

  unsetDivBlock(): void {
    this.editor.chain().focus().unsetDivBlock().run();
  }

  // Column Layout
  insertColumns(count: number = 2): void {
    this.editor.chain().focus().insertColumnLayout(count).run();
  }

  insertTwoColumns(): void {
    this.insertColumns(2);
  }

  insertThreeColumns(): void {
    this.insertColumns(3);
  }

  addColumn(): void {
    this.editor.chain().focus().addColumn().run();
  }

  removeColumn(): void {
    this.editor.chain().focus().removeColumn().run();
  }

  removeColumnLayout(): void {
    this.editor.chain().focus().removeColumnLayout().run();
  }

  // Email Export
  getEmailHTML(options?: EmailExportOptions): string {
    return convertToEmailHTML(this.getHTML(), options);
  }

  downloadAsEmail(filename?: string, options?: EmailExportOptions): void {
    downloadEmailHTML(this.getHTML(), filename, options);
  }

  async copyEmailToClipboard(options?: EmailExportOptions): Promise<boolean> {
    return copyEmailHTMLToClipboard(this.getHTML(), options);
  }

  // Destroy
  destroy(): void {
    this.editor.destroy();
  }

  // Get underlying TipTap editor
  getTipTapEditor(): TipTapEditor {
    return this.editor;
  }
}
