import { Node, mergeAttributes, Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { buildBlockStyleString, BlockStyleAttributes } from './BlockStyle';

/**
 * Column Layout Extension
 * 
 * Creates a flex container that holds multiple Column nodes
 */

export interface ColumnLayoutOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columnLayout: {
      /**
       * Insert a column layout with specified number of columns
       */
      insertColumnLayout: (columns?: number) => ReturnType;
      /**
       * Remove the column layout
       */
      removeColumnLayout: () => ReturnType;
      /**
       * Add a column to the current layout
       */
      addColumn: () => ReturnType;
      /**
       * Remove a column from the current layout
       */
      removeColumn: () => ReturnType;
    };
  }
}

// Individual Column Node
export const Column = Node.create({
  name: 'column',

  group: 'column',

  content: 'block+',

  isolating: true,
  
  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'editor-column',
      },
    };
  },

  addAttributes() {
    return {
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-width'),
        renderHTML: () => ({}), // Handled in combined style below
      },
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
        tag: 'div[data-type="column"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const attrs = node.attrs;
    
    // Build style from block style attributes
    const blockStyle = buildBlockStyleString(attrs as BlockStyleAttributes);
    
    // Add column-specific width as CSS variable
    const widthStyle = attrs.width ? `--column-width: ${attrs.width}` : '';
    const combinedStyle = [widthStyle, blockStyle].filter(Boolean).join('; ');
    
    const styleAttr = combinedStyle ? { style: combinedStyle } : {};
    const dataWidthAttr = attrs.width ? { 'data-width': attrs.width } : {};
    
    // Create column with resize handle
    const resizeHandle = ['div', { class: 'column-resize-handle', contenteditable: 'false' }];
    
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'column',
        ...dataWidthAttr,
        ...styleAttr,
      }),
      ['div', { class: 'column-content' }, 0],
      resizeHandle,
    ];
  },
});

// Column Layout Container
export const ColumnLayout = Node.create<ColumnLayoutOptions>({
  name: 'columnLayout',

  group: 'block',

  content: 'column+',

  defining: true,

  isolating: true,
  
  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'editor-column-layout',
      },
    };
  },

  addAttributes() {
    return {
      columns: {
        default: 2,
        parseHTML: (element) => {
          return parseInt(element.getAttribute('data-columns') || '2', 10);
        },
        renderHTML: () => ({}), // Handled below
      },
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
        tag: 'div[data-type="column-layout"]',
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
        'data-type': 'column-layout',
        'data-columns': attrs.columns,
        ...styleAttr,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertColumnLayout:
        (columns = 2) =>
        ({ chain, state }) => {
          const { selection } = state;
          const pos = selection.$from.end();

          // Create column content
          const columnNodes = [];
          for (let i = 0; i < columns; i++) {
            columnNodes.push({
              type: 'column',
              content: [{ type: 'paragraph' }],
            });
          }

          return chain()
            .insertContentAt(pos, {
              type: 'columnLayout',
              attrs: { columns },
              content: columnNodes,
            })
            .focus()
            .run();
        },

      removeColumnLayout:
        () =>
        ({ commands, state }) => {
          const { selection } = state;
          const node = selection.$from.node(-1);
          
          if (node?.type.name === 'columnLayout') {
            return commands.deleteNode('columnLayout');
          }
          
          // Check if we're inside a column
          const columnLayout = selection.$from.node(-2);
          if (columnLayout?.type.name === 'columnLayout') {
            return commands.deleteNode('columnLayout');
          }
          
          return false;
        },

      addColumn:
        () =>
        ({ state, chain }) => {
          const { selection } = state;
          
          // Find the column layout node
          let depth = selection.$from.depth;
          let layoutPos = -1;
          
          while (depth > 0) {
            const node = selection.$from.node(depth);
            if (node.type.name === 'columnLayout') {
              layoutPos = selection.$from.before(depth);
              break;
            }
            depth--;
          }
          
          if (layoutPos === -1) return false;
          
          const layoutNode = state.doc.nodeAt(layoutPos);
          if (!layoutNode) return false;
          
          const endPos = layoutPos + layoutNode.nodeSize - 1;
          const newColumnCount = layoutNode.attrs.columns + 1;
          
          return chain()
            .insertContentAt(endPos, {
              type: 'column',
              content: [{ type: 'paragraph' }],
            })
            .updateAttributes('columnLayout', { columns: newColumnCount })
            .run();
        },

      removeColumn:
        () =>
        ({ state, chain, commands }) => {
          const { selection } = state;
          
          // Find if we're in a column
          let depth = selection.$from.depth;
          
          while (depth > 0) {
            const node = selection.$from.node(depth);
            if (node.type.name === 'column') {
              const layoutNode = selection.$from.node(depth - 1);
              if (layoutNode?.type.name === 'columnLayout' && layoutNode.childCount > 1) {
                // Update column count and delete the column
                const newCount = layoutNode.attrs.columns - 1;
                return chain()
                  .command(({ tr }) => {
                    const pos = selection.$from.before(depth);
                    const columnNode = state.doc.nodeAt(pos);
                    if (columnNode) {
                      tr.delete(pos, pos + columnNode.nodeSize);
                    }
                    return true;
                  })
                  .updateAttributes('columnLayout', { columns: newCount })
                  .run();
              } else if (layoutNode?.childCount === 1) {
                // If only one column left, remove the entire layout
                return commands.removeColumnLayout();
              }
            }
            depth--;
          }
          
          return false;
        },
    };
  },
});

