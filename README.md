# Retro Arcade Web OS

A retro-futuristic "Web OS" interface built with React and Pyodide, featuring a suite of classic arcade games running directly in the browser via Python.

## 🌟 Overview

This project reimplements the experience of a classic desktop environment (Windows 95/98 aesthetic with a cyberpunk twist) entirely in the web browser. It features:
- A fully functional **Window System** (drag, minimize, focus management).
- **Python-based Games** running smoothly in the browser using WebAssembly (Pyodide).
- A **CRT/scanline aesthetic** with highly polished UI animations.
- **Responsiveness**: Works on Desktop and Mobile (with specialized touch controls).

## 🚀 Technology Stack

- **Frontend Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Vanilla CSS (No Tailwind) for maximum control over retro aesthetics.
- **Python Runtime**: Pyodide (Runs Python game logic in the browser).
- **Backend/Data**: Firebase (Firestore for Leaderboards).

## 🎮 Included Games

All games are written in Python and rendered via HTML5 Canvas using a custom bridge.

1.  **Tetris**:
    *   Authentic NES mechanics (DAS, rotation systems).
    *   Level up every 2 lines.
    *   "Z" key rotates clockwise.
    *   Score multipliers (T-Spins, Combos).

2.  **Snake**:
    *   Classic gameplay.
    *   Smooth grid movement.

3.  **Breakout**:
    *   Progressive levels with different brick patterns.
    *   Power-up logic and physics-based ball deflection.

4.  **Space Invaders**:
    *   Classic enemy march patterns.
    *   Destructible shields.

5.  **Chess**:
    *   Full chess engine implementation in Python.
    *   Move validation, check/checkmate detection.

## 🛠️ Architecture

### Pyodide Bridge
The core innovation of this project is the seamless integration between React and Python.
*   `usePyodide.ts`: A custom hook that loads the Pyodide runtime once.
*   `PyodideRunner.tsx`: A wrapper component that loads a Python script, mounts a Canvas, and binds input events.
*   **Interop**: JavaScript calls Python functions for the game loop (`loop()`), and Python calls JavaScript for rendering (`ctx.fillRect`) and audio (`triggerSFX`).

### Directory Structure
```
/public/games/       # Python source code for games
/src/components/     # specific React UI components
  /layout/           # Windows, Sidebar, Taskbar
  /ui/               # Generic UI elements (WindowFrame, ChatBox)
  /fx/               # Visual effects (CRT scanlines, Particles)
/src/apps/           # Application logic (Mock apps: Calculator, Notepad, etc.)
/scripts/            # Utility scripts (e.g., printable code generator)
```

## 📦 Setup & Development

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```

## 🎨 Design Philosophy
*   **Aesthetics First**: Every pixel counts. The UI uses "Press Start 2P" and "VT323" fonts, neon greens, and stark blacks to evoke a hacker/cyberpunk vibe.
*   **Immersive**: Background video, ambient audio, and sound effects for every interaction.

---
*Created by Antigravity*
