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
| **Set content (trigger)** | text | When a workflow sets this to an HTML string, the editor content is replaced (e.g. for Revert). Use when your plugin has no Run script: set this to Thing’s saved HTML in the Revert workflow. |

### States (Outputs)

| State | Type | Description |
|-------|------|-------------|
| `content_html` | text | Current content as HTML |
| `content_json` | text | Current content as JSON |
| `is_empty` | boolean | Whether the editor is empty |
| `word_count` | number | Word count |
| `character_count` | number | Character count |
| **Ready for revert** | boolean | `true` when the editor can accept a **Set content** action (e.g. Revert). Becomes `false` for 400ms after each **Set content** run. Use to disable the Revert button: set the button’s **This element is disabled** to **TipTap’s Ready for revert is false** (or **not** Ready for revert) so the button is disabled during the cooldown and users don’t trigger Revert twice in a row. |

### Autobinding (built-in "Field to modify")

To use Bubble’s **Enable auto-binding on parent element’s thing** with **Field to modify** (e.g. a draft HTML field):

1. **Plugin element (Bubble plugin editor)**  
   - Under **General properties**, set **Modify fields with type** to **text** so “Field to modify” appears.  
   - Expose a **text** state that will hold the editor HTML (e.g. **HTML content** / `html_content`). Bubble often uses the first text-type state for autobinding when the field to modify is text.

2. **App (Bubble app editor)**  
   - Put the editor in a **group** (or page) that has **Type of content** set to the type that has your draft field.  
   - Enable **Enable auto-binding on parent element’s thing** and set **Field to modify** to that field (e.g. “HTML draft content”).  
   - In **Data > Privacy**, allow “current user” (or the right role) to **edit** the type and the field being modified.

3. **Behavior**  
   - The plugin publishes the current HTML to the exposed state on every change and **on blur**.  
   - Bubble reads that state and writes it to the chosen field when appropriate (often on blur).  
   - If autobinding still doesn’t write, use a workflow: **When editor’s content_changed** (or **editor_blurred**) → **Make changes to thing** → set the draft field to **This element’s HTML content**.

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

1. In Bubble Plugin Editor, create a new element plugin.
2. **Element configuration:** Copy the contents of `plugin/element.json` into the element’s configuration (fields, states, events, actions). Do **not** paste `element.json` into the Element Code section.
3. **Element Code** (if your setup uses it): Use a script and stylesheet that load the built bundle from your deployed URL, e.g.:
   ```html
   <script src="https://your-username.github.io/your-repo/dist/bubble-tiptap.iife.js"></script>
   <link rel="stylesheet" href="https://your-username.github.io/your-repo/dist/bubble-tiptap.css">
   ```
4. Copy `plugin/initialize.js` to the Initialize function and `plugin/update.js` to the Update function.
5. **Revert (in your Bubble app, no Run script needed):** The plugin code loads from GitHub; the **Set content (trigger)** field must exist in the element definition in the Plugin Editor (add it or re-import `element.json`). In your **app** (where the TipTap instance and Revert button live): (a) Add a **state** on the group (or page), type **text**, e.g. “Revert trigger”. (b) Set the TipTap element’s **Set content (trigger)** property to that state (e.g. **Group’s Revert trigger**). (c) Revert button workflow: step 1 – Make changes to thing (draft = saved); step 2 – **Set state** → set **Group’s Revert trigger** = **Thing’s saved HTML**. When the state updates, the editor receives the new value and replaces its content.
6. *(Optional)* If your Plugin Editor **does** show a Run/When run script for the element, you can paste `plugin/run.js` there to support the “Set content” **action** as well; then workflows can use either the action or the trigger property.
7. Copy `plugin/preview.js` to the Preview function (if needed).
8. Add the CSS to the shared styles (or rely on the link in Element Code).

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
