/**
 * Bubble.io Element Update Script
 * 
 * This runs whenever any of the element's properties change.
 * This is where we get the actual property values from Bubble.
 */

function(instance, properties, context) {
    // Debug: Log properties received from Bubble
    console.log('🫧 Bubble update - properties:', JSON.stringify(properties, null, 2));
    
    // Map Bubble properties to our internal format with defaults
    const allProperties = {
        // Core properties
        initial_content: properties.initial_content || '',
        placeholder: properties.placeholder || 'Start writing...',
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
        console.log('🫧 Editor not initialized yet, storing properties');
        return;
    }
    
    const callback = instance.data._propertyChangeCallback;
    
    if (!callback) {
        console.log('🫧 No property change callback registered');
        return;
    }
    
    // Always send all theme-relevant properties to ensure they're applied
    // Bubble sends all properties on each update, so we pass them all through
    const changes = {
        editable: allProperties.editable,
        toolbar_visible: allProperties.toolbar_visible,
        min_height: allProperties.min_height,
        theme: allProperties.theme,
        accent_color: allProperties.accent_color,
        background_color: allProperties.background_color,
        text_color: allProperties.text_color,
    };
    
    console.log('🫧 Sending to editor:', JSON.stringify(changes, null, 2));
    
    // Notify the element of property changes
    callback(changes);
}
