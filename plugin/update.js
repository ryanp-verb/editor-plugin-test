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
    if (typeof console !== 'undefined' && console.log) console.log('[TipTap] initial_content length:', initialContent.length, 'preview:', initialContent.substring(0, 60) + (initialContent.length > 60 ? '...' : ''));

    // Bubble may send placeholder as .placeholder; ensure we have a string
    var placeholderValue = (properties.placeholder != null && properties.placeholder !== '')
        ? String(properties.placeholder)
        : 'Start writing...';

    // Set content trigger: when workflow sets this to HTML, we replace editor content (e.g. Revert)
    // Accept set_content (field name in Bubble), set_content_trigger, or AAS (element.json id)
    // Bubble may send dynamic values as plain string or as object; normalize to string
    function toStr(v) {
        if (v == null) return '';
        if (typeof v === 'string') return v;
        if (typeof v === 'object' && typeof v.get === 'function') return toStr(v.get());
        return String(v);
    }
    var rawSetContent = properties.set_content != null ? properties.set_content : (properties.set_content_trigger != null ? properties.set_content_trigger : properties.AAS);
    var setContentTrigger = rawSetContent != null ? toStr(rawSetContent) : '';
    if (typeof console !== 'undefined' && console.log) {
        if (setContentTrigger.length > 0) console.log('[TipTap] set_content_trigger received, length:', setContentTrigger.length);
        // If Revert still doesn't work, check console for "TipTap update" to see what keys Bubble sent
        if (setContentTrigger.length > 0) console.log('[TipTap] update property keys:', Object.keys(properties));
    }

    // Map Bubble properties to our internal format with defaults
    const allProperties = {
        // Core properties
        initial_content: initialContent,
        placeholder: placeholderValue,
        editable: properties.editable !== false,
        toolbar_visible: properties.toolbar_visible !== false,
        min_height: properties.min_height || 200,
        max_height: properties.max_height || 0,
        set_content_trigger: setContentTrigger,
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
        initial_content: allProperties.initial_content,
        placeholder: allProperties.placeholder,
        editable: allProperties.editable,
        toolbar_visible: allProperties.toolbar_visible,
        min_height: allProperties.min_height,
        set_content_trigger: allProperties.set_content_trigger,
        theme: allProperties.theme,
        accent_color: allProperties.accent_color,
        background_color: allProperties.background_color,
        text_color: allProperties.text_color,
    };

    // Notify the element of property changes
    callback(changes);
}
