/**
 * Theme Applier Utility
 * 
 * Applies theme properties as CSS custom properties to the editor element.
 * Supports light/dark/auto themes and custom brand colors.
 * 
 * Design tokens based on BP brand Figma export.
 */

export interface ThemeProperties {
  theme: 'light' | 'dark' | 'auto';
  // Brand colors (configurable per-app)
  brand_primary: string;
  brand_light_1: string;
  brand_light_2: string;
  brand_dark_1: string;
  // Legacy accent (maps to brand_primary)
  accent_color: string;
  // Core UI colors
  background_color: string;
  toolbar_background: string;
  text_color: string;
  text_muted_color: string;
  border_color: string;
  icon_color: string;
  icon_active_color: string;
  // Typography
  font_family: string;
  font_size: number;
  // Spacing
  border_radius: number;
  // Color palette (optional custom colors)
  color_palette?: string[];
}

// BP Brand colors (from Figma tokens)
export const bpBrandColors = {
  primary: '#007f00',      // Main brand green
  light1: '#8edf00',       // Lime green
  light2: '#ccff00',       // Yellow-green  
  dark1: '#004f00',        // Dark green
  // Neutrals
  white: '#ffffff',
  warmGrey1: '#f5f5f2',    // Lightest
  warmGrey2: '#e1e3d6',    // Button backgrounds
  warmGrey3: '#c9cbbe',    // Borders
  warmGrey5: '#494736',    // Icons/labels
  warmGrey6: '#121000',    // Body text
};

// Default color palette (from Figma design)
export const defaultColorPalette = [
  // Row 1: Dark/base colors
  '#121000', '#004f00', '#007f00', '#8edf00', '#ccff00', '#ffd700', 
  '#ff9500', '#800080', '#0066cc', '#ff6b9d', '#ff4444', '#88cc44',
  // Row 2: Medium colors
  '#494736', '#006600', '#33cc33', '#b3ff00', '#e6ff66', '#ffe066',
  '#ffb366', '#cc66cc', '#66aaff', '#ffb3cc', '#ff8888', '#c4e896',
  // Row 3: Light/muted colors  
  '#7a7a6c', '#339933', '#66dd66', '#d4ff66', '#ffff99', '#996633',
  '#cc6600', '#663366', '#003366', '#999999', '#cccccc', '#e1e3d6',
];

// Light theme preset (BP brand style)
export const lightThemePreset: Partial<ThemeProperties> = {
  brand_primary: bpBrandColors.primary,
  brand_light_1: bpBrandColors.light1,
  brand_light_2: bpBrandColors.light2,
  brand_dark_1: bpBrandColors.dark1,
  background_color: bpBrandColors.white,
  toolbar_background: bpBrandColors.warmGrey1,
  text_color: bpBrandColors.warmGrey6,
  text_muted_color: bpBrandColors.warmGrey5,
  border_color: bpBrandColors.warmGrey3,
  icon_color: bpBrandColors.warmGrey5,
  icon_active_color: bpBrandColors.white,
};

// Dark theme preset
export const darkThemePreset: Partial<ThemeProperties> = {
  brand_primary: bpBrandColors.light1,  // Use lighter green for dark mode
  brand_light_1: bpBrandColors.light2,
  brand_light_2: '#e0ff66',
  brand_dark_1: bpBrandColors.primary,
  background_color: '#1a1d27',
  toolbar_background: '#1e2230',
  text_color: '#e4e6ed',
  text_muted_color: '#8b8fa3',
  border_color: '#2e3345',
  icon_color: '#8b8fa3',
  icon_active_color: bpBrandColors.warmGrey6,
};

/**
 * Parse a color string (hex, rgb, or rgba) and return RGB components
 */
function parseColor(color: string): { r: number; g: number; b: number } | null {
  if (!color) return null;
  
  // Handle hex format: #RGB, #RRGGBB
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    if (hex.length === 3) {
      // Short hex: #RGB -> #RRGGBB
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    } else if (hex.length >= 6) {
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
      };
    }
  }
  
  // Handle rgb/rgba format: rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }
  
  return null;
}

/**
 * Detect system color scheme preference
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

/**
 * Get the effective theme based on theme setting
 */
export function getEffectiveTheme(theme: 'light' | 'dark' | 'auto'): 'light' | 'dark' {
  if (theme === 'auto') {
    return getSystemTheme();
  }
  return theme;
}

/**
 * Get theme preset colors based on theme name
 */
export function getThemePreset(theme: 'light' | 'dark'): Partial<ThemeProperties> {
  return theme === 'light' ? lightThemePreset : darkThemePreset;
}

/**
 * Generate derived colors from the accent color
 */
