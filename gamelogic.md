# Deep Dive: How the Games Actually Work

This document explains the logic behind each game in the Arcade. It avoids complex code and focuses on the "rules" and "step-by-step thinking" the computer does to make the game fun.

---

## 1. The Core Concept: The "Game Loop"

Before looking at specific games, you must understand the heartbeat of every video game: **The Loop**.

Imagine a flipbook animation. To make it move, you have to flip the pages fast. A video game does the same thing, usually **60 times every second**.

In every single "tick" (1/60th of a second), the computer does three things in this exact order:

1.  **INPUT (The Ears)**: The computer asks, "Did the player press a button right now?"
2.  **UPDATE (The Brain)**: The computer calculates the new reality. "The car was at position 10, speed is 5, so now it is at position 15." "Did the car hit a wall? If yes, stop it."
3.  **DRAW (The Eyes)**: The computer wipes the screen clean and paints the new picture based on the calculations from step 2.

This happens so fast that your brain sees smooth movement.

---

## 2. 🐍 Snake: The Logic of a Growing Train

Snake is physically simple because it lives on a **Grid**.

### The Body as a List
The computer doesn't see a "snake." It sees a list of coordinates (X, Y numbers).
*   Imagine a piece of graph paper.
*   The snake is a list: `[(5, 5), (5, 6), (5, 7)]`.
*   `(5, 5)` is the Head. `(5, 7)` is the Tail.

### How it Moves
Every "update" tick (which happens slower in Snake, maybe 5 times a second):
1.  **Calculate New Head**: The computer looks at the current Head `(5, 5)` and the Direction (e.g., "UP").
2.  **Create New Head**: It creates a new coordinate at `(5, 4)` (because moving up means Y gets smaller).
3.  **Add to List**: It puts `(5, 4)` at the front of the list. Now the snake has 4 segments.
4.  **Cut the Tail**: To keep the snake the same length, it deletes the very last item in the list `(5, 7)`.
    *   *Result*: The whole snake appears to have moved forward one step.

### How it Eats
When the new head lands on the exact same square as the **Food**:
1.  **Don't Cut the Tail**: The computer skips step 4 above.
2.  **Result**: Since we added a new head but *didn't* remove the tail, the list is now one item longer. The snake has grown!

### Death Logic
The computer asks two questions every tick:
1.  "Is the head outside the grid?" (Hit a wall).
2.  "Is the head coordinate the same as any *other* coordinate already in my body list?" (Hit itself).
If "Yes" to either, Game Over.

---

## 3. 🧱 Tetris: Gravity and Locking

Tetris is a game of managing a **Matrix** (a 10x20 grid of numbers). `0` is empty space. `1-7` are different colors.

### The Falling Piece
The active piece is "floating" separately from the background grid. It has:
*   **Shape**: A design like a "T" or "L".
*   **Position**: An X and Y coordinate (e.g., top-center).
*   **Timer**: A counter that ticks down. When it hits zero, the piece moves `Y + 1` (Down).

### Collision (The "Can I Go There?" Check)
Before moving the piece (left, right, or down), the computer "imagines" the move:
1.  "If I move this piece to the right, will any of its blocks overlap with a wall?"
2.  "Will any block overlap with a block that is already stuck in the grid?"
If the answer is "Yes," the move is cancelled. The piece stays put.

### Locking and Clearing
When a piece tries to move down but hits something (the floor or another block):
1.  **Lock**: The floating piece stops being a "piece." Its blocks are stamped permanently into the Grid Matrix.
2.  **Scan**: The computer checks every single row from bottom to top.
3.  **Clear**: If a row has *no* zeros (it is full), that row is deleted.
4.  **Gravity**: All rows *above* the deleted line are moved down by one step to fill the gap.

---

## 4. 🎾 Breakout: Angles and Rectangles

Breakout uses **float physics** (smooth numbers like 10.5, not integers).

### The Ball
The ball has a **Velocity** (Speed).
*   `VX`: Speed Horizontal (Left/Right)
*   `VY`: Speed Vertical (Up/Down)
*   Every frame, `Position = Position + Velocity`.

### The Bounce Logic
When the ball hits something, it doesn't just stop. It reflects.
*   **Hitting a Wall**: If the ball goes too far left (`X < 0`), we reverse `VX` (`VX = -VX`). It now moves right.
*   **Hitting the Ceiling**: If `Y < 0`, reverse `VY`. It now moves down.

### The Paddle Spin (Advanced Logic)
If the ball just bounced perfectly mathematically, the game would be boring. We add "English" (Spin):
*   If the ball hits the *center* of the paddle, it bounces normally.
*   If the ball hits the *edge* of the paddle, the computer adds extra interactions to make it shoot off at a sharp angle. This lets the player "aim" the ball.

---

## 5. 🟡 Pac-Man: Pathfinding and Personality

Pac-Man logic is famous because the ghosts aren't just random; they have "personalities."

### The Grid vs. The Pixel
Pac-Man moves smoothly (pixels), but the maze is a Grid (tiles).
*   **Cornering**: You can't turn perfectly at any pixel. The game waits until Pac-Man is exactly in the *center* of a tile before letting him turn 90 degrees. This makes the movement feel "snappy" and clean.

### Ghost AI (Artificial Intelligence)
Each ghost has a different "Target Tile" it wants to reach:
1.  **Blinky (Red)**: Target = Pac-Man's exact location. (He chases you directly).
2.  **Pinky (Pink)**: Target = 4 tiles *in front* of Pac-Man. (She tries to ambush you).
3.  **Inky (Cyan)**: Uses complex math involving Blinky and Pac-Man to try and pinch you.
4.  **Clyde (Orange)**: Chases you like Blinky, until he gets too close. Then he gets scared and runs to his corner.

They switch between "Chase Mode" and "Scatter Mode" (running to their corners) every few seconds, which gives the player a breathing room.

---

## 6. 👾 Space Invaders: The Hive Mind

Space Invaders logic is unique because the enemies act as one giant unit.

### The Group Movement
The computer doesn't move 50 aliens individually. It moves "The Group."
*   Variable: `GroupDirection` (1 = Right).
*   Every few frames, all aliens move `X + GroupDirection`.

### The Edge Check
When the *rightmost* alien hits the wall:
1.  **Stop**: The entire group stops moving sideways.
2.  **Drop**: Every single alien moves down (`Y + 20`).
3.  **Flip**: `GroupDirection` becomes -1 (Left).
This creates the iconic "March, Drop, Reverse" pattern.

### The Pixel Shield
The shields are not simple objects. They are drawn as thousands of tiny pixels.
*   **Eraser Bullets**: When an alien laser hits a shield, the computer doesn't destroy the shield. It literally draws a black circle *on top* of the shield image logic.
*   This "erases" the green pixels, creating realistic, jagged holes.

---

## 7. ♟️ Chess: The Tree of Possibilities

Chess is the logic heavyweight. It relies on a "State Machine."

### Validation (The Referee)
You generally cannot just move a piece physically. When you pick up a Knight, the computer runs a loop:
1.  "Where can a Knight move mathematically?" (The 'L' shapes).
2.  "Are those spots inside the board?"
3.  "Is there a friend on that spot?" (Blocked).
4.  "If I move there, will my King be in danger?" (Illegal Move).

### The Checkmate Scan
After every single move, the computer scans the entire board:
1.  "Is the King currently under attack?" (Check).
2.  "Can the King move to safety?"
3.  "Can another piece block the attack?"
4.  "Can the attacker be eaten?"
If the answer is **NO** to all three, it raises the "Checkmate" flag and ends the game.