// Column Resize Plugin Key
const columnResizePluginKey = new PluginKey('columnResize');

interface ResizeState {
  dragging: boolean;
  startX: number;
  columnPos: number;
  nextColumnPos: number;
  startWidths: { left: number; right: number };
  layoutWidth: number;
}

// Column Resize Extension
export const ColumnResize = Extension.create({
  name: 'columnResize',

  addProseMirrorPlugins() {
    const editor = this.editor;
    
    return [
      new Plugin({
        key: columnResizePluginKey,
        
        state: {
          init(): ResizeState {
            return {
              dragging: false,
              startX: 0,
              columnPos: 0,
              nextColumnPos: 0,
              startWidths: { left: 0, right: 0 },
              layoutWidth: 0,
            };
          },
          apply(tr, prev): ResizeState {
            const meta = tr.getMeta(columnResizePluginKey);
            if (meta) {
              return { ...prev, ...meta };
            }
            return prev;
          },
        },
        
        props: {
          handleDOMEvents: {
            mousedown(view, event) {
              const target = event.target as HTMLElement;
              
              if (!target.classList.contains('column-resize-handle')) {
                return false;
              }
              
              event.preventDefault();
              
              // Find the column element (parent of resize handle)
              const columnElement = target.closest('.editor-column') as HTMLElement;
              if (!columnElement) return false;
              
              // Find the layout element
              const layoutElement = columnElement.closest('.editor-column-layout') as HTMLElement;
              if (!layoutElement) return false;
              
              // Get all columns in this layout
              const columns = Array.from(layoutElement.querySelectorAll(':scope > .editor-column'));
              const columnIndex = columns.indexOf(columnElement);
              
              if (columnIndex === -1 || columnIndex >= columns.length - 1) {
                return false; // Last column or not found
              }
              
              // Find document positions for the columns
              const layoutPos = view.posAtDOM(layoutElement, 0) - 1;
              const layoutNode = view.state.doc.nodeAt(layoutPos);
              
              if (!layoutNode || layoutNode.type.name !== 'columnLayout') {
                return false;
              }
              
              // Find the column positions
              let offset = 1;
              let columnPos = 0;
              let nextColumnPos = 0;
              
              layoutNode.forEach((column, _, index) => {
                if (index === columnIndex) {
                  columnPos = layoutPos + offset;
                } else if (index === columnIndex + 1) {
                  nextColumnPos = layoutPos + offset;
                }
                offset += column.nodeSize;
              });
              
              // Get layout width
              const layoutRect = layoutElement.getBoundingClientRect();
              const layoutWidth = layoutRect.width || 600;
              
              const leftColumn = layoutNode.child(columnIndex);
              const rightColumn = layoutNode.child(columnIndex + 1);
              
              // Calculate current widths as percentages
              const totalColumns = layoutNode.childCount;
              const defaultWidth = 100 / totalColumns;
              
              const leftWidth = leftColumn.attrs.width 
                ? parseFloat(leftColumn.attrs.width) 
                : defaultWidth;
              const rightWidth = rightColumn.attrs.width 
                ? parseFloat(rightColumn.attrs.width) 
                : defaultWidth;
              
              // Set dragging state
              const tr = view.state.tr.setMeta(columnResizePluginKey, {
                dragging: true,
                startX: event.clientX,
                columnPos,
                nextColumnPos,
                startWidths: { left: leftWidth, right: rightWidth },
                layoutWidth,
              });
              view.dispatch(tr);
              
              document.body.style.cursor = 'col-resize';
              document.body.classList.add('column-resizing');
              
              return true;
            },
            
            mousemove(view, event) {
              const pluginState = columnResizePluginKey.getState(view.state) as ResizeState | undefined;
              
              if (!pluginState?.dragging) {
                return false;
              }
              
              event.preventDefault();
              
              const { startX, columnPos, nextColumnPos, startWidths, layoutWidth } = pluginState;
              
              // Calculate the delta as a percentage of layout width
              const deltaX = event.clientX - startX;
              const deltaPercent = (deltaX / layoutWidth) * 100;
              
              // Calculate new widths
              let newLeftWidth = startWidths.left + deltaPercent;
              let newRightWidth = startWidths.right - deltaPercent;
              
              // Enforce minimum width of 15%
              const minWidth = 15;
              if (newLeftWidth < minWidth) {
                newLeftWidth = minWidth;
                newRightWidth = startWidths.left + startWidths.right - minWidth;
              }
              if (newRightWidth < minWidth) {
                newRightWidth = minWidth;
                newLeftWidth = startWidths.left + startWidths.right - minWidth;
              }
              
              // Apply the new widths
              const tr = view.state.tr;
              
              tr.setNodeMarkup(columnPos, undefined, {
                width: `${newLeftWidth.toFixed(1)}%`,
              });
              
              tr.setNodeMarkup(nextColumnPos, undefined, {
                width: `${newRightWidth.toFixed(1)}%`,
              });
              
              view.dispatch(tr);
              
              return true;
            },
            
            mouseup(view, _event) {
              const pluginState = columnResizePluginKey.getState(view.state) as ResizeState | undefined;
              
              if (!pluginState?.dragging) {
                return false;
              }
              
              const tr = view.state.tr.setMeta(columnResizePluginKey, {
                dragging: false,
              });
              view.dispatch(tr);
              
              document.body.style.cursor = '';
              document.body.classList.remove('column-resizing');
              
              // Trigger update event
              editor.commands.focus();
              
              return true;
            },
          },
        },
      }),
    ];
  },
});