export function getDerivedColors(accentColor: string): {
  accentHover: string;
  accentMuted: string;
  selection: string;
} {
  // Parse the color (supports hex, rgb, rgba)
  const parsed = parseColor(accentColor);
  
  // Fallback to a default purple if parsing fails
  const r = parsed?.r ?? 81;
  const g = parsed?.g ?? 62;
  const b = parsed?.b ?? 223;
  
  // Lighter version for hover
  const lighten = (val: number) => Math.min(255, val + 30);
  const accentHover = `#${lighten(r).toString(16).padStart(2, '0')}${lighten(g).toString(16).padStart(2, '0')}${lighten(b).toString(16).padStart(2, '0')}`;
  
  // Muted version
  const accentMuted = `rgba(${r}, ${g}, ${b}, 0.4)`;
  
  // Selection background
  const selection = `rgba(${r}, ${g}, ${b}, 0.25)`;
  
  return { accentHover, accentMuted, selection };
}

/**
 * Apply theme properties to an element as CSS custom properties
 */
export function applyTheme(element: HTMLElement, properties: Partial<ThemeProperties>): void {
  const effectiveTheme = getEffectiveTheme(properties.theme || 'light');
  const preset = getThemePreset(effectiveTheme);
  
  // Debug: Log incoming properties
  console.log('🎨 applyTheme - input properties:', {
    theme: properties.theme,
    accent_color: properties.accent_color,
    background_color: properties.background_color,
    text_color: properties.text_color,
  });
  console.log('🎨 applyTheme - preset for', effectiveTheme, ':', {
    background_color: preset.background_color,
    text_color: preset.text_color,
  });
  
  // Merge preset with custom properties (custom overrides preset)
  const theme: ThemeProperties = {
    theme: properties.theme || 'light',
    // Brand colors - use provided or preset or BP defaults
    brand_primary: properties.brand_primary || preset.brand_primary || bpBrandColors.primary,
    brand_light_1: properties.brand_light_1 || preset.brand_light_1 || bpBrandColors.light1,
    brand_light_2: properties.brand_light_2 || preset.brand_light_2 || bpBrandColors.light2,
    brand_dark_1: properties.brand_dark_1 || preset.brand_dark_1 || bpBrandColors.dark1,
    // Legacy accent maps to brand_primary
    accent_color: properties.accent_color || properties.brand_primary || preset.brand_primary || bpBrandColors.primary,
    // Core colors
    background_color: properties.background_color || preset.background_color || bpBrandColors.white,
    toolbar_background: properties.toolbar_background || preset.toolbar_background || bpBrandColors.warmGrey1,
    text_color: properties.text_color || preset.text_color || bpBrandColors.warmGrey6,
    text_muted_color: properties.text_muted_color || preset.text_muted_color || bpBrandColors.warmGrey5,
    border_color: properties.border_color || preset.border_color || bpBrandColors.warmGrey3,
    icon_color: properties.icon_color || preset.icon_color || bpBrandColors.warmGrey5,
    icon_active_color: properties.icon_active_color || preset.icon_active_color || bpBrandColors.white,
    // Typography
    font_family: properties.font_family || "'bp Sans', 'DM Sans', system-ui, -apple-system, sans-serif",
    font_size: properties.font_size || 16,
    border_radius: properties.border_radius || 8,
    // Color palette
    color_palette: properties.color_palette,
  };
  
  console.log('🎨 applyTheme - merged theme:', {
    background_color: theme.background_color,
    text_color: theme.text_color,
    accent_color: theme.accent_color,
  });
  
  // Get derived colors from brand primary
  const derived = getDerivedColors(theme.brand_primary);
  
  // Apply CSS custom properties
  const style = element.style;
  
  // Brand colors
  style.setProperty('--brand-primary', theme.brand_primary);
  style.setProperty('--brand-light-1', theme.brand_light_1);
  style.setProperty('--brand-light-2', theme.brand_light_2);
  style.setProperty('--brand-dark-1', theme.brand_dark_1);
  
  // Core accent (for backwards compatibility)
  style.setProperty('--editor-accent', theme.brand_primary);
  style.setProperty('--editor-accent-hover', derived.accentHover);
  style.setProperty('--editor-accent-muted', derived.accentMuted);
  style.setProperty('--editor-selection', derived.selection);
  
  // Background colors
  style.setProperty('--editor-bg', theme.background_color);
  style.setProperty('--toolbar-bg', theme.toolbar_background);
  style.setProperty('--sidebar-bg', theme.toolbar_background);
  
  // Derive elevated background (slightly lighter/darker than bg)
  const bgElevated = adjustBrightness(theme.background_color, effectiveTheme === 'dark' ? 15 : -3);
  style.setProperty('--editor-bg-elevated', bgElevated);
  
  // Text colors
  style.setProperty('--editor-text', theme.text_color);
  style.setProperty('--editor-text-muted', theme.text_muted_color);
  
  // Icon colors
  style.setProperty('--toolbar-icon-color', theme.icon_color);
  style.setProperty('--toolbar-icon-active', theme.icon_active_color);
  
  // Border colors
  style.setProperty('--editor-border', theme.border_color);
  const borderSubtle = adjustBrightness(theme.border_color, effectiveTheme === 'dark' ? -10 : 5);
  style.setProperty('--editor-border-subtle', borderSubtle);
  
  // Control buttons (for sidebar)
  const controlBtnBg = effectiveTheme === 'dark' 
    ? adjustBrightness(theme.toolbar_background, 15) 
    : bpBrandColors.warmGrey2;
  style.setProperty('--control-btn-bg', controlBtnBg);
  style.setProperty('--control-btn-bg-hover', adjustBrightness(controlBtnBg, effectiveTheme === 'dark' ? 15 : -10));
  style.setProperty('--control-btn-bg-active', theme.brand_primary);
  style.setProperty('--control-btn-text', theme.text_muted_color);
  style.setProperty('--control-btn-text-hover', theme.text_color);
  style.setProperty('--control-btn-text-active', theme.icon_active_color);
  
  // Toolbar button states
  // Hover: light green background with brand green icons
  style.setProperty('--toolbar-btn-hover', theme.brand_light_1);
  style.setProperty('--toolbar-btn-hover-icon', theme.brand_primary);
  // Active: dark green background with bright lime icons
  style.setProperty('--toolbar-btn-active', theme.brand_dark_1);
  style.setProperty('--toolbar-btn-active-icon', theme.brand_light_2);
  style.setProperty('--toolbar-separator', theme.border_color);
  
  // Code block colors (derive from background)
  const codeBg = adjustBrightness(theme.background_color, effectiveTheme === 'dark' ? -10 : -5);
  style.setProperty('--code-bg', codeBg);
  style.setProperty('--code-border', borderSubtle);
  
  // Input fields
  style.setProperty('--input-bg', effectiveTheme === 'dark' ? adjustBrightness(theme.background_color, 10) : bpBrandColors.white);
  style.setProperty('--input-border', theme.border_color);
  style.setProperty('--input-border-focus', theme.brand_primary);
  style.setProperty('--input-text', theme.text_color);
  
  // Typography
  style.setProperty('--font-sans', theme.font_family);
  style.setProperty('--font-family-primary', theme.font_family);
  style.setProperty('--editor-font-size', `${theme.font_size}px`);
  
  // Border radius
  style.setProperty('--radius-xs', '2px');
  style.setProperty('--radius-sm', '4px');
  style.setProperty('--radius-md', '6px');
  style.setProperty('--radius-lg', `${theme.border_radius}px`);
  style.setProperty('--radius-xl', `${theme.border_radius + 2}px`);
  style.setProperty('--radius-input', '15px');
  
  // Also set on parent container if it exists (for demo page)
  const container = element.parentElement;
  if (container) {
    container.style.setProperty('--editor-container-radius', `${theme.border_radius}px`);
  }
  
  // Set data attribute for potential CSS selectors
  element.dataset.theme = effectiveTheme;
  
  // Debug: Verify CSS custom properties were set
  console.log('🎨 CSS vars set on element:', {
    '--editor-bg': element.style.getPropertyValue('--editor-bg'),
    '--editor-text': element.style.getPropertyValue('--editor-text'),
    '--editor-accent': element.style.getPropertyValue('--editor-accent'),
    'element.className': element.className,
  });
  
  // Also check computed style
  const computed = window.getComputedStyle(element);
  console.log('🎨 Computed styles:', {
    background: computed.background.substring(0, 50),
    '--editor-bg (computed)': computed.getPropertyValue('--editor-bg'),
  });
}

/**
 * Adjust brightness of any color format (hex, rgb, rgba)
 */
function adjustBrightness(color: string, amount: number): string {
  const parsed = parseColor(color);
  if (!parsed) return color; // Return as-is if can't parse
  
  const r = Math.max(0, Math.min(255, parsed.r + amount));
  const g = Math.max(0, Math.min(255, parsed.g + amount));
  const b = Math.max(0, Math.min(255, parsed.b + amount));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Listen for system theme changes (for auto mode)
 */
export function watchSystemTheme(callback: (theme: 'light' | 'dark') => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };
  
  mediaQuery.addEventListener('change', handler);
  
  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}
