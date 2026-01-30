import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import { common, createLowlight } from 'lowlight';
import { DivBlock } from './DivBlock';
import { Column, ColumnLayout, ColumnResize } from './Columns';
import { TextSize } from './TextSize';
import { BlockStyle } from './BlockStyle';

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

export interface ExtensionOptions {
  placeholder?: string;
  /** Dynamic placeholder getter (used when provided so Bubble can update placeholder) */
  getPlaceholder?: () => string;
  characterLimit?: number;
}

export function createExtensions(options: ExtensionOptions = {}) {
  return [
    StarterKit.configure({
      codeBlock: false, // We use CodeBlockLowlight instead
    }),
    // Text styling extensions
    TextStyle,
    Color,
    TextSize,
    TextAlign.configure({
      types: ['heading', 'paragraph', 'divBlock'],
    }),
    BlockStyle.configure({
      types: ['paragraph', 'heading', 'divBlock', 'blockquote'],
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'editor-link',
      },
    }),
    Image.configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: {
        class: 'editor-image',
      },
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'editor-table',
      },
    }),
    TableRow,
    TableCell,
    TableHeader,
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: {
        class: 'editor-code-block',
      },
    }),
    Placeholder.configure({
      placeholder: options.getPlaceholder
        ? options.getPlaceholder
        : (options.placeholder || 'Start writing...'),
    }),
    CharacterCount.configure({
      limit: options.characterLimit,
    }),
    TaskList.configure({
      HTMLAttributes: {
        class: 'editor-task-list',
      },
    }),
    TaskItem.configure({
      nested: true,
    }),
    DivBlock.configure({
      HTMLAttributes: {
        class: 'editor-div-block',
      },
    }),
    Column,
    ColumnLayout.configure({
      HTMLAttributes: {
        class: 'editor-column-layout',
      },
    }),
    ColumnResize,
  ];
}
