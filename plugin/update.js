/**
 * Bubble.io Element Update Script
 * 
 * This runs whenever any of the element's properties change.
 * This is where we get the actual property values from Bubble.
 */

function(instance, properties, context) {
    // Bubble may send placeholder as .placeholder; ensure we have a string
    var placeholderValue = (properties.placeholder != null && properties.placeholder !== '')
        ? String(properties.placeholder)
        : 'Start writing...';

    // Map Bubble properties to our internal format with defaults
    const allProperties = {
        // Core properties
        initial_content: properties.initial_content || '',
        placeholder: placeholderValue,
        editable: properties.editable !== false,
        toolbar_visible: properties.toolbar_visible !== false,
        min_height: properties.min_height || 200,
        max_height: properties.max_height || 0,
        // Theme properties
        theme: properties.theme || 'light',
        accent_color: properties.accent_color || '#513EDF',
        background_color: properties.background_color || '#ffffff',
        text_color: properties.text_color || '#121000',
    };
    
    // Store current properties for getProperties() calls
    instance.data._currentProperties = allProperties;
    
    // Wait for initialization before sending changes
    if (!instance.data._initialized) {
        return;
    }

    const callback = instance.data._propertyChangeCallback;
    if (!callback) {
        return;
    }
    
    // Always send all theme-relevant and content-relevant properties
    const changes = {
        placeholder: allProperties.placeholder,
        editable: allProperties.editable,
        toolbar_visible: allProperties.toolbar_visible,
        min_height: allProperties.min_height,
        theme: allProperties.theme,
        accent_color: allProperties.accent_color,
        background_color: allProperties.background_color,
        text_color: allProperties.text_color,
    };

    // Notify the element of property changes
    callback(changes);
}
