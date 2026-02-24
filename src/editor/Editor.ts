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

/** When false, commands run without focusing the editor (e.g. when invoked from sidebar to avoid showing toolbar). */
export type EditorCommandOptions = { focus?: boolean };

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

  // Formatting Commands (opts.focus: false when invoking from sidebar to avoid showing toolbar)
  toggleBold(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.toggleBold().run();
  }

  toggleItalic(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.toggleItalic().run();
  }

  toggleStrike(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.toggleStrike().run();
  }

  toggleCode(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.toggleCode().run();
  }

  toggleBlockquote(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.toggleBlockquote().run();
  }

  toggleBulletList(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.toggleBulletList().run();
  }

  toggleOrderedList(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.toggleOrderedList().run();
  }

  toggleTaskList(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.toggleTaskList().run();
  }

  toggleCodeBlock(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.toggleCodeBlock().run();
  }

  setHeading(level: 1 | 2 | 3, opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.toggleHeading({ level }).run();
  }

  setParagraph(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.setParagraph().run();
  }

  // Link (openInNewTab sets target="_blank" and rel="noopener noreferrer" on the <a> tag)
  setLink(
    url: string,
    opts?: EditorCommandOptions & { openInNewTab?: boolean }
  ): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain
      .setLink({
        href: url,
        target: opts?.openInNewTab ? '_blank' : null,
        rel: opts?.openInNewTab ? 'noopener noreferrer' : null,
      })
      .run();
  }

  getLinkAttributes(): { href?: string; target?: string } | null {
    if (!this.editor.isActive('link')) return null;
    return this.editor.getAttributes('link') as { href?: string; target?: string };
  }

  unsetLink(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.unsetLink().run();
  }

  // Image
  insertImage(src: string, alt?: string, opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.setImage({ src, alt }).run();
  }

  // Table
  insertTable(rows = 3, cols = 3, opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.insertTable({ rows, cols, withHeaderRow: true }).run();
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
  undo(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.undo().run();
  }

  redo(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.redo().run();
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
  setHorizontalRule(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.setHorizontalRule().run();
  }

  // Div Block
  toggleDivBlock(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.toggleDivBlock().run();
  }

  setDivBlock(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.setDivBlock().run();
  }

  unsetDivBlock(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.unsetDivBlock().run();
  }

  // Column Layout
  insertColumns(count: number = 2, opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.insertColumnLayout(count).run();
  }

  insertTwoColumns(opts?: EditorCommandOptions): void {
    this.insertColumns(2, opts);
  }

  insertThreeColumns(opts?: EditorCommandOptions): void {
    this.insertColumns(3, opts);
  }

  addColumn(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.addColumn().run();
  }

  removeColumn(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.removeColumn().run();
  }

  removeColumnLayout(opts?: EditorCommandOptions): void {
    const chain = opts?.focus !== false ? this.editor.chain().focus() : this.editor.chain();
    chain.removeColumnLayout().run();
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
