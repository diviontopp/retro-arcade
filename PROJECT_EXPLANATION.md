# The Virtual Retro Computer: A Complete Project Guide

## 1. Introduction: What is this?
Welcome to the internal workings of the **Retro Arcade Web OS**. 

To a user, this looks like a cool retro computer screen running inside their web browser. They can drag windows, open apps, and play games. 

To a developer, this is a **complex magic trick**. It combines two completely different programming worlds:
1.  **React (JavaScript/TypeScript)**: This builds the "body" of the computer—the windows, the taskbar, the buttons, and the visual effects.
2.  **Pyodide (Python)**: This provides the "soul" of the games. It allows standard Python code (normally used for data science or backends) to run directly inside the browser.

This guide explains **every single part** of this system in simple terms.

---

## 2. The Architecture: How the "OS" Works

### The Blueprint (`ARCHITECTURE.md`)
Think of `ARCHITECTURE.md` as the master blueprint for the building. It explains the "rules" of the system, like:
*   "Every window must have an ID."
*   "Sound effects must go through the central audio manager."
*   "Games must run in their own secure room (iframe) so they don't break the rest of the house."

### The Brain (`src/App.tsx`)
This file is the CEO of the company. It handles the big decisions:
*   **Booting Up**: When you visit the site, it shows the "Boot Screen" (black text scrolling) before showing the desktop.
*   **Window Management**: It keeps a list of every open window. If you ask for "Snake", it adds Snake to the list. If you click "X", it removes it.
*   **Device Detection**: It checks if you are on a phone or a laptop and changes the layout (mouse vs. touch) accordingly.

### The Window System (`src/components/ui/WindowFrame.tsx`)
This is the "container" for every app. It's like a picture frame that can hold anything.
*   **Draggable**: It listens for mouse clicks on the top bar. If you hold and move the mouse, it calculates the difference and moves the window.
*   **Resizable**: It watches the corners. if you drag them, it stretches the content.
*   **Portals**: It uses a React trick called a "Portal" to make sure windows can float *above* everything else, even if they were created deep inside another menu.

### The Bridge (`src/hooks/usePyodide.ts` & `PyodideRunner.tsx`)
This is the most strictly complex part, simplified:
*   **The Problem**: Browsers understand JavaScript. They do *not* understand Python.
*   **The Solution**: We download a tool called **Pyodide**. This is a version of Python translated into WebAssembly (a language browsers *do* understand).
*   **The Isolation**: We don't just run the game in the main window. We create a generic HTML page (`game_runner.html`) inside an **iframe** (a window within a window). 
*   **The Communication**: The React app sends a message: *"Hey, load snake.py!"*. The iframe receives it, tells Pyodide to run that code, and then sends messages back like *"Grid updated!"* or *"Play beep sound!"*.

---

## 3. The Games: How They Work (The Python Arcade)

All games live in `public/games/`. Each game has a `main.py` file. Here is exactly how they work.

### General Concept: The "Game Loop"
Every game follows the same heartbeat, happening 60 times every second:
1.  **Input**: "Did the user press a key?"
2.  **Update**: "Move the character, check if they hit a wall, update score."
3.  **Draw**: "Erase the screen and paint the new picture."

### 🍎 Snake (`snake/main.py`)
*   **The World**: A grid of invisible squares (32x32 pixels).
*   **The Snake**: A list of coordinates (e.g., `[(10,10), (10,11), (10,12)]`). The first item is the head.
*   **Movement**: Every few milliseconds, we take the head, calculate the next square based on direction, and add it to the list. We remove the last item (the tail).
*   **Eating**: If the head lands on the same square as the food, we *don't* remove the tail. This makes the snake grow by 1 square.
*   **Death**: If the head coordinates match any coordinate already in the body list, you crashed.

### 🧱 Tetris (`tetris/main.py`)
*   **The Board**: A generic grid (10 columns, 20 rows). `0` means empty, numbers represent colors.
*   **The Shapes**: Each piece (Tetromino) is defined as a list of offsets (e.g., a Square is `[(0,0), (1,0), (0,1), (1,1)]`).
*   **Gravity**: A timer counts down. When it hits zero, the piece moves down Y+1.
*   **Rotation**: We use math to "rotate" the coordinates around a center point (switching X and Y).
*   **Line Clearing**: After a piece lands, we check every row. If a row has no `0`s (empty spots), we delete that row from the list and insert a new blank row at the top.

