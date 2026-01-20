import { Node, mergeAttributes } from '@tiptap/core';

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
    // Build combined style string
    const styles: string[] = [];
    const attrs = node.attrs;
    
    // Background
    if (attrs.backgroundColor && attrs.backgroundColor !== 'transparent') {
      styles.push(`background-color: ${attrs.backgroundColor}`);
    }
    
    // Borders
    const bt = attrs.borderTopWidth ?? 0;
    const br = attrs.borderRightWidth ?? 0;
    const bb = attrs.borderBottomWidth ?? 0;
    const bl = attrs.borderLeftWidth ?? 0;
    if (bt || br || bb || bl) {
      styles.push(`border-style: solid`);
      styles.push(`border-width: ${bt}px ${br}px ${bb}px ${bl}px`);
      if (attrs.borderColor) {
        styles.push(`border-color: ${attrs.borderColor}`);
      }
    }
    
    // Border radius
    const rtl = attrs.borderTopLeftRadius ?? 0;
    const rtr = attrs.borderTopRightRadius ?? 0;
    const rbr = attrs.borderBottomRightRadius ?? 0;
    const rbl = attrs.borderBottomLeftRadius ?? 0;
    if (rtl || rtr || rbr || rbl) {
      styles.push(`border-radius: ${rtl}px ${rtr}px ${rbr}px ${rbl}px`);
    }
    
    // Padding
    const pt = attrs.paddingTop ?? 0;
    const pr = attrs.paddingRight ?? 0;
    const pb = attrs.paddingBottom ?? 0;
    const pl = attrs.paddingLeft ?? 0;
    if (pt || pr || pb || pl) {
      styles.push(`padding: ${pt}px ${pr}px ${pb}px ${pl}px`);
    }
    
    const styleAttr = styles.length > 0 ? { style: styles.join('; ') } : {};
    
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
