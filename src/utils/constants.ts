/**
 * Shared constants for the editor
 * 
 * Centralizes magic numbers and strings used across the codebase.
 */

// === Default Values ===
export const DEFAULT_BORDER_WIDTH = 2;
export const MIN_COLUMN_WIDTH_PERCENT = 15;
export const DEFAULT_COLUMNS = 2;

// === Timing (ms) ===
export const DRAG_DROP_INIT_DELAY = 100;
export const DEBOUNCE_CONTENT_CHANGE = 300;

// === Brand Colors ===
export const BRAND_COLORS = {
  primary: '#007f00',
  light1: '#8edf00',
  light2: '#ccff00',
  dark1: '#004f00',
} as const;

// === Default Text Color ===
export const DEFAULT_TEXT_COLOR = '#121000';
export const DEFAULT_BORDER_COLOR = '#007f00';

// === Container Types ===
export const CONTAINER_NODE_TYPES = ['columnLayout', 'column', 'divBlock'] as const;
export type ContainerNodeType = typeof CONTAINER_NODE_TYPES[number];

// === Block Style Types ===
export const BLOCK_STYLE_TYPES = [
  'paragraph',
  'heading',
  'divBlock',
  'blockquote',
  'columnLayout',
  'column',
] as const;

// === Input Limits ===
export const MAX_BORDER_WIDTH = 50;
export const MAX_BORDER_RADIUS = 50;
export const MAX_PADDING = 100;
