/**
 * BlockStyle Extension
 * 
 * Extends block nodes (paragraph, div, etc.) with styling attributes:
 * - backgroundColor
 * - borderWidth (top, right, bottom, left)
 * - borderColor
 * - borderRadius (topLeft, topRight, bottomRight, bottomLeft)
 * - padding (top, right, bottom, left)
 */

import { Extension } from '@tiptap/core';
import { NodeSelection, Plugin, PluginKey } from '@tiptap/pm/state';

export interface BlockStyleOptions {
  types: string[];
  containerTypes: string[];
}

// Plugin key for block selection
const blockSelectionPluginKey = new PluginKey('blockSelection');

export interface BlockStyleAttributes {
  backgroundColor?: string;
  borderTopWidth?: number;
  borderRightWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;
  borderColor?: string;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomRightRadius?: number;
  borderBottomLeftRadius?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockStyle: {
      /**
       * Set block style attributes
       */
      setBlockStyle: (attributes: BlockStyleAttributes) => ReturnType;
      /**
       * Unset block style attributes
       */
      unsetBlockStyle: () => ReturnType;
      /**
       * Set background color
       */
      setBlockBackgroundColor: (color: string) => ReturnType;
      /**
       * Set border
       */
      setBlockBorder: (width: number, color?: string) => ReturnType;
      /**
       * Set border radius
       */
      setBlockBorderRadius: (radius: number) => ReturnType;
      /**
       * Set padding
       */
      setBlockPadding: (top: number, right?: number, bottom?: number, left?: number) => ReturnType;
      /**
       * Set style attributes on the nearest parent container (columnLayout, column, or divBlock)
       */
      setParentContainerStyle: (attributes: BlockStyleAttributes) => ReturnType;
      /**
       * Select the nearest parent container block
       */
      selectParentContainer: () => ReturnType;
    };
  }
}

function parseStyleValue(value: string | undefined, _unit: string = 'px'): number | undefined {
  if (!value) return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
}

function buildBorderStyle(attrs: BlockStyleAttributes): string {
  const parts: string[] = [];
  
  // Background
  if (attrs.backgroundColor && attrs.backgroundColor !== 'transparent') {
    parts.push(`background-color: ${attrs.backgroundColor}`);
  }
  
  // Border widths
  const bt = attrs.borderTopWidth ?? 0;
  const br = attrs.borderRightWidth ?? 0;
  const bb = attrs.borderBottomWidth ?? 0;
  const bl = attrs.borderLeftWidth ?? 0;
  
  if (bt || br || bb || bl) {
    parts.push(`border-style: solid`);
    parts.push(`border-width: ${bt}px ${br}px ${bb}px ${bl}px`);
    if (attrs.borderColor) {
      parts.push(`border-color: ${attrs.borderColor}`);
    }
  }
  
  // Border radius
  const rtl = attrs.borderTopLeftRadius ?? 0;
  const rtr = attrs.borderTopRightRadius ?? 0;
  const rbr = attrs.borderBottomRightRadius ?? 0;
  const rbl = attrs.borderBottomLeftRadius ?? 0;
  
  if (rtl || rtr || rbr || rbl) {
    parts.push(`border-radius: ${rtl}px ${rtr}px ${rbr}px ${rbl}px`);
  }
  
  // Padding
  const pt = attrs.paddingTop ?? 0;
  const pr = attrs.paddingRight ?? 0;
  const pb = attrs.paddingBottom ?? 0;
  const pl = attrs.paddingLeft ?? 0;
  
  if (pt || pr || pb || pl) {
    parts.push(`padding: ${pt}px ${pr}px ${pb}px ${pl}px`);
  }
  
  return parts.join('; ');
}

