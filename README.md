# VectorDraw

A powerful, browser-based vector graphics editor. VectorDraw provides a comprehensive set of drawing tools and features for creating vector artwork, illustrations, and designs directly in your web browser.

## Features

### Drawing Tools
- **Selection Tools**: Select and Detail Select for precise object manipulation
- **Shape Tools**: Rectangle, Circle, Ellipse, Star, Polygon
- **Advanced Circles**: 2-point circles, 3-point circles, Concentric circles, Metaballs
- **Line Tools**: Line, Arc, Arc (3 points), Rays, Ruler
- **Curve Tools**: Bezier curves, Spiro curves, Dubins curves
- **Brush Tools**: Standard Brush, Broad Brush, Fur Brush, Spring Brush, Ribbon Brush, Spray Paint
- **Special Effects**: Cloud, Lightning Web, Node Network, Triangulator, Sketchy Structure
- **Spiral Tools**: Archimedean Spiral, Logarithmic Spiral
- **Text Tool**: Add and edit text with custom fonts
- **Utility Tools**: Eyedropper, Eraser, Hand (pan), Zoom, View Grab
- **Transform Tools**: Rotate, Scale
- **Graph Tool**: Create mathematical graphs

### Panels & Windows
- **Appearance**: Control fill and stroke colors, opacity, and blend modes
- **Adjustments**: Fine-tune visual properties
- **Boolean Operations**: Combine shapes with union, subtract, intersect, and exclude
- **Export**: Define export regions and settings
- **Layers**: Organize your artwork with a layer system
- **Properties**: Adjust tool-specific settings
- **Swatches**: Save and manage color palettes
- **Brushes**: Customize brush presets
- **Script Editor**: Write JavaScript code to programmatically create artwork
- **View**: Control grid, guides, and canvas settings

### File Operations
- **New**: Create a new document
- **Open**: Import VectorDraw JSON files
- **Save**: Export your work as JSON
- **Import**: 
  - Images (GIF, JPG, PNG)
  - SVG files
  - Import from URL
- **Export**:
  - Raster images (PNG, JPG)
  - SVG vector files

### Editing Features
- Undo/Redo support
- Cut, Copy, Paste
- Delete objects
- Layer management
- Object grouping
- Compound paths
- Boolean operations

### View Controls
- Zoom in/out (Alt + Scroll or toolbar controls)
- Reset zoom (Ctrl/Cmd + 1)
- Pan canvas
- Grid system with multiple types
- Guides and rulers
- Customizable workspace

### Customization
- Dark/Light theme support
- Adjustable grid settings
- Customizable tool options
- Floating and dockable panels
- Persistent settings via localStorage

## Getting Started

### Installation

1. Clone or download this repository
2. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, or Edge recommended)

No build process or server required - VectorDraw runs entirely in your browser!

### System Requirements

- Modern web browser with HTML5 Canvas support
- JavaScript enabled
- Recommended: Mouse or graphics tablet for drawing

## User Guide

### Basic Workflow

#### 1. Creating Your First Drawing

1. **Open VectorDraw** by loading `index.html` in your browser
2. **Select a tool** from the toolbar on the left side
3. **Draw on the canvas** by clicking and dragging
4. **Adjust properties** using the right sidebar panels

#### 2. Using Drawing Tools

**Shape Tools (Rectangle, Circle, Star, etc.)**
- Select the tool from the toolbar
- Click and drag on the canvas to create the shape
- Hold Shift while dragging to constrain proportions
- Adjust tool-specific options in the Properties panel

**Brush Tools**
- Select a brush tool (Brush, Broad Brush, Fur Brush, etc.)
- Click and drag to paint
- Adjust brush size and properties in the Properties panel
- Each brush has unique characteristics for different effects

**Bezier & Curve Tools**
- Click to place anchor points
- Drag to create curved segments
- Double-click or press Enter to complete the path

**Text Tool**
- Select the Text tool
- Click on the canvas to place text
- Type your text
- Adjust font, size, and styling in the Properties panel

#### 3. Selecting and Editing Objects

**Selection Tool**
- Click an object to select it
- Drag to move selected objects
- Use handles to resize or rotate
- Shift+Click to select multiple objects

**Detail Select Tool**
- Select individual anchor points and segments
- Drag points to reshape paths
- Adjust curve handles for precise control

#### 4. Working with Colors

**Setting Fill and Stroke**
- Use the color pickers in the toolbar
- Click the fill color square to change fill
- Click the stroke color square to change outline
- Use the swap button to exchange fill and stroke colors
- Click "No Fill" or "No Stroke" buttons to remove colors

**Eyedropper Tool**
- Select the Eyedropper tool
- Click any object to sample its colors
- Colors are applied to the currently selected object

#### 5. Layer Management

**Layers Panel**
- Open from Window > Layers
- Create new layers with the + button
- Drag layers to reorder
- Click eye icon to show/hide layers
- Click lock icon to prevent editing
- Double-click layer name to rename

**Working with Layers**
- Objects are created on the active layer
- Select a layer to make it active
- Group related objects on the same layer
- Use layers to organize complex artwork

#### 6. Boolean Operations

