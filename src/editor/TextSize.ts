/**
 * TextSize Extension
 * 
 * Adds font-size as a mark that can be applied to text.
 * Supports predefined sizes: small, medium, large, xlarge
 */

import { Mark, mergeAttributes } from '@tiptap/core';

export interface TextSizeOptions {
  sizes: Record<string, string>;
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textSize: {
      /**
       * Set the text size
       */
      setTextSize: (size: string) => ReturnType;
      /**
       * Unset the text size
       */
      unsetTextSize: () => ReturnType;
    };
  }
}

export const TextSize = Mark.create<TextSizeOptions>({
  name: 'textSize',

  addOptions() {
    return {
      sizes: {
        small: '13px',
        medium: '16px',
        large: '20px',
        xlarge: '24px',
      },
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: element => element.style.fontSize || null,
        renderHTML: attributes => {
          if (!attributes.size) {
            return {};
          }

          const fontSize = this.options.sizes[attributes.size] || attributes.size;

          return {
            style: `font-size: ${fontSize}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[style*="font-size"]',
        getAttrs: element => {
          const fontSize = (element as HTMLElement).style.fontSize;
          // Try to match to a named size
          const sizeEntry = Object.entries(this.options.sizes).find(
            ([, value]) => value === fontSize
          );
          return { size: sizeEntry ? sizeEntry[0] : fontSize };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setTextSize:
        (size: string) =>
        ({ commands }) => {
          return commands.setMark(this.name, { size });
        },
      unsetTextSize:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
