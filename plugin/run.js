/**
 * Bubble.io Element Run Script (Actions)
 *
 * Paste this into the element's "Run" / "When run" script in the Plugin Editor.
 * When a workflow runs an action (e.g. "Set content", "Clear content"), Bubble
 * calls this with the action id and parameters. We forward them to the editor.
 *
 * If your Bubble version uses a different signature, adjust the parameter names
 * (e.g. "action" might be "actionName", params might be in "context", etc.).
 */
function(instance, action, parameters) {
    if (!instance.data._bubbleApi || !instance.data._bubbleApi.runAction) return;

    var run = instance.data._bubbleApi.runAction;
    var p = parameters || {};

    // Map Bubble action id to our action name and params (field ids from element.json)
    if (action === 'ABE') {
        // Set content — field ABF = Content (HTML)
        run('set_content', { content: p.ABF != null ? p.ABF : p.content });
    } else if (action === 'ABG') {
        run('clear_content', {});
    } else if (action === 'ABH') {
        run('focus', {});
    } else if (action === 'ABI') {
        // Insert image — ABJ = Image URL, ABK = Alt text
        run('insert_image', { url: p.ABJ, alt: p.ABK });
    }
}