**Combining Shapes**
- Select two or more overlapping shapes
- Open the Boolean panel (Window > Boolean)
- Choose an operation:
  - **Unite**: Combine shapes into one
  - **Subtract**: Remove overlapping areas
  - **Intersect**: Keep only overlapping areas
  - **Exclude**: Remove overlapping areas from both shapes

#### 7. Transforming Objects

**Using Transform Tools**
- **Rotate Tool**: Click and drag to rotate selected objects
- **Scale Tool**: Click and drag to resize selected objects
- Hold Shift to constrain transformations

**Manual Transformation**
- Select an object with the Selection tool
- Drag corner handles to resize
- Drag rotation handle to rotate
- Hold Shift for constrained transformations

#### 8. View Navigation

**Zooming**
- Use the zoom controls in the bottom-right corner
- Alt + Scroll wheel to zoom in/out
- Ctrl/Cmd + 1 to reset zoom to 100%
- Zoom tool: Click to zoom in, Alt+Click to zoom out

**Panning**
- Hand tool: Drag to pan the canvas
- Hold Spacebar + Drag with any tool active
- View > Reset Pan to center the canvas

**Grid and Guides**
- Toggle grid visibility in the View panel
- Choose grid type: None, Square, Isometric, etc.
- Adjust grid spacing and color
- Enable snap-to-grid for precise alignment

#### 9. Script Editor

**Writing Scripts**
- Open Window > Script Editor
- Write JavaScript code using Paper.js API
- Click "Run" to execute your script
- Use console.log() to debug
- Scripts can create complex artwork programmatically

**Example Script**
```javascript
// Create a circle
var circle = new Path.Circle({
    center: [100, 100],
    radius: 50,
    fillColor: 'red'
});

console.log('Circle created!');
```

#### 10. Saving and Exporting

**Save Your Work**
- Menu > Save to export as JSON
- JSON files preserve all layers, objects, and properties
- Menu > Open to reload saved JSON files

**Export Images**
- Menu > Export > Image for raster output (PNG)
- Menu > Export > SVG for vector output
- Use the Export panel to define export regions
- Export Rect tool to select specific areas

**Import Files**
- Menu > Import > Image to place raster images
- Menu > Import > SVG to import vector artwork
- Imported images become part of your document

### Keyboard Shortcuts

**General**
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` - Redo
- `Ctrl/Cmd + X` - Cut
- `Ctrl/Cmd + C` - Copy
- `Ctrl/Cmd + V` - Paste
- `Delete` or `Backspace` - Delete selected objects

**View**
- `Ctrl/Cmd + 1` - Reset zoom to 100%
- `Alt + Scroll` - Zoom in/out
- `Spacebar + Drag` - Pan canvas
- `+` - Zoom in
- `-` - Zoom out

**Tools**
- `V` - Selection tool
- `A` - Detail Select tool
- `T` - Text tool
- `H` - Hand tool
- `Z` - Zoom tool

### Tips and Tricks

1. **Organize with Layers**: Use layers to separate different elements of your artwork for easier editing

2. **Use Keyboard Shortcuts**: Speed up your workflow by learning common shortcuts

3. **Experiment with Brushes**: Each brush tool creates unique effects - try them all!

4. **Boolean Operations**: Combine simple shapes to create complex forms

5. **Script Editor**: Automate repetitive tasks or create parametric designs with code

6. **Save Frequently**: Export your work as JSON to preserve all editing capabilities

7. **Color Swatches**: Save frequently used colors in the Swatches panel

8. **Grid and Snap**: Enable grid snapping for precise alignment

9. **Floating Panels**: Panels can be detached and repositioned for a custom workspace

10. **Theme Toggle**: Switch between light and dark themes for comfortable working

## Browser Compatibility

VectorDraw works best in modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Technology Stack

- **Paper.js** - Vector graphics scripting framework
- **jQuery** - DOM manipulation and utilities
- **OpenType.js** - Font rendering
- **FileSaver.js** - File download functionality
- **Culori** - Color manipulation
- Custom JavaScript for UI and tools

## Project Structure

```
VectorDraw/
├── index.html          # Main application file
├── config.json         # App configuration
├── css/                # Stylesheets
│   ├── styles.css      # Main styles
│   ├── toolbar.css     # Toolbar styles
│   ├── sidebar.css     # Sidebar styles
│   └── ...
├── js/                 # JavaScript modules
│   ├── init.js         # Initialization
│   ├── tools.js        # Tool management
│   ├── document.js     # Document handling
│   ├── layer.js        # Layer system
│   ├── export.js       # Export functionality
│   ├── tools/          # Individual tool implementations
│   └── lib/            # Third-party libraries
├── fonts/              # Font files
├── assets/             # Icons and images
└── user/               # User data storage
```

## Settings and Customization

VectorDraw stores your preferences in browser localStorage:
- Tool settings and options
- Panel positions and states
- Theme preference
- Grid settings
- Recent colors

To reset all settings: Menu > Reset Settings



## Credits

Created by [Samolevsky.com](https://samolevsky.com)

Built with Paper.js and other open-source libraries.

## Support

If you find VectorDraw useful, consider supporting its development through the "Support App Development" button in the menu.

---



Enjoy creating with VectorDraw!
