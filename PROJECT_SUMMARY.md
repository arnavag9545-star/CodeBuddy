# CodeBuddy Project - Development Summary

## Project Overview

**Project Name:** CodeBuddy  
**Location:** `C:\Users\Kapil Kulkarni\.gemini\antigravity\scratch\CodeBuddy`  
**Type:** React-based Online Code Editor (similar to VS Code in browser)  
**Tech Stack:**
- React 18 + Vite
- Monaco Editor (@monaco-editor/react)
- Tailwind CSS
- Lucide React (icons)
- jsPDF (PDF generation)
- JSZip (ZIP downloads)

---

## Current Features

### 1. Code Editor (Monaco-based)
- **Multi-language support:** Python, JavaScript, C++, C, Java
- **Syntax highlighting** for all supported languages
- **Smart autocomplete** with language-specific suggestions
- **Code execution** via Piston API
- **Keyboard shortcuts:** Ctrl+Enter to run, Ctrl+N for new file
- **Settings panel:** Font size, theme (dark/light), autocomplete toggle, word wrap toggle
- **Performance optimized:** Uses refs and debouncing for lag-free typing

### 2. Tab Management (Chrome-like)
- **Multiple tabs** for different files
- **Tab creation** with automatic language detection from filename
- **Tab persistence** - tabs survive page refresh (localStorage)
- **Close tab** / **Close other tabs** functionality
- **Right-click context menu** on tabs

### 3. Tab Grouping (Chrome-style)
- **Create groups** with custom names and colors
- **8 color options:** Gray, Blue, Red, Yellow, Green, Pink, Purple, Cyan
- **Collapse/Expand groups** by clicking group label
- **Drag tabs into groups** or out of groups
- **Group context menu:**
  - Download group as source (ZIP for multiple files)
  - Download group as PDF (formatted code document)
  - Edit group (rename, change color)
  - Ungroup all tabs
  - Close group (closes all tabs in group)
- **Visual indicators:** Colored top border on grouped tabs, group label with tab count

### 4. Drag and Drop
- **Reorder tabs** by dragging left/right
- **Add to group** by dragging tab onto grouped tabs
- **Remove from group** by dragging to ungrouped area
- **Visual feedback:** Drop indicators, drag opacity, group highlight

### 5. Terminal Panel
- **Persistent history** - previous executions are preserved (up to 50)
- **Formatted output** with timestamps, filename, exit codes
- **Execution time** displayed for each run
- **Auto-scroll** to latest output
- **Clear history** button
- **Error highlighting** with red border

### 6. Download Features
- **Download current file** as source code
- **Download as PDF** with syntax formatting
- **Download group as ZIP** (multiple files)
- **Download group as PDF** (all files in one document)

### 7. Persistence (localStorage)
- **Tabs data:** All tabs with code content
- **Active tab:** Which tab was last active
- **Tab groups:** Group definitions (name, color, collapsed state)
- **Settings:** Font size, theme, autocomplete, word wrap
- **Validation on load:** Cleans up orphan groups and invalid references

---

## File Structure

```
src/
├── App.jsx                          # Main app component
├── index.css                        # Global styles + Tailwind
├── main.jsx                         # Entry point
│
├── components/
│   └── CodeEditor/
│       ├── index.js                 # Exports all components
│       ├── CodeEditor.jsx           # Main editor component (heavily optimized)
│       ├── TabBar.jsx               # Tab bar with drag-and-drop
│       ├── TabContextMenu.jsx       # Right-click menu for tabs
│       ├── GroupLabel.jsx           # Group label with context menu + downloads
│       ├── GroupCreator.jsx         # Inline popup for creating/editing groups
│       ├── ColorPalette.jsx         # Color picker for groups
│       ├── NewFileModal.jsx         # Modal for creating new files
│       ├── DownloadButton.jsx       # Download dropdown (source/PDF)
│       └── TerminalPanel.jsx        # Execution output with history
│
├── services/
│   └── codeExecutionService.js      # Piston API integration
│
└── utils/
    └── downloadUtils.js             # ZIP and PDF generation utilities
```

---

## Key Implementation Details

### Performance Optimizations (CodeEditor.jsx)

The editor was heavily optimized to eliminate cursor lag:

