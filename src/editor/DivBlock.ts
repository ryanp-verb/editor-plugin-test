import { Node, mergeAttributes } from '@tiptap/core';
import { buildBlockStyleString, BlockStyleAttributes } from './BlockStyle';

export interface DivBlockOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    divBlock: {
      /**
       * Set a div block
       */
      setDivBlock: (attributes?: { class?: string }) => ReturnType;
      /**
       * Toggle a div block
       */
      toggleDivBlock: (attributes?: { class?: string }) => ReturnType;
      /**
       * Unset a div block
       */
      unsetDivBlock: () => ReturnType;
    };
  }
}

export const DivBlock = Node.create<DivBlockOptions>({
  name: 'divBlock',

  group: 'block',

  content: 'block+',

  defining: true,
  
  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'editor-div-block',
      },
    };
  },

  addAttributes() {
    return {
      // Block style attributes
      backgroundColor: { default: null },
      borderTopWidth: { default: null },
      borderRightWidth: { default: null },
      borderBottomWidth: { default: null },
      borderLeftWidth: { default: null },
      borderColor: { default: null },
      borderTopLeftRadius: { default: null },
      borderTopRightRadius: { default: null },
      borderBottomRightRadius: { default: null },
      borderBottomLeftRadius: { default: null },
      paddingTop: { default: null },
      paddingRight: { default: null },
      paddingBottom: { default: null },
      paddingLeft: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="div-block"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const attrs = node.attrs;
    const blockStyle = buildBlockStyleString(attrs as BlockStyleAttributes);
    const styleAttr = blockStyle ? { style: blockStyle } : {};
    
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'div-block',
        ...styleAttr,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setDivBlock:
        (attributes) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, attributes);
        },
      toggleDivBlock:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, attributes);
        },
      unsetDivBlock:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-d': () => this.editor.commands.toggleDivBlock(),
    };
  },
});
