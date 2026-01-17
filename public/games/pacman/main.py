
import js
import math
import random
from pyodide.ffi import create_proxy

# =============================================================================
# CONSTANTS & ASSETS
# =============================================================================

TILE_SIZE = 16
ROWS = 36
COLS = 28
WIDTH = COLS * TILE_SIZE
HEIGHT = ROWS * TILE_SIZE

# Direction constants
DIR_NONE = 0
DIR_UP = 1
DIR_DOWN = 2
DIR_LEFT = 3
DIR_RIGHT = 4

OPPOSITE = {DIR_UP: DIR_DOWN, DIR_DOWN: DIR_UP, DIR_LEFT: DIR_RIGHT, DIR_RIGHT: DIR_LEFT}

# Colors
BLACK = '#000000'
BLUE = '#1919A6'
WHITE = '#FFFFFF'
YELLOW = '#FFFF00'
PINK = '#FFB8FF'
CYAN = '#00FFFF'
ORANGE = '#FFB852'
RED = '#FF0000'
FRIGHTENED_BLUE = '#2121FF'
FRIGHTENED_WHITE = '#DEDEFF'

# Setup Canvas
canvas = js.document.getElementById('game-canvas-pacman')
canvas.width = WIDTH
canvas.height = HEIGHT
ctx = canvas.getContext('2d')

# Maze Layout
MAZE_TXT = """
X X X X X X X X X X X X X X X X X X X X X X X X X X X X
X X X X X X X X X X X X X X X X X X X X X X X X X X X X
X X X X X X X X X X X X X X X X X X X X X X X X X X X X
0 1 1 1 1 1 1 1 1 1 1 1 1 7 8 1 1 1 1 1 1 1 1 1 1 1 1 0
1 + . . . . + . . . . . + 3 3 + . . . . . + . . . . + 1
1 . 2 3 3 2 . 2 3 3 3 2 . 3 3 . 2 3 3 3 2 . 2 3 3 2 . 1
1 P 3 X X 3 . 3 X X X 3 . 3 3 . 3 X X X 3 . 3 X X 3 P 1
1 . 2 3 3 2 . 2 3 3 3 2 . 2 2 . 2 3 3 3 2 . 2 3 3 2 . 1
1 + . . . . + . . + . . + . . + . . + . . + . . . . + 1
1 . 2 3 3 2 . 2 2 . 2 3 3 3 3 3 3 2 . 2 2 . 2 3 3 2 . 1
1 . 2 3 3 2 . 3 3 . 2 3 3 9 9 3 3 2 . 3 3 . 2 3 3 2 . 1
1 + . . . . + 3 3 + . . + 3 3 + . . + 3 3 + . . . . + 1
0 1 1 1 1 6 . 3 9 3 3 2 | 3 3 | 2 3 3 9 3 . 6 1 1 1 1 0
X X X X X 1 . 3 9 3 3 2 | 2 2 | 2 3 3 9 3 . 1 X X X X X
X X X X X 1 . 3 3 n - - n - - n - - n 3 3 . 1 X X X X X
X X X X X 1 . 3 3 | 4 5 5 = = 5 5 4 | 3 3 . 1 X X X X X
1 1 1 1 1 6 . 2 2 | 5 X X X X X X 5 | 2 2 . 6 1 1 1 1 1
n - - - - - + - - n 5 X X X X X X 5 n - - + - - - - - n
1 1 1 1 1 6 . 2 2 | 5 X X X X X X 5 | 2 2 . 6 1 1 1 1 1
X X X X X 1 . 3 3 | 4 5 5 5 5 5 5 4 | 3 3 . 1 X X X X X
X X X X X 1 . 3 3 n - - - - - - - - n 3 3 . 1 X X X X X
X X X X X 1 . 3 3 | 2 3 3 3 3 3 3 2 | 3 3 . 1 X X X X X
0 1 1 1 1 6 . 2 2 | 2 3 3 9 9 3 3 2 | 2 2 . 6 1 1 1 1 0
1 + . . . . + . . + . . + 3 3 + . . + . . + . . . . + 1
1 . 2 3 3 2 . 2 3 3 3 2 . 3 3 . 2 3 3 3 2 . 2 3 3 2 . 1
1 . 2 3 9 3 . 2 3 3 3 2 . 2 2 . 2 3 3 3 2 . 3 9 3 2 . 1
1 P . + 3 3 + . . + . . + - - + . . + . . + 3 3 + . P 1
8 3 2 . 3 3 . 2 2 . 2 3 3 3 3 3 3 2 . 2 2 . 3 3 . 2 3 7
7 3 2 . 2 2 . 3 3 . 2 3 3 9 9 3 3 2 . 3 3 . 2 2 . 2 3 8
1 + . + . . + 3 3 + . . + 3 3 + . . + 3 3 + . . + . + 1
1 . 2 3 3 3 3 9 9 3 3 2 . 3 3 . 2 3 3 9 9 3 3 3 3 2 . 1
1 . 2 3 3 3 3 3 3 3 3 2 . 2 2 . 2 3 3 3 3 3 3 3 3 2 . 1
1 + . . . . . . . . . . + . . + . . . . . . . . . . + 1
0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0
X X X X X X X X X X X X X X X X X X X X X X X X X X X X
X X X X X X X X X X X X X X X X X X X X X X X X X X X X
"""

