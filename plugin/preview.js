/**
 * Bubble.io Element Preview Script
 * 
 * This runs in the Bubble editor to show a preview of the element.
 */

function(instance, properties) {
    const container = instance.canvas[0];
    
    // Clear previous content
    container.innerHTML = '';
    
    // Create preview container
    const preview = document.createElement('div');
    preview.style.cssText = `
        width: 100%;
        height: 100%;
        min-height: ${properties.min_height || 200}px;
        background: #1a1d27;
        border-radius: 8px;
        border: 1px solid #2e3345;
        display: flex;
        flex-direction: column;
        font-family: system-ui, -apple-system, sans-serif;
        overflow: hidden;
    `;
    
    // Toolbar preview
    if (properties.toolbar_visible !== false) {
        const toolbar = document.createElement('div');
        toolbar.style.cssText = `
            padding: 8px 12px;
            background: #1e2230;
            border-bottom: 1px solid #2e3345;
            display: flex;
            gap: 8px;
        `;
        
        // Add fake toolbar buttons
        const buttonLabels = ['B', 'I', 'U', 'H1', 'H2', '•', '1.'];
        buttonLabels.forEach(label => {
            const btn = document.createElement('span');
            btn.textContent = label;
            btn.style.cssText = `
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                color: #8b8fa3;
                font-size: 12px;
                font-weight: 500;
                border-radius: 4px;
            `;
            toolbar.appendChild(btn);
        });
        
        preview.appendChild(toolbar);
    }
    
    // Content area preview
    const content = document.createElement('div');
    content.style.cssText = `
        flex: 1;
        padding: 24px;
        color: #8b8fa3;
        font-size: 14px;
    `;
    
    if (properties.initial_content) {
        content.innerHTML = properties.initial_content;
        content.style.color = '#e4e6ed';
    } else {
        content.textContent = properties.placeholder || 'Start writing...';
    }
    
    preview.appendChild(content);
    container.appendChild(preview);
}
