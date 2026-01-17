import js
import math
import random
from pyodide.ffi import create_proxy

# =============================================================================
# CONSTANTS & CONFIG
# =============================================================================

CANVAS_WIDTH = 512
CANVAS_HEIGHT = 448

SCALE = 2 # 256x224 -> 512x448

# Layout (Based on NES Reference)
# Canvas is 32x28 tiles (16px each)
# Playfield: X=192, Y=80, W=160 (10 blocks * 16), H=320 (20 blocks * 16)
# Actually, let's align carefully.
# Reference image layout logic:
# Left Panel (Stats):
#   X=32, Y=88, W=128, H=272
#   Header "STATISTICS"
#   Content: Tetrominoes + Counts

# Playfield Frame:
#   X=190, Y=80. Inner Board starts at 192, roughly.
#   Let's centre the board horizontally? 512/2 = 256. Board is 160w. 
#   NES 256px wide. Board is center-right.
#   Let's use specific coords for 512 width.

# Revised Layout
PLAYFIELD_X = 192
PLAYFIELD_Y = 88 # Lower to fit top bars
PLAYFIELD_W = 162 # 10*16 + border
PLAYFIELD_H = 322 # 20*16 + border

GRID_ORIGIN_X = PLAYFIELD_X + 1
GRID_ORIGIN_Y = PLAYFIELD_Y + 1
GRID_CELL_SIZE = 16 # Full 16px blocks
ROWS = 20
COLS = 10

# Left
STATS_X = 24
STATS_Y = 80 # Moved up slightly
STATS_W = 144
STATS_H = 345 # Adjusted height

# Right
RIGHT_X = 376
RIGHT_W = 112

# Top
ATYPE_X = 40
ATYPE_Y = 24
ATYPE_W = 112
ATYPE_H = 48

LINES_X = 176
LINES_Y = 24
LINES_W = 192
LINES_H = 48

SCORE_X = 376
SCORE_Y = 24
SCORE_W = 112
SCORE_H = 104

NEXT_X = 376
NEXT_Y = 200 # Approx
NEXT_W = 112
NEXT_H = 96

LEVEL_X = 376
LEVEL_Y = 328
LEVEL_W = 112
LEVEL_H = 56

# Colors
COL_BG_DARK = '#000000' # Black
COL_BG_DIM = '#161616' # Dark Grey for background tiles
COL_BG_LIGHT = '#606060' # Lighter Grey
COL_BORDER_CYAN = '#3CBCFC' # Cyan
COL_BORDER_BLUE = '#0058F8' # Blue/Indigo (Shadow)
COL_TEXT_RED = '#E40058' # Red/Pink text
COL_TEXT_WHITE = '#FCFCFC'

# Block Colors (Custom)
COL_T = '#800080' # Purple
COL_J = '#0000FF' # Blue
COL_Z = '#FF0000' # Red
COL_O = '#FFFF00' # Yellow
COL_S = '#00FF00' # Green
COL_L = '#FFA500' # Orange
COL_I = '#00FFFF' # Cyan

# NES Gravity (Slightly faster version)
GRAVITY_TABLE = {
    0: 40,
    1: 35,
    2: 30,
    3: 25,
    4: 20,
    5: 15,
    6: 10,
    7: 8,
    8: 6,
    9: 5,
    10: 5,
    13: 4,
    16: 3,
    19: 2,
    29: 1
}

# Shapes
SHAPES = {
    'T': [[(0,0),(-1,0),(1,0),(0,-1)], [(0,0),(0,-1),(0,1),(1,0)], [(0,0),(-1,0),(1,0),(0,1)], [(0,0),(0,-1),(0,1),(-1,0)]],
    'J': [[(0,0),(-1,0),(1,0),(1,1)], [(0,0),(0,-1),(0,1),(1,-1)], [(0,0),(-1,-1),(-1,0),(1,0)], [(0,0),(0,-1),(-1,1),(0,1)]],
    'Z': [[(0,0),(-1,-1),(0,-1),(1,0)], [(0,0),(1,-1),(1,0),(0,1)], [(0,0),(-1,-1),(0,-1),(1,0)], [(0,0),(1,-1),(1,0),(0,1)]],
    'O': [[(0,0),(0,1),(1,0),(1,1)]] * 4,
    'S': [[(0,0),(-1,0),(0,-1),(1,-1)], [(0,0),(0,-1),(1,0),(1,1)], [(0,0),(-1,0),(0,-1),(1,-1)], [(0,0),(0,-1),(1,0),(1,1)]],
    'L': [[(0,0),(-1,0),(1,0),(-1,1)], [(0,0),(0,-1),(0,1),(1,1)], [(0,0),(-1,0),(1,0),(1,-1)], [(0,0),(0,-1),(0,1),(-1,-1)]],
    'I': [[(-1,0), (0,0), (1,0), (2,0)], [(1,-1), (1,0), (1,1), (1,2)], [(-1,1), (0,1), (1,1), (2,1)], [(0,-1), (0,0), (0,1), (0,2)]]
}

