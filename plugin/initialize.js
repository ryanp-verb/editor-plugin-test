/**
 * Bubble.io Element Initialize Script
 * 
 * This runs when the element is first rendered on the page.
 * In production, this would load the bundled TipTap editor.
 */

function(instance, context) {
    // Import the bundled editor (path would be set in Bubble plugin settings)
    // The bundle exposes BubbleTipTap on window when using IIFE format
    
    const container = instance.canvas[0];
    
    // Create editor wrapper
    const editorMount = document.createElement('div');
    editorMount.className = 'bubble-tiptap-editor';
    editorMount.style.width = '100%';
    editorMount.style.height = '100%';
    container.appendChild(editorMount);
    
    // Initialize with Bubble's actual API
    const BubbleTipTap = window.BubbleTipTap;
    
    if (!BubbleTipTap) {
        console.error('TipTap bundle not loaded');
        return;
    }
    
    // Debug: Log all available properties from Bubble
    console.log('🫧 Bubble instance.data:', JSON.stringify(instance.data, null, 2));
    
    // Create a bridge to Bubble's real API
    const bubbleApi = {
        getProperties: () => ({
            // Core properties
            initial_content: instance.data.initial_content || '',
            placeholder: instance.data.placeholder || 'Start writing...',
            editable: instance.data.editable !== false,
            toolbar_visible: instance.data.toolbar_visible !== false,
            min_height: instance.data.min_height || 200,
            max_height: instance.data.max_height || 0,
            // Theme properties
            theme: instance.data.theme || 'light',
            accent_color: instance.data.accent_color || '#513EDF',
            background_color: instance.data.background_color || '#ffffff',
            text_color: instance.data.text_color || '#121000',
            // Additional theme customization (optional)
            toolbar_background: instance.data.toolbar_background,
            text_muted_color: instance.data.text_muted_color,
            border_color: instance.data.border_color,
            icon_color: instance.data.icon_color,
            icon_active_color: instance.data.icon_active_color,
            font_family: instance.data.font_family,
            font_size: instance.data.font_size,
            border_radius: instance.data.border_radius,
        }),
        getProperty: (key) => bubbleApi.getProperties()[key],
        setProperty: () => {}, // Properties are read-only from element
        setProperties: () => {},
        onPropertyChange: (callback) => {
            // Store callback for update.js to call
            instance.data._propertyChangeCallback = callback;
            return () => { instance.data._propertyChangeCallback = null; };
        },
        
        getStates: () => instance.data._states || {},
        getState: (key) => (instance.data._states || {})[key],
        publishState: (key, value) => {
            instance.data._states = instance.data._states || {};
            instance.data._states[key] = value;
            instance.publishState(key, value);
        },
        publishStates: (updates) => {
            instance.data._states = instance.data._states || {};
            Object.entries(updates).forEach(([key, value]) => {
                instance.data._states[key] = value;
                instance.publishState(key, value);
            });
        },
        
        triggerEvent: (name) => {
            instance.triggerEvent(name);
        },
        
        onAction: (callback) => {
            instance.data._actionCallback = callback;
            return () => { instance.data._actionCallback = null; };
        },
        runAction: () => {}, // Not used from initialize
        
        onEvent: () => () => {}, // Not used
        getEventLog: () => [],
        clearEventLog: () => {},
        logState: () => {},
    };
    
    // Create and initialize the editor element
    const bubbleElement = new BubbleTipTap.BubbleElement({
        container: editorMount,
        bubble: bubbleApi,
    });
    
    bubbleElement.initialize();
    
    // Store reference for update.js and actions
    instance.data._bubbleElement = bubbleElement;
    instance.data._bubbleApi = bubbleApi;
}
