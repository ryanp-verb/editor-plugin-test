# TipTap Rich Text Editor - Bubble.io Plugin

A powerful rich text editor built with [TipTap](https://tiptap.dev) and [ProseMirror](https://prosemirror.net), designed to integrate with Bubble.io applications.

## Features

- **Rich Text Formatting**: Bold, italic, strikethrough, inline code
- **Headings**: H1, H2, H3, and paragraph styles
- **Lists**: Bullet lists, numbered lists, and task lists with checkboxes
- **Code Blocks**: Syntax-highlighted code with support for common languages
- **Tables**: Resizable tables with row/column controls
- **Media**: Image support with URL insertion
- **Links**: Hyperlink support with click-to-edit
- **Blockquotes**: Styled quote blocks
- **History**: Full undo/redo support

## Local Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Navigate to the project directory
cd bubble-tiptap-plugin

# Install dependencies
npm install

# Start development server
npm run dev
```

The dev server will start at `http://localhost:3000` with hot reload enabled.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build for Bubble |
| `npm run preview` | Preview production build locally |

## Demo Page Features

The local development environment includes an interactive demo page with:

1. **Live Editor**: Full-featured TipTap editor with toolbar
2. **Stats Panel**: Real-time word and character counts
3. **Property Controls**: Simulate Bubble property changes
   - Placeholder text
   - Editable toggle
   - Toolbar visibility
4. **Action Buttons**: Test Bubble actions
   - Focus editor
   - Clear content
   - Insert image
   - Load sample content
5. **Output Display**: View content as HTML or JSON
6. **Event Log**: Monitor all events that would fire to Bubble workflows

## Project Structure

```
bubble-tiptap-plugin/
├── src/
│   ├── main.ts              # Demo entry point
│   ├── editor/
│   │   ├── Editor.ts        # TipTap editor wrapper
│   │   ├── extensions.ts    # Extension configuration
│   │   └── Toolbar.ts       # Toolbar component
│   ├── bubble/
│   │   ├── element.ts       # Bubble element bridge
│   │   ├── events.ts        # Event emitter
│   │   └── actions.ts       # Action handler
│   ├── mock/
│   │   └── BubbleMock.ts    # Bubble API mock for development
│   └── styles/
│       └── editor.css       # Editor styling
├── plugin/
│   ├── element.json         # Bubble element definition
│   ├── initialize.js        # Bubble initialize script
│   ├── update.js            # Bubble update script
│   └── preview.js           # Bubble preview script
└── dist/                    # Production build output
```

## Bubble Integration

### Properties (Inputs)

| Property | Type | Description |
|----------|------|-------------|
| `initial_content` | text | HTML content to load on initialization |
| `placeholder` | text | Placeholder text when empty |
| `editable` | boolean | Enable/disable editing |
| `toolbar_visible` | boolean | Show/hide the toolbar |
| `min_height` | number | Minimum height in pixels |
| `max_height` | number | Maximum height in pixels (0 = unlimited) |

### States (Outputs)

| State | Type | Description |
|-------|------|-------------|
| `content_html` | text | Current content as HTML |
| `content_json` | text | Current content as JSON |
| `is_empty` | boolean | Whether the editor is empty |
| `word_count` | number | Word count |
| `character_count` | number | Character count |

### Events

| Event | Description |
|-------|-------------|
| `content_changed` | Fires when content changes (debounced 300ms) |
| `editor_focused` | Fires when editor gains focus |
| `editor_blurred` | Fires when editor loses focus |

### Actions

| Action | Parameters | Description |
|--------|------------|-------------|
| `set_content` | `content` (HTML) | Set editor content |
| `clear_content` | - | Clear all content |
| `focus` | - | Focus the editor |
| `insert_image` | `url`, `alt` | Insert image at cursor |

## Building for Bubble

After code review and approval:

```bash
# Create production build
npm run build
```

This generates:
- `dist/bubble-tiptap.iife.js` - Browser-ready bundle
- `dist/bubble-tiptap.es.js` - ES module bundle
- `dist/bubble-tiptap.css` - Compiled styles

### Deploying to Bubble

1. In Bubble Plugin Editor, create a new element plugin
2. Copy the contents of `plugin/element.json` to configure fields/states/events/actions
3. Upload `dist/bubble-tiptap.iife.js` as a shared header
4. Copy `plugin/initialize.js` to the Initialize function
5. Copy `plugin/update.js` to the Update function
6. Copy `plugin/preview.js` to the Preview function
7. Add the CSS to the shared styles

## Customization

### Theming

Edit CSS variables in `src/styles/editor.css`:

```css
:root {
  --editor-bg: #1a1d27;
  --editor-text: #e4e6ed;
  --editor-accent: #6366f1;
  /* ... more variables */
}
```

### Adding Extensions

Edit `src/editor/extensions.ts` to add or configure TipTap extensions.

## License

MIT