### 🎾 Breakout (`breakout/main.py`)
*   **Physics**: Unlike Snake/Tetris, this uses smooth movement (float numbers), not a grid.
*   **The Ball**: Has an X and Y speed. Every frame, `x = x + speed_x`.
*   **Bouncing**: 
    *   If `x < 0` (left wall), we flip the X speed (`speed_x = -speed_x`).
    *   If it hits the paddle, we calculate *where* it hit. Hitting the edge of the paddle makes the ball bounce at a sharper angle.
*   **The Bricks**: A simple list. Every frame, we check "Is the ball's rectangle touching the brick's rectangle?" If yes, hide the brick and reverse the ball's Y speed.

### 🟡 Pac-Man (`pacman/main.py`)
*   **The Map**: A text-based grid where `#` is a wall and `.` is a pellet.
*   **Movement**: Pac-Man moves smoothly (pixel by pixel), but he "snaps" to the grid grid centers so he fits perfectly in the corridors.
*   **The Ghosts**: They have three brains (States):
    1.  **Chase**: Calculate distance to Pac-Man. Pick the path that makes that distance smaller.
    2.  **Scatter**: Ignore Pac-Man, run to their home corner.
    3.  **Frightened**: Pick a random direction at every intersection.
*   **Win Condition**: A counter tracks pellets. When it hits 0, level up.

### 👾 Space Invaders (`spaceinvaders/main.py`)
*   **The Formation**: A list of enemies who move together. They share a `direction` (1 for right, -1 for left).
*   **The March**: When the group hits the right edge of the screen, the *entire group* moves down and flips direction to left.
*   **Shooting**:
    *   **Player**: Can only shoot one bullet at a time.
    *   **Invaders**: Randomly choose to shoot back based on a timer. The timer gets shorter (faster) as you level up.
*   **Shields**: These are drawn pixel-by-pixel. When a bullet hits a shield, we literally "erase" a circle of pixels from the shield image, making it look damaged.

### ♟️ Chess (`chess/main.py`)
*   **The Engine**: This is the most complex math. It doesn't just move pieces; it simulates the board state.
*   **Valid Moves**: When you click a Knight, the code asks: "What are all L-shapes from here? Which ones are off-board? Which ones are blocked by my own team? Does this move leave my King in danger?"
*   **Checkmate**: Every turn, it checks: "Is the King under attack? Can he move? Can anyone block? Can anyone capture the attacker?" If no to all, Game Over.

---

## 4. The Project Structure: "The Directory Map"

### `src/` (The Application Source)
*   `apps/` - The logic for simple apps (Notepad, Calculator) and the Game Runner.
*   `components/`
    *   `layout/` - Sidebar, Taskbar, Desktop icons.
    *   `ui/` - Buttons, Windows, Text Boxes.
    *   `fx/` - Visual effects (CRT scanlines, click ripples).
*   `hooks/` - Special helper functions (like "usePyodide" to load Python).
*   `services/` - Background workers (Audio manager, Score database).
*   `styles/` - The CSS files that determine colors (Green/Black).

### `public/` (The Static Gallery)
*   `games/` - The Python code and images for all games (explained above).
*   `icons/` - The little pixel-art icons for the desktop.
*   `fonts/` - The retro pixel fonts.
*   `audio/` - Sound effect files (.mp3, .wav).
*   `game_runner.html` - The blank template used to run the games.

### Root Files (The Logic Config)
*   `package.json`: The "Shopping List" of code libraries the project needs.
*   `vite.config.ts`: The "Factory Machine" that builds the final website.
*   `tsconfig.json`: The "Grammar Rules" for the code (TypeScript).

---

## 5. Summary
This project is a **hybrid**.
*   **React** acts as the Operating System/Desktop.
*   **Python** acts as the Software Cartridges.
*   **Pyodide** is the Console that lets the Cartridges run on the Desktop.