WALKABLE_PACMAN = ['.', 'P', 'p', 'n', '+', ' '] # Removed '-' (Ghost House Gate)
WALKABLE_GHOST = ['.', 'P', 'p', 'n', '+', ' ', '-']

# =============================================================================
# INPUT
# =============================================================================
class InputWrapper:
    def check(self, key_str):
        if key_str == 'up': return fast_input.check(0)
        if key_str == 'down': return fast_input.check(1)
        if key_str == 'left': return fast_input.check(2)
        if key_str == 'right': return fast_input.check(3)
        return False
input_state = InputWrapper()

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================
def can_move_from(maze_rows, x, y, direction, is_ghost=False):
    """Check if movement is possible from given position in given direction."""
    gx = int((x + 8) // 16)
    gy = int((y + 8) // 16)
    
    dx, dy = 0, 0
    if direction == DIR_UP: dy = -1
    elif direction == DIR_DOWN: dy = 1
    elif direction == DIR_LEFT: dx = -1
    elif direction == DIR_RIGHT: dx = 1
    
    tgx, tgy = gx + dx, gy + dy
    
    # Tunnel wrap check (Strict - Only Row 17)
    if tgx < 0 or tgx >= COLS:
        if gy == 17: return True
        return False
        
    if tgy < 0 or tgy >= ROWS:
        return False
    if tgy >= len(maze_rows) or tgx >= len(maze_rows[tgy]):
        return False
        
    cell = maze_rows[tgy][tgx]
    
    if is_ghost:
        return cell in WALKABLE_GHOST
    else:
        return cell in WALKABLE_PACMAN
    
    return maze_rows[tgy][tgx] in WALKABLE

# =============================================================================
# GAME CLASSES
# =============================================================================

class Game:
    def __init__(self):
        self.score = 0
        self.level = 1
        self.lives = 3
        self.state = 'READY'
        self.state_timer = 0
        try: js.window.setGameOver(False)
        except: pass
        
        # Frightened mode
        self.frightened_timer = 0
        self.ghost_eat_multiplier = 1
        
        # Score popups for eating ghosts
        self.score_popups = []  # [{x, y, text, timer}]
        
        # Pellet counter for O(1) win check (BUG-007 fix)
        self.pellets_remaining = 0
        
        self.maze_rows = []
        self.renderer = Renderer()
        self.pacman = None
        self.ghosts = []
        
        self.load_level()

    def load_level(self):
        # Parse maze
        self.maze_rows = [line.strip().split() for line in MAZE_TXT.strip().split('\n')]
        
        # Create actors
        self.pacman = Pacman(self)
        self._spawn_ghosts()
        
        # Reset frightened mode
        self.frightened_timer = 0
        self.ghost_eat_multiplier = 1
        
        # Render background
        self.renderer.wall_canvas = None
        self.renderer.create_background(self.maze_rows)
        
        # Count pellets (BUG-007 fix)
        self.pellets_remaining = sum(
            1 for r in range(len(self.maze_rows))
            for c in range(len(self.maze_rows[r]))
            if self.maze_rows[r][c] in ['.', 'P', 'p']
        )

    def _spawn_ghosts(self):
        """Spawn ghosts at verified walkable positions with safe directions."""
        # Verified walkable positions from maze analysis:
        # Row 4 Col 1 = '+', Row 4 Col 26 = '+'
        # Row 31 Col 1 = '+', Row 31 Col 26 = '+'
        self.ghosts = [
            Ghost(self, 1*16, 4*16, RED, DIR_DOWN),        # Red: Top-Left
            Ghost(self, 26*16, 4*16, PINK, DIR_DOWN),      # Pink: Top-Right
            Ghost(self, 1*16, 31*16, CYAN, DIR_UP),        # Cyan: Bottom-Left
            Ghost(self, 26*16, 31*16, ORANGE, DIR_UP)      # Orange: Bottom-Right
        ]
        
        # Apply level-based speed
        base_speed = 1.2
        extra = (self.level - 1) * 0.1
        for g in self.ghosts:
            g.speed = min(base_speed + extra, 2.5)  # Cap speed

    def reset_positions(self):
        """Reset positions after death (keeps score and maze state)."""
        self.pacman = Pacman(self)
        self._spawn_ghosts()
        self.frightened_timer = 0
        self.ghost_eat_multiplier = 1
        self.score_popups = []  # Clear any floating popups

    def start_frightened_mode(self):
        """Activate frightened mode when power pellet is eaten."""
        self.frightened_timer = 600  # ~10 seconds at 60fps
        self.ghost_eat_multiplier = 1
        try: js.window.triggerSFX('powerup')
        except: pass

    def update(self):
        if self.state == 'READY':
            self.state_timer += 1
            if self.state_timer > 120:
                self.state = 'PLAY'
                self.state_timer = 0
                
        elif self.state == 'PLAY':
            # Update frightened timer
            if self.frightened_timer > 0:
                self.frightened_timer -= 1
            
            # Update actors
            self.pacman.update()
            for g in self.ghosts:
                g.update()
            
            # Update score popups
            for popup in self.score_popups:
                popup['timer'] -= 1
                popup['y'] -= 1  # Float upward
            self.score_popups = [p for p in self.score_popups if p['timer'] > 0]
                
            # Win check (O(1) with counter - BUG-007 fix)
            if self.pellets_remaining == 0:
                self.state = 'LEVEL_TRANSITION'
                self.state_timer = 0
                try: js.window.triggerSFX('powerup')
                except: pass
                
        elif self.state == 'LEVEL_TRANSITION':
            self.state_timer += 1
            if self.state_timer > 120:
                self.level += 1
                self.load_level()
                self.state = 'READY'
                self.state_timer = 0
                
        elif self.state == 'DIED':
            self.state_timer += 1
            if self.state_timer > 90:
                self.lives -= 1
                if self.lives < 0:
                    self.state = 'GAMEOVER'
                    try: js.window.setGameOver(True, self.score)
                    except: pass
                    try: js.window.submitScore(self.score)
                    except: pass
                else:
                    self.reset_positions()
                    self.state = 'READY'
                    self.state_timer = 0

    def can_move_grid(self, gx, gy, direction, is_ghost=False):
        """Check if movement is possible from grid coordinates."""
        dx, dy = 0, 0
        if direction == DIR_UP: dy = -1
        elif direction == DIR_DOWN: dy = 1
        elif direction == DIR_LEFT: dx = -1
        elif direction == DIR_RIGHT: dx = 1
        
        tx, ty = gx + dx, gy + dy
        
        # Tunnel wrap (Strict - Row 17)
        if tx < 0 or tx >= COLS:
            if gy == 17: return True
            return False
            
        if ty < 0 or ty >= ROWS: return False
        
        # Check bounds
        if ty >= len(self.maze_rows) or tx >= len(self.maze_rows[ty]):
            return False
            
        cell = self.maze_rows[ty][tx]
        if is_ghost: return cell in WALKABLE_GHOST
        return cell in WALKABLE_PACMAN

    def draw(self):
        # Background
        if self.renderer.wall_canvas:
            ctx.drawImage(self.renderer.wall_canvas, 0, 0)
        
        # Pellets
        for r in range(len(self.maze_rows)):
            for c in range(len(self.maze_rows[r])):
                cell = self.maze_rows[r][c]
                if cell == '.':
                    ctx.fillStyle = PINK
                    ctx.fillRect(c*16 + 6, r*16 + 6, 4, 4)
                elif cell in ['P', 'p']:
                    # Flash power pellets
                    if (js.window.performance.now() // 200) % 2 == 0:
                        ctx.fillStyle = PINK
                        ctx.beginPath()
                        ctx.arc(c*16+8, r*16+8, 6, 0, 6.28)
                        ctx.fill()
        
        # Actors
        self.pacman.draw()
        for g in self.ghosts:
            g.draw()
            
        # HUD
        self._draw_hud()
        
        # Score popups
        ctx.font = '14px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        for popup in self.score_popups:
            ctx.fillStyle = CYAN
            ctx.fillText(popup['text'], popup['x'], popup['y'])

    def _draw_hud(self):
        ctx.fillStyle = WHITE
        ctx.font = '12px "Press Start 2P", monospace'
        ctx.textBaseline = 'top'
        
        # Top row (spaced out)
        ctx.textAlign = 'left'
        ctx.fillText(f"SCORE: {self.score}", 8, 6)
        
        ctx.textAlign = 'right'
        high = 0
        try: high = js.window.gameHighScore or 0
        except: pass
        ctx.fillText(f"TOP: {high}", WIDTH - 8, 6)
        
        # Level in center
        ctx.textAlign = 'center'
        ctx.fillText(f"LVL {self.level}", WIDTH/2, 6)
        
        # Bottom row - Lives (Text + Icons)
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        lives_y = HEIGHT - 16
        ctx.fillText("LIVES:", 10, lives_y)
        
        for i in range(max(0, self.lives)):
            ctx.fillStyle = YELLOW
            ctx.beginPath()
            lx = 85 + i * 24
            ly = lives_y
            ctx.arc(lx + 8, ly, 8, 0.25 * math.pi, 1.75 * math.pi)
            ctx.lineTo(lx + 8, ly)
            ctx.fill()
        
        # State overlays
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        if self.state == 'READY':
            ctx.fillStyle = YELLOW
            ctx.font = '20px monospace'
            ctx.fillText("GET READY!", WIDTH/2, HEIGHT/2 + 48)
        elif self.state == 'LEVEL_TRANSITION':
            ctx.fillStyle = CYAN
            ctx.font = '20px monospace'
            ctx.fillText("LEVEL CLEARED!", WIDTH/2, HEIGHT/2)
        elif self.state == 'DIED':
            ctx.fillStyle = RED
            ctx.font = '20px monospace'
            ctx.fillText("OUCH!", WIDTH/2, HEIGHT/2)
        elif self.state == 'GAMEOVER':
            ctx.fillStyle = RED
            ctx.font = '24px "Press Start 2P", monospace'
            ctx.fillText("GAME OVER", WIDTH/2, HEIGHT/2)


class Renderer:
    def __init__(self):
        self.wall_canvas = None

    def create_background(self, maze_data):
        self.wall_canvas = js.document.createElement('canvas')
        self.wall_canvas.width = WIDTH
        self.wall_canvas.height = HEIGHT
        wctx = self.wall_canvas.getContext('2d')
        
        wctx.fillStyle = BLACK
        wctx.fillRect(0, 0, WIDTH, HEIGHT)
        
        wctx.strokeStyle = BLUE
        wctx.lineWidth = 2
        
        for r in range(len(maze_data)):
            for c in range(len(maze_data[r])):
                cell = maze_data[r][c]
                if cell.isdigit() or cell in ['|', '-', '=']:
                    x, y = c * TILE_SIZE, r * TILE_SIZE
                    wctx.strokeRect(x + 4, y + 4, 8, 8)


class Entity:
    def __init__(self, game, x, y):
        self.game = game
        self.x = float(x)
        self.y = float(y)
        self.dir = DIR_NONE
        self.speed = 1.0

    def get_grid_pos(self):
        return int((self.x + 8) // 16), int((self.y + 8) // 16)
    
    def snap_to_grid(self):
        """Snap position to nearest grid center."""
        gx, gy = self.get_grid_pos()
        self.x = float(gx * 16)
        self.y = float(gy * 16)

    def can_move(self, direction):
        return can_move_from(self.game.maze_rows, self.x, self.y, direction)


class Pacman(Entity):
    def __init__(self, game):
        super().__init__(game, 13 * 16, 26 * 16)
        self.dir = DIR_RIGHT
        self.next_dir = DIR_RIGHT
        self.frame = 0
        self.speed = 2.0

    def update(self):
        # Input
        # Smart Input Priority (Orthogonal Turns)
        u, d, l, r = input_state.check('up'), input_state.check('down'), input_state.check('left'), input_state.check('right')
        
        if self.dir in [DIR_LEFT, DIR_RIGHT]:
            if u: self.next_dir = DIR_UP
            elif d: self.next_dir = DIR_DOWN
            elif l: self.next_dir = DIR_LEFT
            elif r: self.next_dir = DIR_RIGHT
        else:
            if l: self.next_dir = DIR_LEFT
            elif r: self.next_dir = DIR_RIGHT
            elif u: self.next_dir = DIR_UP
            elif d: self.next_dir = DIR_DOWN
        
        gx, gy = self.get_grid_pos()
        center_x = gx * 16
        center_y = gy * 16
        dist_x = self.x - center_x
        dist_y = self.y - center_y
        
        # Turn logic
        if self.next_dir != self.dir:
            is_opposite = OPPOSITE.get(self.next_dir) == self.dir
            near_center = abs(dist_x) < 4 and abs(dist_y) < 4
            
            if is_opposite:
                self.dir = self.next_dir
            elif near_center and self.can_move(self.next_dir):
                self.dir = self.next_dir
                self.snap_to_grid()
        
        # Movement
        if self.dir != DIR_NONE:
            if self.can_move(self.dir):
                if self.dir == DIR_UP: self.y -= self.speed
                elif self.dir == DIR_DOWN: self.y += self.speed
                elif self.dir == DIR_LEFT: self.x -= self.speed
                elif self.dir == DIR_RIGHT: self.x += self.speed
                
                # Tunnel wrap
                if self.x < -8: self.x = WIDTH
                elif self.x > WIDTH: self.x = -8
            else:
                # Align to grid when hitting wall (BUG-004 + BUG-009 fix)
                # Use speed-aware snap to prevent jitter
                if abs(dist_x) < self.speed and abs(dist_y) < self.speed:
                    self.snap_to_grid()
                else:
                    if dist_x > 0: self.x = max(center_x, self.x - self.speed)
                    elif dist_x < 0: self.x = min(center_x, self.x + self.speed)
                    if dist_y > 0: self.y = max(center_y, self.y - self.speed)
                    elif dist_y < 0: self.y = min(center_y, self.y + self.speed)
        
        # Eat pellets
        gx, gy = self.get_grid_pos()
        if 0 <= gy < len(self.game.maze_rows) and 0 <= gx < len(self.game.maze_rows[gy]):
            cell = self.game.maze_rows[gy][gx]
            if cell == '.':
                self.game.maze_rows[gy][gx] = ' '
                self.game.score += 10
                self.game.pellets_remaining = max(0, self.game.pellets_remaining - 1)  # BUG-011 fix
                try: js.window.triggerSFX('score')
                except: pass
            elif cell in ['P', 'p']:
                self.game.maze_rows[gy][gx] = ' '
                self.game.score += 50
                self.game.pellets_remaining = max(0, self.game.pellets_remaining - 1)  # BUG-011 fix
                self.game.start_frightened_mode()

    def draw(self):
        self.frame += 0.25
        
        rot = {DIR_UP: 1.5*math.pi, DIR_DOWN: 0.5*math.pi, 
               DIR_LEFT: math.pi, DIR_RIGHT: 0}.get(self.dir, 0)
        
        ctx.fillStyle = YELLOW
        ctx.beginPath()
        mouth = 0.2 * math.pi * abs(math.sin(self.frame))
        ctx.arc(self.x + 8, self.y + 8, 7, rot + mouth, rot + 2*math.pi - mouth)
        ctx.lineTo(self.x + 8, self.y + 8)
        ctx.fill()


class Ghost(Entity):
    def __init__(self, game, x, y, color, initial_dir):
        super().__init__(game, x, y)
        self.base_color = color
        self.dir = initial_dir
        self.speed = 1.0  # Use integer-friendly base speed if possible, but 1.2 is fine with logic
        
        # Current grid position (integers)
        self.gx = int(x // 16)
        self.gy = int(y // 16)
        
        self.is_eaten = False
        self.respawn_timer = 0
        
        # Ensure initial alignment
        self.snap_to_grid()

    def update(self):
        if self.game.state != 'PLAY':
            return
        
        # Handle respawn
        if self.is_eaten:
            self.respawn_timer -= 1
            if self.respawn_timer <= 0:
                self.respawn_timer = 0
                self.is_eaten = False
            return

        # 1. COLLISION
        dx = self.x - self.game.pacman.x
        dy = self.y - self.game.pacman.y
        if dx*dx + dy*dy < 100:
            self._handle_collision()
            return

        # 2. MOVEMENT LOOP
        remaining_dist = self.speed * (0.5 if self.game.frightened_timer > 0 else 1.0)
        
        # Current Tile Center
        curr_tile_x = self.gx * 16
        curr_tile_y = self.gy * 16
        
        # Distance to center
        dist_to_center = 0
        moving_to_center = False
        
        if self.dir == DIR_UP:
            dist_to_center = self.y - curr_tile_y
            moving_to_center = (self.y > curr_tile_y)
        elif self.dir == DIR_DOWN:
            dist_to_center = curr_tile_y - self.y
            moving_to_center = (self.y < curr_tile_y)
        elif self.dir == DIR_LEFT:
            dist_to_center = self.x - curr_tile_x
            moving_to_center = (self.x > curr_tile_x)
        elif self.dir == DIR_RIGHT:
            dist_to_center = curr_tile_x - self.x
            moving_to_center = (self.x < curr_tile_x)
            
        # Check overshoot
        if moving_to_center and dist_to_center <= remaining_dist:
            # We hit the center!
            self.x = float(curr_tile_x)
            self.y = float(curr_tile_y)
            
            # Consume distance
            remaining_dist -= dist_to_center
            
            # DECIDE NEW DIRECTION
            self._choose_direction()
            
        # Apply Movement (remaining distance)
        if self.dir == DIR_UP: self.y -= remaining_dist
        elif self.dir == DIR_DOWN: self.y += remaining_dist
        elif self.dir == DIR_LEFT: self.x -= remaining_dist
        elif self.dir == DIR_RIGHT: self.x += remaining_dist
        
        # Clamp drift
        if self.dir in [DIR_UP, DIR_DOWN]: self.x = float(curr_tile_x)
        elif self.dir in [DIR_LEFT, DIR_RIGHT]: self.y = float(curr_tile_y)
        
        # Recalculate grid coords for next frame logic
        self.gx = int((self.x + 8) // 16)
        self.gy = int((self.y + 8) // 16)

        # 3. TUNNEL WRAP
        if self.x < -8: 
            self.x = WIDTH
            self.gx = COLS
        elif self.x > WIDTH: 
            self.x = -8
            self.gx = -1



    def _choose_direction(self):
        # Available Exits
        exits = []
        for d in [DIR_UP, DIR_DOWN, DIR_LEFT, DIR_RIGHT]:
            # Don't reverse!
            if d == OPPOSITE.get(self.dir):
                continue
            # Check maze wall at (gx + dx, gy + dy)
            if self.game.can_move_grid(self.gx, self.gy, d, is_ghost=True):
                exits.append(d)
                
        # Handle Dead End (only reverse available)
        if not exits:
            # Check if reverse is possible (should be unless 1x1 hole)
            reverse = OPPOSITE.get(self.dir)
            if self.game.can_move_grid(self.gx, self.gy, reverse, is_ghost=True):
                self.dir = reverse
            else:
                self.dir = DIR_NONE # Truly stuck?
            return

        # Target Tile Logic
        target_x, target_y = self.game.pacman.x, self.game.pacman.y
        
        frightened = self.game.frightened_timer > 0
        
        if frightened:
            # Random Choice
            self.dir = random.choice(exits)
        else:
            # Target Chasing
            # Sort exits by distance to target
            # Note: We look at the CENTER of the candidate neighbor tile
            best_dir = exits[0]
            min_dist = float('inf')
            
            # Scatter logic could go here (alternate target per ghost)
            
            for d in exits:
                dx, dy = 0, 0
                if d == DIR_UP: dy = -16
                elif d == DIR_DOWN: dy = 16
                elif d == DIR_LEFT: dx = -16
                elif d == DIR_RIGHT: dx = 16
                
                # Predict position: Current Tile Center + Offset
                tx = (self.gx * 16) + dx
                ty = (self.gy * 16) + dy
                
                dist = (tx - target_x)**2 + (ty - target_y)**2
                
                if dist < min_dist:
                    min_dist = dist
                    best_dir = d
                elif dist == min_dist:
                    # Tie-breaker: Up > Left > Down > Right (Standard Pac-Man)
                    # Or random to avoid loops?
                    # Let's use priority list for standard feel
                    priority = [DIR_UP, DIR_LEFT, DIR_DOWN, DIR_RIGHT]
                    if priority.index(d) < priority.index(best_dir):
                        best_dir = d
            
            self.dir = best_dir

    def draw(self):
        if self.is_eaten: return
        
        x, y = self.x, self.y
        
        # Color
        color = self.base_color
        if self.game.frightened_timer > 0:
             if self.game.frightened_timer < 120 and (self.game.frightened_timer // 15) % 2:
                 color = FRIGHTENED_WHITE
             else:
                 color = FRIGHTENED_BLUE
        
        ctx.fillStyle = color
        
        # Body
        ctx.beginPath()
        ctx.arc(x + 8, y + 6, 7, math.pi, 0)
        ctx.lineTo(x + 15, y + 14)
        ctx.lineTo(x + 13, y + 12)
        ctx.lineTo(x + 11, y + 14)
        ctx.lineTo(x + 8, y + 12)
        ctx.lineTo(x + 5, y + 14)
        ctx.lineTo(x + 3, y + 12)
        ctx.lineTo(x + 1, y + 14)
        ctx.closePath()
        ctx.fill()
        
        # Eyes
        ctx.fillStyle = WHITE
        ctx.beginPath()
        ctx.arc(x + 5, y + 5, 2.5, 0, 6.28)
        ctx.arc(x + 11, y + 5, 2.5, 0, 6.28)
        ctx.fill()
        
        # Pupils
        if self.game.frightened_timer == 0:
            ctx.fillStyle = BLUE
            ctx.beginPath()
            px = {DIR_LEFT: -1, DIR_RIGHT: 1}.get(self.dir, 0)
            py = {DIR_UP: -1, DIR_DOWN: 1}.get(self.dir, 0)
            ctx.arc(x + 5 + px, y + 5 + py, 1.2, 0, 6.28)
            ctx.arc(x + 11 + px, y + 5 + py, 1.2, 0, 6.28)
            ctx.fill()

    def _handle_collision(self):
        if self.game.frightened_timer > 0:
            bonus = 200 * self.game.ghost_eat_multiplier
            self.game.score += bonus
            self.game.ghost_eat_multiplier = min(self.game.ghost_eat_multiplier * 2, 16)
            self.is_eaten = True
            self.respawn_timer = 180
            
            respawns = {RED: (1,4), PINK: (26,4), CYAN: (1,31), ORANGE: (26,31)}
            gx, gy = respawns.get(self.base_color, (1,4))
            self.x, self.y = gx*16, gy*16
            self.gx, self.gy = gx, gy # Sync grid coords
            self.dir = DIR_UP if gy > 15 else DIR_DOWN
            
            self.game.score_popups.append({'x':self.x, 'y':self.y, 'text':f'+{bonus}', 'timer':60})
            try: js.window.triggerSFX('score')
            except: pass
        else:
            self.game.state = 'DIED'
            self.game.state_timer = 0
            try: js.window.triggerSFX('die')
            except: pass


# =============================================================================
# MAIN LOOP
# =============================================================================

game = Game()

# PM7-003 fix: Store proxy references for cleanup
_proxy_loop = None
_proxy_reset = None

def reset_game():
    """Reset game for replay."""
    global game, _proxy_loop
    game = Game()
    js.window.requestAnimationFrame(_proxy_loop)

def loop(t):
    game.update()
    game.draw()
    if game.state != 'GAMEOVER':
        js.window.requestAnimationFrame(_proxy_loop)

# Create proxies once and reuse
_proxy_loop = create_proxy(loop)
_proxy_reset = create_proxy(reset_game)
js.window.reset_game = _proxy_reset
js.window.requestAnimationFrame(_proxy_loop)
