/**
 * Bubble.io Element Update Script
 * 
 * This runs whenever any of the element's properties change.
 * This is where we get the actual property values from Bubble.
 */

function(instance, properties, context) {
    // Debug: see what Bubble sends (remove after confirming)
    var keys = properties ? Object.keys(properties) : [];
    if (typeof console !== 'undefined' && console.log) {
        console.log('[TipTap] update() property keys:', keys);
        if (keys.length === 0) console.warn('[TipTap] update() got empty properties – set data sources on the element in the Bubble editor.');
    }

    // Bubble may send initial_content from a dynamic expression (e.g. Thing's draft field).
    // Accept either properties.initial_content (field name) or properties.AAA (element.json field id).
    var initialContent = properties.initial_content != null ? properties.initial_content : (properties.AAA != null ? properties.AAA : '');
    if (typeof initialContent !== 'string') initialContent = String(initialContent);

    // Bubble may send placeholder as .placeholder; ensure we have a string
    var placeholderValue = (properties.placeholder != null && properties.placeholder !== '')
        ? String(properties.placeholder)
        : 'Start writing...';

    // Resolve color list fields: Bubble may use field name, caption, or id (e.g. color_names, "Color names", AAS)
    var colorNames = properties.color_names != null ? properties.color_names : (properties['Color names'] != null ? properties['Color names'] : properties.AAS);
    var colorHexCodes = properties.color_hex_codes != null ? properties.color_hex_codes : (properties['Color hex codes'] != null ? properties['Color hex codes'] : properties.AAT);

    // Map Bubble properties to our internal format; merge with previous so partial updates don't drop list data
    var prev = instance.data._currentProperties || {};
    const allProperties = {
        initial_content: initialContent,
        placeholder: placeholderValue,
        editable: properties.editable !== false,
        toolbar_visible: properties.toolbar_visible !== false,
        min_height: properties.min_height != null ? properties.min_height : (prev.min_height != null ? prev.min_height : 200),
        max_height: properties.max_height != null ? properties.max_height : (prev.max_height != null ? prev.max_height : 0),
        theme: (properties.theme != null ? properties.theme : (properties.AAG != null ? properties.AAG : (prev.theme != null ? prev.theme : 'light'))),
        accent_color: properties.accent_color || prev.accent_color || '#513EDF',
        background_color: properties.background_color || prev.background_color || '#ffffff',
        color_palette: properties.color_palette != null ? properties.color_palette : prev.color_palette,
        color_names: colorNames != null ? colorNames : prev.color_names,
        color_hex_codes: colorHexCodes != null ? colorHexCodes : prev.color_hex_codes,
        default_text_color: (properties.default_text_color != null ? properties.default_text_color : (properties['Default text color'] != null ? properties['Default text color'] : properties.AAU)) ?? prev.default_text_color,
    };
    
    instance.data._currentProperties = allProperties;
    if (typeof console !== 'undefined' && console.log && (colorNames != null || colorHexCodes != null)) {
        console.log('[TipTap] color lists received – names:', colorNames != null, 'hexes:', colorHexCodes != null);
    }

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
        color_palette: allProperties.color_palette,
        color_names: allProperties.color_names,
        color_hex_codes: allProperties.color_hex_codes,
        default_text_color: allProperties.default_text_color,
    };

    callback(changes);
}