SHAPE_ORDER = ['T', 'J', 'Z', 'O', 'S', 'L', 'I']
# Map shapes to color constants
SHAPE_COLORS = {
    'T': COL_T, 'J': COL_J, 'Z': COL_Z, 'O': COL_O,
    'S': COL_S, 'L': COL_L, 'I': COL_I
}

KICKS = [(0,0), (-1,0), (1,0), (0,-1)]
KICKS_I = [(0,0), (-2,0), (1,0), (-2,-1), (1,2)]

# Font Data (Partial)
FONT_DATA = {
    'A': "01110100011000111111100011000110001",
    'B': "11110100011000111110100011000111110",
    'C': "01110100011000010000100001000101110",
    'D': "11110100011000110001100011000111110",
    'E': "11111100001000011110100001000011111",
    'F': "11111100001000011110100001000010000",
    'G': "01110100011000010111100011000101110",
    'H': "10001100011000111111100011000110001",
    'I': "01110001000010000100001000010001110",
    'J': "00001000010000100001100011000101110",
    'K': "10001100101010011000101001001010001",
    'L': "10000100001000010000100001000011111",
    'M': "10001110111010110101100011000110001",
    'N': "10001110011010110101101011001110001",
    'O': "01110100011000110001100011000101110",
    'P': "11110100011000111110100001000010000",
    'Q': "01110100011000110001101011001001101",
    'R': "11110100011000111110101001001010001",
    'S': "01111100001000001110000010000111110",
    'T': "11111001000010000100001000010000100",
    'U': "10001100011000110001100011000101110",
    'V': "10001100011000110001100010101000100",
    'W': "10001100011000110101101011010101010",
    'X': "10001100010101000100010101000110001",
    'Y': "10001100010101000100001000010000100",
    'Z': "11111000010001000100010001000011111",
    '0': "01110100111010110101101011100101110",
    '1': "00100011000010000100001000010001110",
    '2': "01110100010000100010001000100011111",
    '3': "01110100010000100110000011000101110",
    '4': "00010001100101010010111110001000010",
    '5': "11111100001000011110000010000111110",
    '6': "01110100011000011110100011000101110",
    '7': "11111000010001000100001000010000100",
    '8': "01110100011000101110100011000101110",
    '9': "01110100011000101111000011000101110",
    '-': "00000000000000011111000000000000000"
}

# =============================================================================
# SYSTEM
# =============================================================================

canvas = js.document.getElementById('game-canvas-tetris')
canvas.width = CANVAS_WIDTH
canvas.height = CANVAS_HEIGHT
ctx = canvas.getContext('2d')
ctx.imageSmoothingEnabled = False

# =============================================================================
# INPUT SYSTEM (Optimized)
# =============================================================================

# Key Map indices from PyodideRunner.tsx
KEY_UP = 0
KEY_DOWN = 1
KEY_LEFT = 2
KEY_RIGHT = 3
KEY_SPACE = 4
KEY_ENTER = 5
KEY_ESC = 6
KEY_Z = 7
KEY_X = 8