1. **Refs for code storage:** `codeRef.current` holds the latest code without triggering re-renders
2. **Debounced updates:**
   - localStorage save: 2000ms
   - Tab state update: 1000ms  
   - Parent notification: 500ms
3. **Memoized Editor:** Wrapped in `memo()` to prevent unnecessary re-renders
4. **Uncontrolled mode:** Uses `defaultValue` instead of `value` prop
5. **Optimized Monaco options:** Disabled smooth animations, limited suggestions
6. **Cached autocomplete:** Suggestions are cached by prefix

### Tab Grouping Logic

```javascript
// Tab structure
{
  id: "unique_id",
  filename: "main.py",
  language: "python",
  code: "print('hello')",
  groupId: "group_id" | null
}

// Group structure
{
  id: "group_id",
  name: "My Group",
  color: "blue",
  collapsed: false
}
```

### Drag and Drop Events

- `onDragStart`: Sets dragged tab, creates custom drag image
- `onDragOver`: Calculates drop position (before/after), shows indicator
- `onDrop`: Reorders tabs array, updates groupId if needed
- `onDragEnd`: Clears drag state

### Group Validation (on page load)

```javascript
// Remove tabs' groupIds that point to non-existent groups
tabs = tabs.map(tab => {
  if (tab.groupId && !validGroupIds.has(tab.groupId)) {
    return { ...tab, groupId: null };
  }
  return tab;
});

// Remove groups that have no tabs (orphan groups)
tabGroups = tabGroups.filter(group => usedGroupIds.has(group.id));
```

---

## Bugs Fixed

1. **Autocomplete duplication:** Fixed completion provider to calculate correct replacement range
2. **Ghost groups in context menu:** Added validation to remove orphan groups
3. **Group creator position:** Fixed popup to appear near the clicked tab with viewport boundary checks
4. **Cursor lag/stuttering:** Rewrote editor with refs and debouncing
5. **Ctrl+Enter not working:** Added global keyboard listener that works regardless of focus

---

## Dependencies (package.json)

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "@monaco-editor/react": "^4.x",
    "lucide-react": "^0.x",
    "jspdf": "^2.x",
    "jszip": "^3.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "tailwindcss": "^3.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x"
  }
}
```

---

## How to Run

```bash
cd C:\Users\Kapil Kulkarni\.gemini\antigravity\scratch\CodeBuddy
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## What's NOT Yet Implemented (Potential Next Steps)

1. **Real-time collaboration:** Socket.io for multi-user editing
2. **Code snippets library:** Expandable snippet collection
3. **File tree sidebar:** Visual file/folder structure
4. **Themes marketplace:** More editor themes
5. **Custom keybindings:** User-configurable shortcuts
6. **Search and replace:** Global find/replace across files
7. **Git integration:** Version control features
8. **Code formatting:** Prettier/ESLint integration
9. **Debugger:** Step-through debugging
10. **Console input during execution:** Real stdin support
11. **User accounts:** Cloud sync of files
12. **beforeunload handler:** Force-save on page close to prevent data loss

---

## Known Limitations

1. **2-second save delay:** Due to debouncing, very fast refreshes may lose last few characters
2. **No real stdin:** Input is provided upfront, not interactive during execution
3. **Piston API dependency:** Code execution requires internet
4. **No file system access:** Can't read/write local files
5. **Single session:** No cloud backup, data is browser-local only

---

## API Used

### Piston API (Code Execution)
- **Endpoint:** `https://emkc.org/api/v2/piston/execute`
- **Method:** POST
- **Payload:**
```json
{
  "language": "python",
  "version": "*",
  "files": [{ "content": "print('hello')" }],
  "stdin": ""
}
```
- **Response:**
```json
{
  "run": {
    "stdout": "hello\n",
    "stderr": "",
    "code": 0,
    "output": "hello\n"
  }
}
```

---

## Summary for Next Session

This CodeBuddy project is a fully functional browser-based code editor with:
- Monaco editor (VS Code engine)
- Multi-file tabs with drag-and-drop
- Chrome-style tab grouping with colors
- Code execution via Piston API
- Terminal with persistent history
- Download as source or PDF
- All data persisted to localStorage

The codebase is well-structured and the editor is highly optimized for performance. The next session could focus on adding collaboration features, a file tree sidebar, or cloud sync capabilities.
