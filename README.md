# Retro Arcade Web OS - Comprehensive Documentation

A retro-futuristic "Web OS" interface built with React and Pyodide, featuring a suite of classic arcade games running directly in the browser via Python. This project bridges modern React components with a Python-based game engine using WebAssembly.

---

## 📂 Project Structure & File Guide

This section provides a detailed explanation of every key file in the codebase.

### **1. Root Configuration & Bootstrapping**

*   **`index.html`**: The main entry point. Sets up the root DOM node (`#root`), imports the "Press Start 2P" and "VT323" fonts, and links to `src/main.tsx`.
*   **`src/main.tsx`**: The React entry point. Mounts the `<App />` component into `index.html`.
*   **`src/App.tsx`**: The core "Operating System" kernel.
    *   Manages global state: `windows` (open apps), `isMobile` (responsive mode), `isBooting`.
    *   Handles the Window Manager logic: `openWindow`, `closeWindow`, `minimizeWindow`, `bringToFront`.
    *   Renders the desktop layout: Background video, `Sidebar`, `ContentWindow` (desktop icons), and the floating `WindowFrame` components for each open app.
    *   Initializes the `usePyodide` hook to load Python.

### **2. Core Components (`src/components/`)**

#### **Layout**
*   **`src/components/layout/Sidebar.tsx`**: The left-hand navigation bar (or mobile menu). Contains buttons to launch apps.
    *   Uses a `games` array config to generate launcher buttons with icons.
*   **`src/components/layout/Taskbar.tsx`**: The bottom bar showing currently open windows. allows minimizing/restoring apps.
*   **`src/components/layout/ContentWindow.tsx`**: The main desktop area container.
    *   Switches between modes: `ABOUT`, `TECH_STACK`, `CONTROLS`, displaying different static content "pages".
*   **`src/components/layout/AvatarPanel.tsx`**: The right-side panel featuring the animated "Office Assistant" avatar (Inzi the Bug).
*   **`src/components/layout/ScoresContent.tsx`**: Renders the Global High Score leaderboard (fetched from Firebase).

#### **UI (User Interface)**
*   **`src/components/ui/WindowFrame.tsx`**: A reusable wrapper for all apps.
    *   Provides the "Window" look: borders, title bar, minimize/close buttons.
    *   Handles **Draggable** logic (using mouse events to update X/Y coordinates).
*   **`src/components/ui/ChatBox.tsx`**: The "talk bubble" for the avatar. Displays random messages or reactive text.
*   **`src/components/ui/BootScreen.tsx`**: The initial BIOS-style loading sequence.
    *   Simulates memory checks and hardware initialization text before showing the desktop.
*   **`src/components/ui/MobileControls.tsx`**: On-screen D-Pad and Action buttons for playing games on touch devices.
    *   Dispatches keyboard events (`ArrowUp`, `Space`, etc.) so Python games don't need special mobile logic.

#### **FX (Visual Effects)**
*   **`src/components/fx/Animations.tsx`**:
    *   `Scanline`: An overlay div with CSS pointer-events: none to create the CRT TV line effect.
    *   `Particles`: A canvas-based particle system for background ambience.
*   **`src/components/fx/AnimatedSpriteAvatar.tsx`**: Handles the sprite sheet animation for the helper character.

### **3. Applications (`src/apps/`)**

*   **`src/apps/ShellApps.tsx`**: Contains the React code for the simple "Mock" apps:
    *   `Calculator`: Standard JS math evaluation.
    *   `Notepad`: A simple textarea with local storage.
    *   `Terminal`: A fake command-line interface that responds to `help`, `dir`, `echo`.
*   **`src/apps/PyodideRunner.tsx`**: **CRITICAL COMPONENT**.
    *   This is the bridge between React and Python.
    *   It accepts a `scriptName` prop (e.g., "tetris").
    *   Fetches the Python file from `public/games/`.
    *   Executes it using `pyodide.runPython()`.
    *   Sets up the `requestAnimationFrame` loop calling the Python `loop()` function.
    *   Handles cleanup (canceling animation frames) when the window closes.

### **4. Game Engine (Python via Pyodide)**

All games reside in `public/games/` and run in the browser's main thread via WebAssembly.

*   **`public/games/_common/game_utils.py`**: Shared helper functions for games (collision detection basics, etc.).

#### **Tetris (`public/games/tetris/main.py`)**
*   **`Game` Class**: Manages the board state (10x20 grid), current piece, and score.
*   **`Renderer`**: Uses HTML5 Canvas API (via `js.document`) to draw blocks.
*   **Key Features**:
    *   Custom rotation system (SRS-lite).
    *   Leveling system: Level up every 2 lines.
    *   Bag Randomizer: Ensures fair distribution of pieces.

#### **Snake (`public/games/snake/main.py`)**
*   A simpler grid-based game. Maintains a list of coordinate tuples for the snake body.

#### **Breakout (`public/games/breakout/main.py`)**
*   **Physics**: Ball reflection logic against paddle and bricks.
*   **Levels**: Defines arrays of brick patterns (Pyramids, Checkerboards).

#### **Space Invaders (`public/games/spaceinvaders/main.py`)**
*   **Entity Management**: Tracks lists of Enemy objects and Bullet objects.
*   **State Machine**: Different movement states for enemies (March Right -> Drop -> March Left).

#### **Chess (`public/games/chess/engine.py` & `main.py`)**
*   **`engine.py`**: A pure Python chess logic engine.
    *   Move generation (Pawn pushes, Knights L-shape, Sliding pieces).
    *   Check/Checkmate validation.
*   **`main.py`**: The visual layer handling clicks and drawing the board.

### **5. Services & Architecture (`src/services/`)**

*   **`src/hooks/usePyodide.ts`**: A React Hook that initializes Pyodide.
    *   Downloads the Pyodide wasm binary.
    *   Installs packages (if needed, though we mostly use standard lib).
    *   Exposes the `window.pyodide` object globally for games to access.
*   **`src/services/AudioBus.ts`**: A singleton audio manager.
    *   Preloads sound effects (`sfx/`).
    *   Handles Background Music (BGM) playback with looping and volume control.
*   **`src/services/ScoreService.ts`**: Interface for Firebase Firestore.
    *   `submitScore(game, score)`: Saves high scores.
    *   `getHighScores(game)`: Fetches top 10 scores.

### **6. Styles**

*   **`src/styles/global.css`**: The monolithic CSS file styling the entire "OS".
    *   **Variables**: Defines the neon color palette (`--primary: #00ff41`).
    *   **Components**: Styles for Windows, Scrollbars (custom webkit styles), and Typography.
    *   **Fonts**: Imports "Press Start 2P" and "VT323" from Google Fonts.

### **7. Scripts**

*   **`scripts/generate_printable_code.py`**: A utility script.
    *   Scans the project directory.
    *   Concatenates all source files into `printable_code.txt`.
    *   Respects `.gitignore` rules (excludes node_modules, build artifacts).

---

## 🚀 Setup Instructions

1.  **Prerequisites**: Node.js 18+ installed.
2.  **Install**: `npm install`
3.  **Run**: `npm run dev` (Opens local server at http://localhost:5173)
4.  **Build**: `npm run build` (Outputs static files to `dist/`)

## 🛠️ Modifying Games
To change game logic, edit the `.py` files in `public/games/`. You **do not** need to recompile React code; simply refresh the browser, as Python files are fetched at runtime.