class InputWrapper:
    def check(self, key_str):
        # Map string names to fast_input indices
        if key_str == 'a' or key_str == 'left': return fast_input.check(KEY_LEFT)
        if key_str == 'd' or key_str == 'right': return fast_input.check(KEY_RIGHT)
        if key_str == 'w' or key_str == 'up': return fast_input.check(KEY_UP)
        if key_str == 's' or key_str == 'down': return fast_input.check(KEY_DOWN)
        if key_str == 'space': return fast_input.check(KEY_SPACE)
        if key_str == 'enter': return fast_input.check(KEY_ENTER)
        if key_str == 'escape': return fast_input.check(KEY_ESC)
        if key_str == 'z': return fast_input.check(KEY_Z)
        return False

    def check_new(self, key_str):
        if key_str == 'a' or key_str == 'left': return fast_input.check_new(KEY_LEFT)
        if key_str == 'd' or key_str == 'right': return fast_input.check_new(KEY_RIGHT)
        if key_str == 'w' or key_str == 'up': return fast_input.check_new(KEY_UP)
        if key_str == 's' or key_str == 'down': return fast_input.check_new(KEY_DOWN)
        if key_str == 'space': return fast_input.check_new(KEY_SPACE)
        if key_str == 'enter': return fast_input.check_new(KEY_ENTER)
        if key_str == 'escape': return fast_input.check_new(KEY_ESC)
        if key_str == 'z': return fast_input.check_new(KEY_Z)
        return False

input_state = InputWrapper()


# =============================================================================
# ENGINE
# =============================================================================

