/**
 * Bubble.io Element Update Script
 * 
 * This runs whenever any of the element's properties change.
 * This is where we get the actual property values from Bubble.
 */

function(instance, properties, context) {
    // Bubble may send initial_content from a dynamic expression (e.g. Thing's draft field).
    // Accept either properties.initial_content (field name) or properties.AAA (element.json field id).
    var initialContent = properties.initial_content != null ? properties.initial_content : (properties.AAA != null ? properties.AAA : '');
    if (typeof initialContent !== 'string') initialContent = String(initialContent);

    // Bubble may send placeholder as .placeholder; ensure we have a string
    var placeholderValue = (properties.placeholder != null && properties.placeholder !== '')
        ? String(properties.placeholder)
        : 'Start writing...';

    // Map Bubble properties to our internal format with defaults
    // color_palette: list of option set. Option set custom attributes (e.g. Hex code) may not be sent by Bubble.
    // color_names + color_hex_codes: alternative two list-of-strings; when both are set they take precedence.
    const allProperties = {
        // Core properties
        initial_content: initialContent,
        placeholder: placeholderValue,
        editable: properties.editable !== false,
        toolbar_visible: properties.toolbar_visible !== false,
        min_height: properties.min_height || 200,
        max_height: properties.max_height || 0,
        // Theme properties (Bubble may send by field id e.g. AAG for Theme dropdown)
        theme: (properties.theme != null ? properties.theme : (properties.AAG != null ? properties.AAG : 'light')),
        accent_color: properties.accent_color || '#513EDF',
        background_color: properties.background_color || '#ffffff',
        text_color: properties.text_color || '#121000',
        // Color palette: list of option set (Display + Hex code). Pass through so sidebar dropdowns use app branding.
        color_palette: properties.color_palette,
        // Alternative: two list-of-strings (Color names + Color hex codes). Use when option set attributes don't come through.
        color_names: properties.color_names != null ? properties.color_names : properties.AAS,
        color_hex_codes: properties.color_hex_codes != null ? properties.color_hex_codes : properties.AAT,
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
    
    // Forward property changes to the element
    const changes = {
        initial_content: allProperties.initial_content,
        placeholder: allProperties.placeholder,
        editable: allProperties.editable,
        toolbar_visible: allProperties.toolbar_visible,
        min_height: allProperties.min_height,
        theme: allProperties.theme,
        accent_color: allProperties.accent_color,
        background_color: allProperties.background_color,
        text_color: allProperties.text_color,
        color_palette: allProperties.color_palette,
        color_names: allProperties.color_names,
        color_hex_codes: allProperties.color_hex_codes,
    };

    callback(changes);
}
