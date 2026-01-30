/**
 * Bubble.io Element Initialize Script
 * 
 * This runs when the element is first rendered on the page.
 * Properties are NOT available here - they come via update.js
 */

function(instance, context) {
    const container = instance.canvas[0];
    
    // Create editor wrapper
    const editorMount = document.createElement('div');
    editorMount.className = 'bubble-tiptap-editor';
    editorMount.style.width = '100%';
    editorMount.style.height = '100%';
    container.appendChild(editorMount);
    
    // Check if bundle is loaded
    const BubbleTipTap = window.BubbleTipTap;
    
    if (!BubbleTipTap) {
        console.error('TipTap bundle not loaded');
        return;
    }
    
    // Store current properties (will be populated by update.js)
    instance.data._currentProperties = {};
    
    // Create a bridge to Bubble's API
    const bubbleApi = {
        getProperties: () => instance.data._currentProperties,
        getProperty: (key) => instance.data._currentProperties[key],
        setProperty: () => {},
        setProperties: () => {},
        onPropertyChange: (callback) => {
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
        runAction: () => {},
        onEvent: () => () => {},
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
    
    // Store references for update.js and actions
    instance.data._bubbleElement = bubbleElement;
    instance.data._bubbleApi = bubbleApi;
    instance.data._initialized = true;
    
    console.log('🫧 Editor initialized, checking for pending properties');
    
    // If update.js already ran with properties, apply them now
    if (instance.data._currentProperties && Object.keys(instance.data._currentProperties).length > 0) {
        console.log('🫧 Applying pending properties:', JSON.stringify(instance.data._currentProperties, null, 2));
        
        const callback = instance.data._propertyChangeCallback;
        if (callback) {
            const props = instance.data._currentProperties;
            callback({
                editable: props.editable,
                toolbar_visible: props.toolbar_visible,
                min_height: props.min_height,
                theme: props.theme,
                accent_color: props.accent_color,
                background_color: props.background_color,
                text_color: props.text_color,
            });
        }
    }
}
