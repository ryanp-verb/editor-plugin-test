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
    
    // Notify the element of property changes
    if (callback && Object.keys(changes).length > 0) {
        callback(changes);
    }
}
