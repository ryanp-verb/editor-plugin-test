/**
 * Bubble.io Element Update Script
 * 
 * This runs whenever any of the element's properties change.
 */

function(instance, properties, context) {
    const bubbleElement = instance.data._bubbleElement;
    const callback = instance.data._propertyChangeCallback;
    
    if (!bubbleElement) {
        return;
    }
    
    // Build changes object based on what properties changed
    const changes = {};
    
    // Core properties
    if (properties.editable !== undefined) {
        changes.editable = properties.editable;
    }
    
    if (properties.toolbar_visible !== undefined) {
        changes.toolbar_visible = properties.toolbar_visible;
    }
    
    if (properties.min_height !== undefined) {
        changes.min_height = properties.min_height;
    }
    
    if (properties.max_height !== undefined) {
        changes.max_height = properties.max_height;
    }
    
    // Theme properties
    if (properties.theme !== undefined) {
        changes.theme = properties.theme;
    }
    
    if (properties.accent_color !== undefined) {
        changes.accent_color = properties.accent_color;
    }
    
    if (properties.background_color !== undefined) {
        changes.background_color = properties.background_color;
    }
    
    if (properties.text_color !== undefined) {
        changes.text_color = properties.text_color;
    }
    
    // Additional theme customization (optional)
    if (properties.toolbar_background !== undefined) {
        changes.toolbar_background = properties.toolbar_background;
    }
    
    if (properties.text_muted_color !== undefined) {
        changes.text_muted_color = properties.text_muted_color;
    }
    
    if (properties.border_color !== undefined) {
        changes.border_color = properties.border_color;
    }
    
    if (properties.icon_color !== undefined) {
        changes.icon_color = properties.icon_color;
    }
    
    if (properties.icon_active_color !== undefined) {
        changes.icon_active_color = properties.icon_active_color;
    }
    
    if (properties.font_family !== undefined) {
        changes.font_family = properties.font_family;
    }
    
    if (properties.font_size !== undefined) {
        changes.font_size = properties.font_size;
    }
    
    if (properties.border_radius !== undefined) {
        changes.border_radius = properties.border_radius;
    }
    
    // Notify the element of property changes
    if (callback && Object.keys(changes).length > 0) {
        callback(changes);
    }
}
