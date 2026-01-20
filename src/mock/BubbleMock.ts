/**
 * BubbleMock - Simulates Bubble.io's plugin API for local development
 * 
 * In Bubble, plugins interact through:
 * - properties: Input values set by the user in the Bubble editor
 * - states: Output values the plugin exposes to Bubble
 * - events: Triggers that fire Bubble workflows
 * - actions: Functions Bubble can call on the plugin
 */

export interface BubbleProperties {
  initial_content: string;
  placeholder: string;
  editable: boolean;
  toolbar_visible: boolean;
  min_height: number;
  max_height: number;
  // Theming
  theme: 'light' | 'dark' | 'auto';
  // Brand colors (configurable per-app)
  brand_primary: string;
  brand_light_1: string;
  brand_light_2: string;
  brand_dark_1: string;
  // Legacy accent (maps to brand_primary)
  accent_color: string;
  background_color: string;
  toolbar_background: string;
  text_color: string;
  text_muted_color: string;
  border_color: string;
  icon_color: string;
  icon_active_color: string;
  font_family: string;
  font_size: number;
  border_radius: number;
  // Color palette (optional custom colors for pickers)
  color_palette?: string[];
}

export interface BubbleStates {
  html_content: string;
  is_empty: boolean;
  word_count: number;
  // Optional states (uncomment and add to Bubble if needed):
  // json_content: string;
  // character_count: number;
}

export type BubbleEventName = 
  | 'content_changed'
  | 'editor_focused'
  | 'editor_blurred'
  | 'image_uploaded';

export type BubbleActionName = 
  | 'set_content'
  | 'clear_content'
  | 'focus'
  | 'insert_image';

export interface BubbleAction {
  name: BubbleActionName;
  params?: Record<string, unknown>;
}

type PropertyChangeCallback = (properties: Partial<BubbleProperties>) => void;
type ActionCallback = (action: BubbleAction) => void;

export interface EventLogEntry {
  timestamp: Date;
  name: BubbleEventName;
  data?: Record<string, unknown>;
}

export class BubbleMock {
  private properties: BubbleProperties;
  private states: BubbleStates;
  private eventLog: EventLogEntry[] = [];
  private propertyChangeCallbacks: PropertyChangeCallback[] = [];
  private actionCallbacks: ActionCallback[] = [];
  private eventListeners: Map<string, ((entry: EventLogEntry) => void)[]> = new Map();

  constructor() {
    // Initialize with default property values (BP Brand light theme)
    this.properties = {
      initial_content: '',
      placeholder: 'Start writing something amazing...',
      editable: true,
      toolbar_visible: true,
      min_height: 200,
      max_height: 800,
      // Theming defaults (BP Brand light theme)
      theme: 'light',
      // Brand colors
      brand_primary: '#007f00',
      brand_light_1: '#8edf00',
      brand_light_2: '#ccff00',
      brand_dark_1: '#004f00',
      // Legacy accent (maps to brand_primary)
      accent_color: '#007f00',
      background_color: '#ffffff',
      toolbar_background: '#f5f5f2',
      text_color: '#121000',
      text_muted_color: '#494736',
      border_color: '#c9cbbe',
      icon_color: '#494736',
      icon_active_color: '#ffffff',
      font_family: "'bp Sans', 'DM Sans', system-ui, -apple-system, sans-serif",
      font_size: 16,
      border_radius: 8,
    };

    // Initialize states (must match Bubble plugin states)
    this.states = {
      html_content: '',
      is_empty: true,
      word_count: 0,
    };
  }

  // --- Property Management ---

  getProperties(): BubbleProperties {
    return { ...this.properties };
  }

  getProperty<K extends keyof BubbleProperties>(key: K): BubbleProperties[K] {
    return this.properties[key];
  }

  setProperty<K extends keyof BubbleProperties>(key: K, value: BubbleProperties[K]): void {
    const oldValue = this.properties[key];
    if (oldValue !== value) {
      this.properties[key] = value;
      this.notifyPropertyChange({ [key]: value } as Partial<BubbleProperties>);
    }
  }

  setProperties(updates: Partial<BubbleProperties>): void {
    let hasChanges = false;
    const changes: Partial<BubbleProperties> = {};

    for (const [key, value] of Object.entries(updates)) {
      const k = key as keyof BubbleProperties;
      if (this.properties[k] !== value) {
        // Use type assertion through unknown for dynamic property assignment
        (this.properties as unknown as Record<string, unknown>)[k] = value;
        (changes as unknown as Record<string, unknown>)[k] = value;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.notifyPropertyChange(changes);
    }
  }

  onPropertyChange(callback: PropertyChangeCallback): () => void {
    this.propertyChangeCallbacks.push(callback);
    return () => {
      const index = this.propertyChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.propertyChangeCallbacks.splice(index, 1);
      }
    };
  }

  private notifyPropertyChange(changes: Partial<BubbleProperties>): void {
    this.propertyChangeCallbacks.forEach(cb => cb(changes));
  }

  // --- State Management ---

  getStates(): BubbleStates {
    return { ...this.states };
  }

  getState<K extends keyof BubbleStates>(key: K): BubbleStates[K] {
    return this.states[key];
  }

  publishState<K extends keyof BubbleStates>(key: K, value: BubbleStates[K]): void {
    this.states[key] = value;
  }

  publishStates(updates: Partial<BubbleStates>): void {
    Object.assign(this.states, updates);
  }

  // --- Event Triggering ---

  triggerEvent(name: BubbleEventName, data?: Record<string, unknown>): void {
    const entry: EventLogEntry = {
      timestamp: new Date(),
      name,
      data,
    };
    
    this.eventLog.push(entry);
    
    // Keep only last 100 events
    if (this.eventLog.length > 100) {
      this.eventLog.shift();
    }

    // Notify listeners
    const listeners = this.eventListeners.get('*') || [];
    listeners.forEach(cb => cb(entry));

    const specificListeners = this.eventListeners.get(name) || [];
    specificListeners.forEach(cb => cb(entry));
  }

  onEvent(name: BubbleEventName | '*', callback: (entry: EventLogEntry) => void): () => void {
    const listeners = this.eventListeners.get(name) || [];
    listeners.push(callback);
    this.eventListeners.set(name, listeners);

    return () => {
      const currentListeners = this.eventListeners.get(name) || [];
      const index = currentListeners.indexOf(callback);
      if (index > -1) {
        currentListeners.splice(index, 1);
      }
    };
  }

  getEventLog(): EventLogEntry[] {
    return [...this.eventLog];
  }

  clearEventLog(): void {
    this.eventLog = [];
  }

  // --- Action Handling ---

  runAction(name: BubbleActionName, params?: Record<string, unknown>): void {
    const action: BubbleAction = { name, params };
    this.actionCallbacks.forEach(cb => cb(action));
  }

  onAction(callback: ActionCallback): () => void {
    this.actionCallbacks.push(callback);
    return () => {
      const index = this.actionCallbacks.indexOf(callback);
      if (index > -1) {
        this.actionCallbacks.splice(index, 1);
      }
    };
  }

  // --- Debug/Development Helpers ---

  logState(): void {
    console.group('🫧 Bubble Mock State');
    console.log('Properties:', this.properties);
    console.log('States:', this.states);
    console.log('Event Log:', this.eventLog);
    console.groupEnd();
  }
}

// Singleton instance for the demo
export const bubbleMock = new BubbleMock();
