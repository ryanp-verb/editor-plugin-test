/**
 * TipTap Editor - Bubble.io Plugin
 * 
 * Local development entry point
 */

import './styles/design-tokens.css';
import './styles/editor.css';
import './styles/sidebar.css';
import { BubbleElement } from './bubble/element';
import { Sidebar } from './editor/Sidebar';
import { bubbleMock, EventLogEntry } from './mock/BubbleMock';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeDemo();
});

function initializeDemo() {
  // Get DOM elements
  const editorMount = document.getElementById('editor-mount');
  const wordCountEl = document.getElementById('word-count');
  const charCountEl = document.getElementById('char-count');
  const appEl = document.querySelector('.app');
  
  // Modal elements
  const modalOverlay = document.getElementById('modal-settings');
  const btnSettings = document.getElementById('btn-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  
  if (!editorMount) {
    console.error('Editor mount element not found');
    return;
  }

  // --- Sidebar Toggle ---
  let sidebarExpanded = false;
  let sidebar: Sidebar | null = null;
  const sidebarContainer = document.getElementById('tools-sidebar');
  
  function toggleSidebar() {
    sidebarExpanded = !sidebarExpanded;
    appEl?.classList.toggle('expanded', sidebarExpanded);
    bubbleElement.setSidebarExpanded(sidebarExpanded);
    
    // Create sidebar on first expand
    if (sidebarExpanded && !sidebar && sidebarContainer) {
      const editor = bubbleElement.getEditor();
      if (editor) {
        // Clear old HTML content
        sidebarContainer.innerHTML = '';
        
        // Create new sidebar component
        sidebar = new Sidebar({
          editor,
          container: sidebarContainer,
          onCollapse: () => toggleSidebar(),
        });
      }
    }
    
    updateToolButtonStates();
  }

  // --- Collapsible Sections (for new sidebar) ---
  document.addEventListener('click', (e) => {
    const header = (e.target as HTMLElement).closest('.bp-sidebar-title');
    if (header) {
      const section = header.closest('.bp-sidebar-section');
      section?.classList.toggle('collapsed');
    }
  });

  // --- Modal Controls ---
  function openModal() {
    modalOverlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalOverlay?.classList.remove('open');
    document.body.style.overflow = '';
  }

  btnSettings?.addEventListener('click', openModal);
  btnCloseSettings?.addEventListener('click', closeModal);
  
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay?.classList.contains('open')) {
      closeModal();
    }
  });

  // Create the Bubble element
  const bubbleElement = new BubbleElement({
    container: editorMount,
    bubble: bubbleMock,
  });

  bubbleElement.initialize();

  // Connect sidebar toggle from toolbar
  bubbleElement.onToggleSidebar(toggleSidebar);

  // Track active output tab
  let activeOutputTab: 'html' | 'json' = 'html';

  // --- Theme Presets (BP Brand) ---
  const lightTheme = {
    brand_primary: '#007f00',
    brand_light_1: '#8edf00',
    brand_light_2: '#ccff00',
    brand_dark_1: '#004f00',
    background_color: '#ffffff',
    toolbar_background: '#f5f5f2',
    text_color: '#121000',
    text_muted_color: '#494736',
    border_color: '#c9cbbe',
    icon_color: '#494736',
    icon_active_color: '#ffffff',
  };

  const darkTheme = {
    brand_primary: '#8edf00',
    brand_light_1: '#ccff00',
    brand_light_2: '#e0ff66',
    brand_dark_1: '#007f00',
    background_color: '#1a1d27',
    toolbar_background: '#1e2230',
    text_color: '#e4e6ed',
    text_muted_color: '#8b8fa3',
    border_color: '#2e3345',
    icon_color: '#8b8fa3',
    icon_active_color: '#121000',
  };

  // --- Helper: Adjust brightness ---
  function adjustBrightness(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
  }

  // --- Modal Property Controls ---
  const placeholderInput = document.getElementById('prop-placeholder') as HTMLInputElement;
  const editableCheck = document.getElementById('prop-editable') as HTMLInputElement;
  const toolbarCheck = document.getElementById('prop-toolbar') as HTMLInputElement;

  placeholderInput?.addEventListener('change', () => {
    bubbleMock.setProperty('placeholder', placeholderInput.value);
  });

  editableCheck?.addEventListener('change', () => {
    bubbleMock.setProperty('editable', editableCheck.checked);
  });

  toolbarCheck?.addEventListener('change', () => {
    bubbleMock.setProperty('toolbar_visible', toolbarCheck.checked);
  });

  // --- Modal Theme Controls ---
  const themePreset = document.getElementById('theme-preset') as HTMLSelectElement;
  const themeAccent = document.getElementById('theme-accent') as HTMLInputElement;
  const themeAccentText = document.getElementById('theme-accent-text') as HTMLInputElement;
  const themeBackground = document.getElementById('theme-background') as HTMLInputElement;
  const themeIconColor = document.getElementById('theme-icon-color') as HTMLInputElement;
  const themeIconActive = document.getElementById('theme-icon-active') as HTMLInputElement;
  const themeFont = document.getElementById('theme-font') as HTMLSelectElement;
  const themeFontSize = document.getElementById('theme-font-size') as HTMLInputElement;
  const themeRadius = document.getElementById('theme-radius') as HTMLInputElement;
  const fontSizeValue = document.getElementById('font-size-value');
  const radiusValue = document.getElementById('radius-value');

  function updateThemeControls(isDark: boolean) {
    const colors = isDark ? darkTheme : lightTheme;
    if (themeBackground) themeBackground.value = colors.background_color;
    if (themeIconColor) themeIconColor.value = colors.icon_color;
    if (themeIconActive) themeIconActive.value = colors.icon_active_color;
  }

  themePreset?.addEventListener('change', () => {
    const theme = themePreset.value as 'dark' | 'light' | 'auto';
    bubbleMock.setProperty('theme', theme);
    if (theme === 'light') {
      bubbleMock.setProperties(lightTheme);
      updateThemeControls(false);
    } else if (theme === 'dark') {
      bubbleMock.setProperties(darkTheme);
      updateThemeControls(true);
    }
  });

  themeAccent?.addEventListener('input', () => {
    bubbleMock.setProperty('accent_color', themeAccent.value);
    if (themeAccentText) themeAccentText.value = themeAccent.value;
  });

  themeAccentText?.addEventListener('change', () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(themeAccentText.value)) {
      bubbleMock.setProperty('accent_color', themeAccentText.value);
      if (themeAccent) themeAccent.value = themeAccentText.value;
    }
  });

  themeBackground?.addEventListener('input', () => {
    bubbleMock.setProperty('background_color', themeBackground.value);
    bubbleMock.setProperty('toolbar_background', adjustBrightness(themeBackground.value, 10));
  });

  themeIconColor?.addEventListener('input', () => {
    bubbleMock.setProperty('icon_color', themeIconColor.value);
  });

  themeIconActive?.addEventListener('input', () => {
    bubbleMock.setProperty('icon_active_color', themeIconActive.value);
  });

  themeFont?.addEventListener('change', () => {
    bubbleMock.setProperty('font_family', themeFont.value);
  });

  themeFontSize?.addEventListener('input', () => {
    const size = parseInt(themeFontSize.value, 10);
    bubbleMock.setProperty('font_size', size);
    if (fontSizeValue) fontSizeValue.textContent = String(size);
  });

  themeRadius?.addEventListener('input', () => {
    const radius = parseInt(themeRadius.value, 10);
    bubbleMock.setProperty('border_radius', radius);
    if (radiusValue) radiusValue.textContent = String(radius);
  });

  // --- Modal Action Buttons ---
  const sampleContent = `
    <h1>Welcome to TipTap Editor</h1>
    <p>This is a <strong>rich text editor</strong> built with <a href="https://tiptap.dev">TipTap</a> and <em>ProseMirror</em>.</p>
    <h2>Features</h2>
    <ul>
      <li>Bold, italic, and strikethrough formatting</li>
      <li>Multiple heading levels</li>
      <li>Bullet and numbered lists</li>
      <li>Task lists with checkboxes</li>
      <li>Code blocks with syntax highlighting</li>
      <li>Tables with resizable columns</li>
      <li>Image support</li>
    </ul>
    <h2>Code Example</h2>
    <pre><code class="language-javascript">function greet(name) {
  console.log("Hello, " + name + "!");
}

greet('World');</code></pre>
    <blockquote>
      <p>This editor is designed to integrate seamlessly with Bubble.io applications.</p>
    </blockquote>
  `.trim();

  document.getElementById('action-focus')?.addEventListener('click', () => bubbleMock.runAction('focus'));
  document.getElementById('action-clear')?.addEventListener('click', () => bubbleMock.runAction('clear_content'));
  document.getElementById('action-insert-image')?.addEventListener('click', () => {
    const url = prompt('Enter image URL:', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800');
    if (url) bubbleMock.runAction('insert_image', { url });
  });
  document.getElementById('action-set-content')?.addEventListener('click', () => {
    bubbleMock.runAction('set_content', { content: sampleContent });
  });

  // Email export
  document.getElementById('action-copy-email')?.addEventListener('click', async () => {
    const editor = bubbleElement.getEditor();
    if (editor) {
      const success = await editor.copyEmailToClipboard();
      if (success) {
        const btn = document.getElementById('action-copy-email');
        if (btn) {
          const originalText = btn.textContent;
          btn.textContent = 'Copied!';
          btn.classList.add('primary');
          setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('primary');
          }, 2000);
        }
      }
    }
  });

  document.getElementById('action-download-email')?.addEventListener('click', () => {
    const editor = bubbleElement.getEditor();
    if (editor) {
      const timestamp = new Date().toISOString().slice(0, 10);
      editor.downloadAsEmail(`email-export-${timestamp}.html`);
    }
  });

  // --- Modal Output Tabs ---
  const outputContentEl = document.getElementById('output-content');
  
  document.querySelectorAll('.output-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const container = tab.closest('.modal-section');
      container?.querySelectorAll('.output-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeOutputTab = tab.getAttribute('data-tab') as 'html' | 'json';
      updateOutputDisplay();
    });
  });

  function updateOutputDisplay() {
    if (!outputContentEl) return;
    const states = bubbleMock.getStates();
    if (activeOutputTab === 'html') {
      outputContentEl.textContent = states.html_content || '<empty>';
    } else {
      // JSON output - get directly from editor if available
      outputContentEl.textContent = 'JSON view available in full implementation';
    }
  }

  // --- Modal Event Log ---
  const eventLogEl = document.getElementById('event-log');

  function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function addEventToLog(entry: EventLogEntry) {
    if (!eventLogEl) return;
    
    const emptyState = eventLogEl.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const eventItem = document.createElement('div');
    eventItem.className = 'event-item';
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data).slice(0, 50)}...` : '';
    eventItem.innerHTML = `
      <span class="event-time">${formatTime(entry.timestamp)}</span>
      <span class="event-name">${entry.name}</span>
      <span class="event-data">${dataStr}</span>
    `;
    eventLogEl.insertBefore(eventItem, eventLogEl.firstChild);
    while (eventLogEl.children.length > 20) {
      eventLogEl.lastChild?.remove();
    }
  }

  bubbleMock.onEvent('*', (entry) => {
    addEventToLog(entry);
  });

  // --- Sidebar Tool Buttons ---
  function setupToolButtons() {
    const editor = bubbleElement.getEditor();
    if (!editor) return;

    const toolActions: Record<string, () => void> = {
      // Formatting
      bold: () => editor.toggleBold(),
      italic: () => editor.toggleItalic(),
      strike: () => editor.toggleStrike(),
      code: () => editor.toggleCode(),
      // Headings
      paragraph: () => editor.setParagraph(),
      h1: () => editor.setHeading(1),
      h2: () => editor.setHeading(2),
      h3: () => editor.setHeading(3),
      // Lists
      bulletList: () => editor.toggleBulletList(),
      orderedList: () => editor.toggleOrderedList(),
      taskList: () => editor.toggleTaskList(),
      // Blocks
      blockquote: () => editor.toggleBlockquote(),
      codeBlock: () => editor.toggleCodeBlock(),
      divBlock: () => editor.toggleDivBlock(),
      horizontalRule: () => editor.setHorizontalRule(),
      // Insert
      link: () => {
        if (editor.isActive('link')) {
          editor.unsetLink();
        } else {
          const url = prompt('Enter URL:');
          if (url) editor.setLink(url);
        }
      },
      image: () => {
        const url = prompt('Enter image URL:');
        if (url) editor.insertImage(url);
      },
      table: () => editor.insertTable(3, 3),
      // Layout
      columns2: () => editor.insertTwoColumns(),
      columns3: () => editor.insertThreeColumns(),
      // History
      undo: () => editor.undo(),
      redo: () => editor.redo(),
    };

    // Tools that can be dragged into the editor
    const draggableTools: Record<string, { type: string; content?: Record<string, unknown> }> = {
      blockquote: { type: 'blockquote' },
      codeBlock: { type: 'codeBlock' },
      divBlock: { type: 'divBlock' },
      horizontalRule: { type: 'horizontalRule' },
      image: { type: 'image' },
      table: { type: 'table' },
      columns2: { type: 'columnLayout', content: { columns: 2 } },
      columns3: { type: 'columnLayout', content: { columns: 3 } },
    };

    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      const tool = btn.getAttribute('data-tool');
      if (!tool) return;

      // Click handler
      if (toolActions[tool]) {
        btn.addEventListener('click', () => {
          // Don't trigger click after drag
          if ((btn as HTMLElement).dataset.wasDragged === 'true') {
            (btn as HTMLElement).dataset.wasDragged = 'false';
            return;
          }
          toolActions[tool]();
          updateToolButtonStates();
        });
      }

      // Make draggable if applicable
      if (draggableTools[tool]) {
        const buttonEl = btn as HTMLElement;
        buttonEl.draggable = true;
        buttonEl.classList.add('draggable');

        buttonEl.addEventListener('dragstart', (e) => {
          if (e.dataTransfer) {
            e.dataTransfer.setData('application/json', JSON.stringify(draggableTools[tool]));
            e.dataTransfer.effectAllowed = 'copy';
            buttonEl.classList.add('dragging');

            // Create custom drag image
            const dragImage = document.createElement('div');
            dragImage.textContent = btn.querySelector('span')?.textContent || tool;
            dragImage.style.cssText = `
              position: absolute;
              top: -1000px;
              left: -1000px;
              padding: 8px 12px;
              background: var(--color-accent, #6366f1);
              color: white;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 500;
              font-family: system-ui, sans-serif;
              white-space: nowrap;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 40, 20);
            setTimeout(() => dragImage.remove(), 0);
          }
        });

        buttonEl.addEventListener('dragend', () => {
          buttonEl.classList.remove('dragging');
          buttonEl.dataset.wasDragged = 'true';
          // Reset after a tick to allow click to be ignored
          setTimeout(() => {
            buttonEl.dataset.wasDragged = 'false';
          }, 100);
        });
      }
    });
  }

  function updateToolButtonStates() {
    const editor = bubbleElement.getEditor();
    if (!editor) return;

    const activeChecks: Record<string, () => boolean> = {
      bold: () => editor.isActive('bold'),
      italic: () => editor.isActive('italic'),
      strike: () => editor.isActive('strike'),
      code: () => editor.isActive('code'),
      paragraph: () => editor.isActive('paragraph'),
      h1: () => editor.isActive('heading', { level: 1 }),
      h2: () => editor.isActive('heading', { level: 2 }),
      h3: () => editor.isActive('heading', { level: 3 }),
      bulletList: () => editor.isActive('bulletList'),
      orderedList: () => editor.isActive('orderedList'),
      taskList: () => editor.isActive('taskList'),
      blockquote: () => editor.isActive('blockquote'),
      codeBlock: () => editor.isActive('codeBlock'),
      divBlock: () => editor.isActive('divBlock'),
      link: () => editor.isActive('link'),
      columns2: () => editor.isActive('columnLayout', { columns: 2 }),
      columns3: () => editor.isActive('columnLayout', { columns: 3 }),
    };

    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      const tool = btn.getAttribute('data-tool');
      if (tool && activeChecks[tool]) {
        btn.classList.toggle('active', activeChecks[tool]());
      }
    });
  }

  // Initialize tool buttons after editor is ready
  setTimeout(() => {
    setupToolButtons();
    
    // Listen for editor updates to refresh tool button states
    const editor = bubbleElement.getEditor();
    if (editor) {
      const tipTap = editor.getTipTapEditor();
      tipTap.on('transaction', updateToolButtonStates);
      tipTap.on('selectionUpdate', updateToolButtonStates);
    }
  }, 100);

  // --- Stats Updates ---
  function updateStats() {
    const states = bubbleMock.getStates();
    if (wordCountEl) wordCountEl.textContent = String(states.word_count);
    // Character count computed from HTML content length as approximation
    if (charCountEl) charCountEl.textContent = String(states.html_content?.replace(/<[^>]*>/g, '').length || 0);
    updateOutputDisplay();
  }

  setInterval(updateStats, 200);
  updateStats();

  // Log ready message
  console.log('🚀 TipTap Editor Demo initialized');
  console.log('📝 Click the sidebar toggle in the toolbar to expand tools');
  console.log('🔍 Access bubble mock via: window.bubbleMock');

  // Expose for debugging
  (window as unknown as { bubbleMock: typeof bubbleMock; bubbleElement: typeof bubbleElement }).bubbleMock = bubbleMock;
  (window as unknown as { bubbleElement: typeof bubbleElement }).bubbleElement = bubbleElement;
}

// Export for library usage
export { ContentEditor } from './editor/Editor';
export { Toolbar } from './editor/Toolbar';
export { Sidebar } from './editor/Sidebar';
export { BubbleElement } from './bubble/element';
export { BubbleMock, bubbleMock } from './mock/BubbleMock';
export { EventBridge } from './bubble/events';
export { ActionHandler } from './bubble/actions';
export { convertToEmailHTML, downloadEmailHTML, copyEmailHTMLToClipboard } from './utils/emailExport';
export type { EmailExportOptions } from './utils/emailExport';
export { applyTheme, getThemePreset, lightThemePreset, darkThemePreset, bpBrandColors, defaultColorPalette } from './utils/themeApplier';
export type { ThemeProperties } from './utils/themeApplier';