export const BlockStyle = Extension.create<BlockStyleOptions>({
  name: 'blockStyle',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'divBlock', 'blockquote', 'columnLayout', 'column'],
      containerTypes: ['columnLayout', 'column', 'divBlock'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          backgroundColor: {
            default: null,
            parseHTML: element => element.style.backgroundColor || null,
            renderHTML: attributes => {
              if (!attributes.backgroundColor) return {};
              return {};  // Will be handled by combined style
            },
          },
          borderTopWidth: {
            default: null,
            parseHTML: element => parseStyleValue(element.style.borderTopWidth),
            renderHTML: () => ({}),
          },
          borderRightWidth: {
            default: null,
            parseHTML: element => parseStyleValue(element.style.borderRightWidth),
            renderHTML: () => ({}),
          },
          borderBottomWidth: {
            default: null,
            parseHTML: element => parseStyleValue(element.style.borderBottomWidth),
            renderHTML: () => ({}),
          },
          borderLeftWidth: {
            default: null,
            parseHTML: element => parseStyleValue(element.style.borderLeftWidth),
            renderHTML: () => ({}),
          },
          borderColor: {
            default: null,
            parseHTML: element => element.style.borderColor || null,
            renderHTML: () => ({}),
          },
          borderTopLeftRadius: {
            default: null,
            parseHTML: element => parseStyleValue(element.style.borderTopLeftRadius),
            renderHTML: () => ({}),
          },
          borderTopRightRadius: {
            default: null,
            parseHTML: element => parseStyleValue(element.style.borderTopRightRadius),
            renderHTML: () => ({}),
          },
          borderBottomRightRadius: {
            default: null,
            parseHTML: element => parseStyleValue(element.style.borderBottomRightRadius),
            renderHTML: () => ({}),
          },
          borderBottomLeftRadius: {
            default: null,
            parseHTML: element => parseStyleValue(element.style.borderBottomLeftRadius),
            renderHTML: () => ({}),
          },
          paddingTop: {
            default: null,
            parseHTML: element => parseStyleValue(element.style.paddingTop),
            renderHTML: () => ({}),
          },
          paddingRight: {
            default: null,
            parseHTML: element => parseStyleValue(element.style.paddingRight),
            renderHTML: () => ({}),
          },
          paddingBottom: {
            default: null,
            parseHTML: element => parseStyleValue(element.style.paddingBottom),
            renderHTML: () => ({}),
          },
          paddingLeft: {
            default: null,
            parseHTML: element => parseStyleValue(element.style.paddingLeft),
            renderHTML: () => ({}),
          },
          // Combined style attribute for rendering
          blockStyleCSS: {
            default: null,
            renderHTML: attributes => {
              const style = buildBorderStyle(attributes);
              if (!style) return {};
              return { style };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setBlockStyle:
        (attributes: BlockStyleAttributes) =>
        ({ commands }) => {
          return this.options.types.every(type =>
            commands.updateAttributes(type, attributes)
          );
        },
      unsetBlockStyle:
        () =>
        ({ commands }) => {
          const resetAttrs: BlockStyleAttributes = {
            backgroundColor: null as unknown as string,
            borderTopWidth: undefined,
            borderRightWidth: undefined,
            borderBottomWidth: undefined,
            borderLeftWidth: undefined,
            borderColor: undefined,
            borderTopLeftRadius: undefined,
            borderTopRightRadius: undefined,
            borderBottomRightRadius: undefined,
            borderBottomLeftRadius: undefined,
            paddingTop: undefined,
            paddingRight: undefined,
            paddingBottom: undefined,
            paddingLeft: undefined,
          };
          return this.options.types.every(type =>
            commands.updateAttributes(type, resetAttrs)
          );
        },
      setBlockBackgroundColor:
        (color: string) =>
        ({ commands }) => {
          return this.options.types.every(type =>
            commands.updateAttributes(type, { backgroundColor: color })
          );
        },
      setBlockBorder:
        (width: number, color?: string) =>
        ({ commands }) => {
          const attrs: Partial<BlockStyleAttributes> = {
            borderTopWidth: width,
            borderRightWidth: width,
            borderBottomWidth: width,
            borderLeftWidth: width,
          };
          if (color) {
            attrs.borderColor = color;
          }
          return this.options.types.every(type =>
            commands.updateAttributes(type, attrs)
          );
        },
      setBlockBorderRadius:
        (radius: number) =>
        ({ commands }) => {
          return this.options.types.every(type =>
            commands.updateAttributes(type, {
              borderTopLeftRadius: radius,
              borderTopRightRadius: radius,
              borderBottomRightRadius: radius,
              borderBottomLeftRadius: radius,
            })
          );
        },
      setBlockPadding:
        (top: number, right?: number, bottom?: number, left?: number) =>
        ({ commands }) => {
          return this.options.types.every(type =>
            commands.updateAttributes(type, {
              paddingTop: top,
              paddingRight: right ?? top,
              paddingBottom: bottom ?? top,
              paddingLeft: left ?? right ?? top,
            })
          );
        },
      setParentContainerStyle:
        (attributes: BlockStyleAttributes) =>
        ({ state, tr, dispatch }) => {
          const { selection } = state;
          const containerTypes = this.options.containerTypes;
          
          let containerPos: number | null = null;
          let containerNode = null;
          let wasNodeSelection = false;
          
          // FIRST: Check if we have an explicitly selected container node (NodeSelection)
          // This takes priority over traversal
          if (selection instanceof NodeSelection) {
            const selectedNode = selection.node;
            if (containerTypes.includes(selectedNode.type.name)) {
              containerPos = selection.from;
              containerNode = selectedNode;
              wasNodeSelection = true;
              console.log('[BlockStyle] Using NodeSelection:', selectedNode.type.name);
            }
          }
          
          // SECOND: If no container selected, traverse up to find the nearest one
          if (containerPos === null) {
            let depth = selection.$from.depth;
            
            while (depth > 0) {
              const node = selection.$from.node(depth);
              if (containerTypes.includes(node.type.name)) {
                containerPos = selection.$from.before(depth);
                containerNode = node;
                console.log('[BlockStyle] Found via traversal:', node.type.name, 'at depth', depth);
                break;
              }
              depth--;
            }
          }
          
          if (containerPos === null || !containerNode) {
            console.warn('No parent container (columnLayout, column, or divBlock) found');
            return false;
          }
          
          console.log('[BlockStyle] Applying styles to', containerNode.type.name, 'at pos', containerPos);
          console.log('[BlockStyle] New attributes:', attributes);
          console.log('[BlockStyle] Existing attrs:', containerNode.attrs);
          
          // Merge existing attrs with new attributes, preserving non-style attrs like 'width'
          const mergedAttrs = {
            ...containerNode.attrs,
            ...attributes,
          };
          
          console.log('[BlockStyle] Merged attrs:', mergedAttrs);
          
          // Set the node markup with merged attributes
          tr.setNodeMarkup(containerPos, undefined, mergedAttrs);
          
          // IMPORTANT: Restore the NodeSelection after modifying the node
          // This keeps the container selected for further edits
          if (wasNodeSelection || containerPos !== null) {
            try {
              const newSelection = NodeSelection.create(tr.doc, containerPos);
              tr.setSelection(newSelection);
            } catch (e) {
              console.warn('[BlockStyle] Could not restore selection:', e);
            }
          }
          
          if (dispatch) {
            dispatch(tr);
          }
          
          return true;
        },
      selectParentContainer:
        () =>
        ({ state, tr, dispatch }) => {
          const { selection } = state;
          const containerTypes = this.options.containerTypes;
          
          // Traverse up to find nearest container
          let depth = selection.$from.depth;
          
          while (depth > 0) {
            const node = selection.$from.node(depth);
            if (containerTypes.includes(node.type.name)) {
              const pos = selection.$from.before(depth);
              const resolvedPos = state.doc.resolve(pos);
              const nodeSelection = NodeSelection.create(state.doc, resolvedPos.pos);
              
              if (dispatch) {
                tr.setSelection(nodeSelection);
                dispatch(tr);
              }
              return true;
            }
            depth--;
          }
          
          return false;
        },
    };
  },

  addProseMirrorPlugins() {
    const containerTypes = this.options.containerTypes;
    
    return [
      new Plugin({
        key: blockSelectionPluginKey,
        props: {
          handleClickOn(view, _pos, node, nodePos, event, direct) {
            // Only handle direct clicks on container elements
            const target = event.target as HTMLElement;
            
            // Check if click is on a container block itself (not its content)
            const isContainerClick = 
              target.classList.contains('editor-column-layout') ||
              target.classList.contains('editor-column') ||
              target.classList.contains('editor-div-block') ||
              target.classList.contains('column-content');
            
            // Also check for clicks on border/padding area (clicks near edge)
            if (!isContainerClick && direct && containerTypes.includes(node.type.name)) {
              // This is a direct click on a container node
              const nodeSelection = NodeSelection.create(view.state.doc, nodePos);
              view.dispatch(view.state.tr.setSelection(nodeSelection));
              return true;
            }
            
            // For clicks on container elements themselves
            if (isContainerClick) {
              // Find the container node position
              const domNode = target.closest('[data-type="column-layout"], [data-type="column"], [data-type="div-block"]') as HTMLElement;
              if (domNode) {
                const containerPos = view.posAtDOM(domNode, 0) - 1;
                const containerNode = view.state.doc.nodeAt(containerPos);
                
                if (containerNode && containerTypes.includes(containerNode.type.name)) {
                  const nodeSelection = NodeSelection.create(view.state.doc, containerPos);
                  view.dispatch(view.state.tr.setSelection(nodeSelection));
                  return true;
                }
              }
            }
            
            return false;
          },
        },
      }),
    ];
  },
});