class Renderer:
    def __init__(self):
        self.bg_cache = None

    def create_background(self):
        # Create an offscreen canvas to cache the background
        self.bg_cache = js.document.createElement('canvas')
        self.bg_cache.width = CANVAS_WIDTH
        self.bg_cache.height = CANVAS_HEIGHT
        bg_ctx = self.bg_cache.getContext('2d')
        
        # Draw Background Pattern
        bg_ctx.fillStyle = COL_BG_LIGHT # Base grey
        bg_ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        
        # Draw dark "recesses" to form the pattern
        bg_ctx.fillStyle = COL_BG_DIM
        
        ts = 32
        for y in range(0, CANVAS_HEIGHT, ts):
            for x in range(0, CANVAS_WIDTH, ts):
                # Pseudo-random but deterministic based on coords
                r = (x * 7 + y * 13) % 4
                
                if r == 0:
                    bg_ctx.fillRect(x + 4, y + 4, 24, 8) 
                    bg_ctx.fillRect(x + 20, y + 12, 8, 16)
                elif r == 1:
                    bg_ctx.fillRect(x + 4, y + 4, 8, 24)
                    bg_ctx.fillRect(x + 12, y + 20, 16, 8)
                elif r == 2:
                    bg_ctx.fillRect(x + 4, y + 4, 24, 24)
                    bg_ctx.fillStyle = COL_BG_LIGHT
                    bg_ctx.fillRect(x + 8, y + 8, 16, 16)
                    bg_ctx.fillStyle = COL_BG_DIM
                elif r == 3:
                     bg_ctx.fillRect(x+4, y+4, 24, 8)
                     bg_ctx.fillRect(x+4, y+20, 24, 8)

    def clear(self):
        if not self.bg_cache:
            self.create_background()
        
        # Draw cached background
        ctx.drawImage(self.bg_cache, 0, 0)

    def draw_box(self, x, y, w, h, title="", title_offset=0):
        # Outer Cyan
        ctx.strokeStyle = COL_BORDER_CYAN
        ctx.lineWidth = 4
        ctx.strokeRect(x, y, w, h)
        
        # Shadow/Inner Bevel (Blue/Black)
        ctx.strokeStyle = COL_BORDER_BLUE
        ctx.lineWidth = 4
        ctx.strokeRect(x+4, y+4, w-8, h-8)
        
        # Fill
        ctx.fillStyle = COL_BG_DARK
        ctx.fillRect(x+2, y+2, w-4, h-4) # Base fill
        
        if title:
             # Title usually centered in header
             # Draw text centered?
             self.draw_text_centered(title, x + w//2, y + 16, 1.5)

    def draw_text(self, text, x, y, scale=2, color=COL_TEXT_WHITE):
        text = str(text).upper()
        cx = x
        for char in text:
            if char in FONT_DATA:
                bits = FONT_DATA[char] # string 35 chars
                ctx.fillStyle = color
                for r in range(7):
                    for c in range(5):
                        idx = r*5 + c
                        if idx < len(bits) and bits[idx] == '1':
                            ctx.fillRect(cx + c*scale, y + r*scale, scale, scale)
            cx += 6 * scale

    def draw_text_centered(self, text, cx, y, scale=2, color=COL_TEXT_WHITE):
        width = len(str(text)) * 6 * scale
        self.draw_text(text, cx - width // 2, y, scale, color)

    def draw_block(self, gx, gy, visible=True, ghost=False, type_key='T'):
        if not visible: return
        sx = GRID_ORIGIN_X + gx * GRID_CELL_SIZE
        sy = GRID_ORIGIN_Y + gy * GRID_CELL_SIZE
        
        if ghost:
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)"
            ctx.fillRect(sx, sy, GRID_CELL_SIZE, GRID_CELL_SIZE)
            return

        # Use specific color for block type
        base_color = SHAPE_COLORS.get(type_key, '#00B800')

        # Outer
        ctx.fillStyle = base_color
        ctx.fillRect(sx, sy, GRID_CELL_SIZE, GRID_CELL_SIZE)
        
        # Highlights (Top/Left White)
        ctx.fillStyle = "rgba(255,255,255,0.5)"
        ctx.fillRect(sx, sy, GRID_CELL_SIZE, 2) # Top
        ctx.fillRect(sx, sy, 2, GRID_CELL_SIZE) # Left
        
        # Inner
        ctx.fillStyle = "rgba(0,0,0,0.2)" # Darker center like NES
        inset = 4 
        ctx.fillRect(sx + inset, sy + inset, GRID_CELL_SIZE - inset*2, GRID_CELL_SIZE - inset*2)

    def draw_mini_block(self, x, y, size=12, type_key='T'):
        # Scaled down block
        color = SHAPE_COLORS.get(type_key, '#00B800')
        ctx.fillStyle = color
        ctx.fillRect(x, y, size, size)
        
        ctx.fillStyle = "rgba(0,0,0,0.2)"
        inset = size // 4
        ctx.fillRect(x + inset, y + inset, size - inset*2, size - inset*2)

    def draw_tetromino(self, tet, gx, gy, type_key):
        for bx, by in tet:
             self.draw_block(gx + bx, gy + by, type_key=type_key)

class BagRandomizer:
    def __init__(self):
        self.bag = []
    
    def next(self):
        if not self.bag:
            self.bag = SHAPE_ORDER[:]
            random.shuffle(self.bag)
        return self.bag.pop()

class Board:
    def __init__(self, renderer):
        self.grid = [[0 for _ in range(COLS)] for _ in range(ROWS)]
        
    def is_collision(self, tet, gx, gy):
        for bx, by in tet:
            x = gx + bx
            y = gy + by
            if x < 0 or x >= COLS or y >= ROWS:
                return True
            if y >= 0 and self.grid[y][x] != 0:
                return True
        return False
        
    def lock(self, tet, gx, gy, type_key):
        for bx, by in tet:
            if gy + by >= 0:
                self.grid[gy + by][gx + bx] = type_key
                
    def check_lines(self):
        return [i for i, row in enumerate(self.grid) if all(cell != 0 for cell in row)]
        
    def remove_lines(self, lines):
        new_grid = [row for i, row in enumerate(self.grid) if i not in lines]
        for _ in range(len(lines)):
            new_grid.insert(0, [0 for _ in range(COLS)])
        self.grid = new_grid

class Game:
    def __init__(self):
        self.renderer = Renderer()
        self.randomizer = BagRandomizer()
        self.board = Board(self.renderer)
        self.reset()
        
    def reset(self):
        self.score = 0
        self.lines = 0
        self.level = 1
        if not hasattr(self, 'top_score'): self.top_score = 0 
        self.stats = {k: 0 for k in SHAPE_ORDER}
        self.board = Board(self.renderer)
        self.next_piece_type = self.randomizer.next()
        self.spawn_piece()
        self.state = "PLAYING"
        self.das_timer = 0
        self.das_dir = 0
        self.combo = -1
        self.b2b = False
        self.tspin_flag = False
        self.last_move_rotate = False
        self.action_text = ""
        self.action_timer = 0
        self.lines_cleared_batch = []
        self.score_submitted = False
        try: js.window.pyodide.globals['score_submitted'] = False
        except: pass
        js.window.setGameOver(False)
        
    def spawn_piece(self):
        self.curr_piece_type = self.next_piece_type
        self.next_piece_type = self.randomizer.next()
        self.stats[self.curr_piece_type] += 1
        
        self.curr_rot = 0
        self.curr_piece = SHAPES[self.curr_piece_type][0]
        self.curr_x = 5
        self.curr_y = 0 
        
        # Reset per-piece flags
        self.last_move_rotate = False
        self.tspin_flag = False
        
        if self.board.is_collision(self.curr_piece, self.curr_x, self.curr_y):
            self.state = "GAMEOVER"
            js.window.triggerSFX('game_over')
            js.window.setGameOver(True, self.score)
            try:
                if not getattr(self, 'score_submitted', False):
                    js.window.submitScore(self.score)
                    self.score_submitted = True
                    # Set global for cleanup check
                    js.window.pyodide.globals['score_submitted'] = True
            except:
                pass
        
        self.fall_timer = 0
        self.lock_timer = 0
        
    def get_gravity_frames(self):
        lvl = self.level
        if lvl >= 29: return 1
        if lvl >= 19: return 2
        return GRAVITY_TABLE.get(lvl, 48)

    def check_t_spin(self):
        if self.curr_piece_type != 'T': return False
        if not self.last_move_rotate: return False
        corners = [(-1,-1), (1,-1), (-1,1), (1,1)]
        occupied = 0
        for cx, cy in corners:
            wx = self.curr_x + cx
            wy = self.curr_y + cy
            if wx < 0 or wx >= COLS or wy >= ROWS or (wy >= 0 and self.board.grid[wy][wx]):
                occupied += 1
        return occupied >= 3

    def try_rotate(self, dir):
        new_rot = (self.curr_rot + dir) % 4
        new_shape = SHAPES[self.curr_piece_type][new_rot]
        kicks = KICKS_I if self.curr_piece_type == 'I' else KICKS
        for kx, ky in kicks:
            if not self.board.is_collision(new_shape, self.curr_x + kx, self.curr_y - ky):
                self.curr_rot = new_rot
                self.curr_piece = new_shape
                self.curr_x += kx
                self.curr_y -= ky
                self.lock_timer = 0
                self.last_move_rotate = True
                js.window.triggerSFX('rotate')
                return

    def lock_piece(self):
        self.tspin_flag = self.check_t_spin()
        
        self.board.lock(self.curr_piece, self.curr_x, self.curr_y, self.curr_piece_type)
        js.window.triggerSFX('lock')
        lines = self.board.check_lines()
        
        if lines:
            self.lines_cleared_batch = lines
            self.state = "DELAY"
            self.next_state = "CLEAR"
            self.delay_timer = 20
        else:
            self.combo = -1
            self.state = "DELAY"
            self.next_state = "SPAWN"
            self.delay_timer = 10

    def update(self):
        if self.action_timer > 0: self.action_timer -= 1
        
        if self.state == "TITLE":
            if input_state.check_new('enter'): self.reset()
            return
            
        if self.state == "GAMEOVER":
            if input_state.check_new('enter'): self.state = "TITLE"
            return
            
        if self.state == "PAUSED":
            if input_state.check_new('escape'): self.state = "PLAYING"
            return
            
        if self.state == "DELAY":
            self.delay_timer -= 1
            if self.delay_timer <= 0:
                if self.next_state == "SPAWN":
                    self.spawn_piece()
                    self.state = "PLAYING"
                elif self.next_state == "CLEAR":
                    # Safer line removal (rebuild grid)
                    self.board.remove_lines(self.lines_cleared_batch)
                    
                    count = len(self.lines_cleared_batch)
                    
                    # Score Calculation
                    is_tspin = self.tspin_flag
                    is_pc = all(all(c == 0 for c in r) for r in self.board.grid)
                    
                    score_add = 0
                    action_str = ""
                    
                    if is_tspin:
                        if count == 0: score_add = 400 * self.level; action_str = "T-SPIN"
                        elif count == 1: score_add = 800 * self.level; action_str = "T-SPIN SINGLE"
                        elif count == 2: score_add = 1200 * self.level; action_str = "T-SPIN DOUBLE"
                        elif count == 3: score_add = 1600 * self.level; action_str = "T-SPIN TRIPLE"
                    else:
                        # User request: Each line gives 150 points
                        score_add = count * 150
                        if count == 4: action_str = "TETRIS"

                    if count == 4 or is_tspin:
                        if self.b2b:
                            score_add = int(score_add * 1.5)
                            action_str = "B2B " + action_str
                        self.b2b = True
                    elif count > 0:
                        self.b2b = False
                        
                    if count > 0:
                        js.window.triggerSFX('score') # Play score sound
                        self.combo += 1
                        if self.combo > 0:
                            bonus = 50 * self.combo * self.level
                            score_add += bonus
                            action_str += f" +{self.combo} COMBO"
                    else:
                        self.combo = -1
                        
                    if is_pc:
                        score_add += 3000 * self.level
                        action_str = "PERFECT CLEAR!"

                    self.score += score_add
                    self.lines += count
                    self.level = 1 + (self.lines // 2)
                    
                    if action_str:
                         self.action_text = action_str
                         self.action_timer = 90
                         print(f"Action: {action_str} | Score +{score_add}")

                    self.state = "DELAY"
                    self.next_state = "SPAWN"
                    self.delay_timer = 10
            return

        # PLAYING LOGIC
        if input_state.check_new('escape'):
             self.state = "PAUSED"
             return

        # Rotation
        # Up/W = Clockwise
        if input_state.check_new('w') or input_state.check_new('up'):
            self.try_rotate(1)

        # Z = Counter-Clockwise
        if input_state.check_new('z'):
            self.try_rotate(-1)
        
        # Hard Drop
        if input_state.check_new('space'):
             while not self.board.is_collision(self.curr_piece, self.curr_x, self.curr_y + 1):
                 self.curr_y += 1
                 self.score += 2
                 self.last_move_rotate = False
             self.lock_piece()
             return

        # DAS
        move = 0
        if input_state.check_new('a'):
            move = -1
            self.das_timer = 0
            self.das_dir = -1
        elif input_state.check_new('d'):
            move = 1
            self.das_timer = 0
            self.das_dir = 1
        elif input_state.check('a') and self.das_dir == -1:
            self.das_timer += 1
            if self.das_timer > 16 and (self.das_timer - 16) % 6 == 0: move = -1
        elif input_state.check('d') and self.das_dir == 1:
            self.das_timer += 1
            if self.das_timer > 16 and (self.das_timer - 16) % 6 == 0: move = 1
        else:
            self.das_dir = 0
            
        if move:
            if not self.board.is_collision(self.curr_piece, self.curr_x + move, self.curr_y):
                self.curr_x += move
                self.last_move_rotate = False
                js.window.triggerSFX('move')
                self.lock_timer = 0

        # Gravity
        self.fall_timer += 1
        frames = self.get_gravity_frames()
        if input_state.check('s') or input_state.check('down'):
            frames = 2 
            
        if self.fall_timer >= frames:
            self.fall_timer = 0
            if not self.board.is_collision(self.curr_piece, self.curr_x, self.curr_y + 1):
                self.curr_y += 1
                self.last_move_rotate = False
                self.lock_timer = 0

        # Lock Logic
        if self.board.is_collision(self.curr_piece, self.curr_x, self.curr_y + 1):
            self.lock_timer += 1
            if self.lock_timer > 30:
                self.lock_piece()

    def draw(self):
        if not hasattr(self, 'renderer'):
            print("CRITICAL: Renderer missing in draw")
            return
        self.renderer.clear()
        
        # Draw UI Panels
        self.renderer.draw_box(STATS_X, STATS_Y, STATS_W, STATS_H) # Stats
        self.renderer.draw_box(PLAYFIELD_X - 6, PLAYFIELD_Y - 6, PLAYFIELD_W + 12, PLAYFIELD_H + 12) # Board Frame
        self.renderer.draw_box(ATYPE_X, ATYPE_Y, ATYPE_W, ATYPE_H) # A-TYPE
        self.renderer.draw_box(LINES_X, LINES_Y, LINES_W, LINES_H) # LINES
        self.renderer.draw_box(SCORE_X, SCORE_Y, SCORE_W, SCORE_H) # TOP/SCORE
        self.renderer.draw_box(NEXT_X, NEXT_Y, NEXT_W, NEXT_H) # NEXT
        self.renderer.draw_box(LEVEL_X, LEVEL_Y, LEVEL_W, LEVEL_H) # LEVEL
        
        # Text Headers
        self.renderer.draw_text_centered("A-TYPE", ATYPE_X + ATYPE_W//2, ATYPE_Y + 16, 2)
        self.renderer.draw_text_centered(f"LINES-{self.lines:03}", LINES_X + LINES_W//2, LINES_Y + 16, 2)
        
        self.renderer.draw_text("TOP", SCORE_X + 16, SCORE_Y + 12, 2)
        top_val = max(self.top_score, self.score, int(getattr(js.window, 'GLOBAL_HIGH_SCORE', 0)))
        self.renderer.draw_text(f"{top_val:06}", SCORE_X + 16, SCORE_Y + 32, 2)
        self.renderer.draw_text("SCORE", SCORE_X + 16, SCORE_Y + 56, 2)
        self.renderer.draw_text(f"{self.score:06}", SCORE_X + 16, SCORE_Y + 76, 2)
        
        self.renderer.draw_text_centered("NEXT", NEXT_X + NEXT_W//2, NEXT_Y + 16, 2)
        self.renderer.draw_text_centered("LEVEL", LEVEL_X + LEVEL_W//2, LEVEL_Y + 12, 2)
        self.renderer.draw_text_centered(f"{self.level:02}", LEVEL_X + LEVEL_W//2, LEVEL_Y + 36, 2)
        
        self.renderer.draw_text_centered("STATISTICS", STATS_X + STATS_W//2, STATS_Y + 16, 2)
        
        # Stats Content
        # Stats Content
        sy = STATS_Y + 48
        for k in SHAPE_ORDER:
            # Draw Larger Mini Blocks (Size 12)
            # Offset Shape X
            shape_def = SHAPES[k][0]
            mx = STATS_X + 32
            my = sy + 16 # Shift down slightly within slot
            for x, y in shape_def:
                self.renderer.draw_mini_block(mx + x*12, my + y*12, 12, type_key=k)
            
            # Count
            self.renderer.draw_text(f"{self.stats[k]:03}", STATS_X + 80, sy + 8, 2, COL_TEXT_RED)
            sy += 44 # Adjusted spacing to fit screen
            
        # Board
        # Flash Logic
        flash = False
        if self.state == "DELAY" and self.next_state == "CLEAR":
             if (self.delay_timer // 4) % 2 == 0: flash = True
             
        for y in range(ROWS):
            for x in range(COLS):
                v = self.board.grid[y][x]
                if v:
                    if flash and y in self.lines_cleared_batch:
                         sx = GRID_ORIGIN_X + x * GRID_CELL_SIZE
                         sy = GRID_ORIGIN_Y + y * GRID_CELL_SIZE
                         ctx.fillStyle = COL_TEXT_WHITE
                         ctx.fillRect(sx, sy, GRID_CELL_SIZE, GRID_CELL_SIZE)
                    else:
                         self.renderer.draw_block(x, y, type_key=v)
                         
        # Active
        if self.state == "PLAYING" and self.curr_piece:
             self.renderer.draw_tetromino(self.curr_piece, self.curr_x, self.curr_y, type_key=self.curr_piece_type)
             
        # Next Piece
        if self.next_piece_type:
             nx = NEXT_X + NEXT_W//2 - 24 # Centered approx
             ny = NEXT_Y + NEXT_H//2 + 8
             for x, y in SHAPES[self.next_piece_type][0]:
                  self.renderer.draw_mini_block(nx + x*16, ny + y*16, 16, type_key=self.next_piece_type)

        if hasattr(self, 'action_text') and self.action_timer > 0:
             self.renderer.draw_text_centered(self.action_text, PLAYFIELD_X + PLAYFIELD_W//2, PLAYFIELD_Y + PLAYFIELD_H//2, 2, '#FF0')

        if self.state == "TITLE":
             self.renderer.draw_box(180, 200, 200, 80)
             self.renderer.draw_text_centered("TETRIS", 280, 220, 2, '#00B800')
             self.renderer.draw_text_centered("PRESS ENTER", 280, 250, 1, COL_TEXT_WHITE)

# Instantiate Game
print("Instantiating Game...")
tetris_game = Game()
print(f"Game instantiated. Attributes: {dir(tetris_game)}")
def reset_game():
    tetris_game.reset()

def loop(t):
    try:
        tetris_game.update()
        tetris_game.draw()
    except Exception as e:
        print(f"Game Error: {e}")
        # Cannot access self here, use tetris_game.renderer
        tetris_game.renderer.draw_text(f"ERR: {str(e)[:20]}", 10, 10, 1, '#FF0000')

    if getattr(tetris_game, 'state', None) != "VIDE":
        global game_req_id
        game_req_id = js.window.requestAnimationFrame(proxy_loop)

proxy_loop = create_proxy(loop)
game_req_id = js.window.requestAnimationFrame(proxy_loop)

def cleanup():
    if tetris_game.state == "VIDE":
        return
    
    tetris_game.state = "VIDE"
    
    try:
        js.window.cancelAnimationFrame(game_req_id)
    except Exception:
        pass
    
    try:
        if 'proxy_loop' in globals():
            proxy_loop.destroy()
    except Exception:
        pass
