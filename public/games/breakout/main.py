# breakout.py - Production Ready with Levels
import js
import random
import math
from pyodide.ffi import create_proxy

canvas = js.document.getElementById('game-canvas')
canvas.width = 800
canvas.height = 600
ctx = canvas.getContext('2d')

# Asset Loading
img_paddle = js.Image.new(); img_paddle.src = "/games/breakout/assets/paddle.png"
img_ball = js.Image.new(); img_ball.src = "/games/breakout/assets/ball.png"
img_bricks = {
    "red": js.Image.new(),
    "orange": js.Image.new(),
    "yellow": js.Image.new(),
    "green": js.Image.new(),
    "blue": js.Image.new(),
    "purple": js.Image.new()
}
img_bricks["red"].src = "/games/breakout/assets/brick_red.png"
img_bricks["orange"].src = "/games/breakout/assets/brick_orange.png"
img_bricks["yellow"].src = "/games/breakout/assets/brick_yellow.png"
img_bricks["green"].src = "/games/breakout/assets/brick_green.png"
img_bricks["blue"].src = "/games/breakout/assets/brick_blue.png"
img_bricks["purple"].src = "/games/breakout/assets/brick_purple.png"

class Paddle:
    def __init__(self):
        self.width = 128
        self.height = 28
        self.x = (800 - self.width) // 2
        self.y = 550
        self.speed = 8

    def move_left(self):
        self.x = max(0, self.x - self.speed)

    def move_right(self):
        self.x = min(800 - self.width, self.x + self.speed)

    def draw(self):
        if img_paddle.complete and img_paddle.naturalWidth > 0:
            ctx.drawImage(img_paddle, self.x, self.y, self.width, self.height)
        else:
            ctx.fillStyle = "#00B0F0"
            ctx.fillRect(self.x, self.y, self.width, self.height)

class Ball:
    def __init__(self):
        self.size = 24
        self.base_speed = 5
        self.reset()

    def reset(self):
        self.x = 400
        self.y = 520
        self.vx = 0
        self.vy = 0
        self.launched = False

    def launch(self):
        if not self.launched:
            self.launched = True
            angle = random.uniform(-60, -120) * (math.pi / 180)
            speed = self.base_speed
            self.vx = math.cos(angle) * speed
            self.vy = math.sin(angle) * speed
            try: js.window.triggerSFX('shoot')
            except: pass

    def update(self, paddle):
        if not self.launched:
            self.x = paddle.x + paddle.width // 2 - self.size // 2
            self.y = paddle.y - self.size
            return

        self.x += self.vx
        self.y += self.vy

        # Wall bounces
        if self.x <= 0:
            self.x = 0
            self.vx = abs(self.vx)
            try: js.window.triggerSFX('bounce')
            except: pass
        elif self.x >= 800 - self.size:
            self.x = 800 - self.size
            self.vx = -abs(self.vx)
            try: js.window.triggerSFX('bounce')
            except: pass

        if self.y <= 40:
            self.y = 40
            self.vy = abs(self.vy)
            try: js.window.triggerSFX('bounce')
            except: pass

    def bounce_paddle(self, paddle):
        if not self.launched:
            return False
            
        if (self.y + self.size >= paddle.y and 
            self.y + self.size <= paddle.y + paddle.height and
            self.x + self.size > paddle.x and 
            self.x < paddle.x + paddle.width):
            
            self.y = paddle.y - self.size
            self.vy = -abs(self.vy)
            
            hit_pos = (self.x + self.size/2 - paddle.x) / paddle.width
            self.vx = (hit_pos - 0.5) * 12
            
            # Speed limit
            speed = math.sqrt(self.vx**2 + self.vy**2)
            if speed > 15:
                self.vx = (self.vx / speed) * 15
                self.vy = (self.vy / speed) * 15
            
            try: js.window.triggerSFX('bounce')
            except: pass
            return True
        return False

    def check_brick(self, brick):
        if not brick.alive or not self.launched:
            return False
            
        if (self.x < brick.x + brick.width and
            self.x + self.size > brick.x and
            self.y < brick.y + brick.height and
            self.y + self.size > brick.y):
            
            ball_center_x = self.x + self.size / 2
            ball_center_y = self.y + self.size / 2
            brick_center_x = brick.x + brick.width / 2
            brick_center_y = brick.y + brick.height / 2
            
            dx = ball_center_x - brick_center_x
            dy = ball_center_y - brick_center_y
            
            if abs(dx / brick.width) > abs(dy / brick.height):
                self.vx = -self.vx
                if dx > 0:
                    self.x = brick.x + brick.width
                else:
                    self.x = brick.x - self.size
            else:
                self.vy = -self.vy
                if dy > 0:
                    self.y = brick.y + brick.height
                else:
                    self.y = brick.y - self.size
            
            return True
        return False

    def draw(self):
        if img_ball.complete and img_ball.naturalWidth > 0:
            ctx.drawImage(img_ball, self.x, self.y, self.size, self.size)
        else:
            ctx.fillStyle = "#FFFFFF"
            ctx.beginPath()
            ctx.arc(self.x + self.size/2, self.y + self.size/2, self.size/2, 0, math.pi*2)
            ctx.fill()

class Brick:
    def __init__(self, x, y, color_name, points=10):
        self.x = x
        self.y = y
        self.width = 80
        self.height = 30
        self.alive = True
        self.color_name = color_name
        self.points = points

    def draw(self):
        if not self.alive:
            return
        img = img_bricks.get(self.color_name)
        if img and img.complete and img.naturalWidth > 0:
            ctx.drawImage(img, self.x, self.y, self.width, self.height)
        else:
            ctx.fillStyle = "#FF0000"
            ctx.fillRect(self.x, self.y, self.width, self.height)

# Game State
paddle = Paddle()
ball = Ball()
bricks = []
score = 0
lives = 3
level = 1
game_over = False
game_running = True
level_complete = False
level_complete_timer = 0

# Level Patterns
LEVEL_PATTERNS = [
    # Level 1 - Simple 3 rows
    [
        {"rows": 3, "colors": ["red", "orange", "yellow"], "cols": 7, "points": [30, 20, 10]}
    ],
    # Level 2 - 4 rows
    [
        {"rows": 4, "colors": ["red", "orange", "yellow", "green"], "cols": 7, "points": [40, 30, 20, 10]}
    ],
    # Level 3 - 5 rows full
    [
        {"rows": 5, "colors": ["red", "orange", "yellow", "green", "blue"], "cols": 8, "points": [50, 40, 30, 20, 10]}
    ],
    # Level 4 - Pyramid
    [
        {"rows": 5, "colors": ["purple", "blue", "green", "yellow", "orange"], "cols": 8, "points": [60, 50, 40, 30, 20], "pattern": "pyramid"}
    ],
    # Level 5 - Checkerboard
    [
        {"rows": 6, "colors": ["red", "blue"], "cols": 8, "points": [70, 30], "pattern": "checker"}
    ],
]

def init_bricks():
    global bricks
    bricks = []
    
    pattern_idx = min(level - 1, len(LEVEL_PATTERNS) - 1)
    pattern = LEVEL_PATTERNS[pattern_idx][0]
    
    rows = pattern["rows"]
    cols = pattern["cols"]
    colors = pattern["colors"]
    points = pattern["points"]
    pattern_type = pattern.get("pattern", "normal")
    
    start_x = (800 - (cols * 100)) // 2
    
    for row in range(rows):
        for col in range(cols):
            # Pattern logic
            if pattern_type == "pyramid":
                offset = abs(row - rows // 2)
                if col < offset or col >= cols - offset:
                    continue
            elif pattern_type == "checker":
                if (row + col) % 2 == 0:
                    continue
            
            color_idx = row % len(colors)
            brick = Brick(
                start_x + col * 100,
                60 + row * 40,
                colors[color_idx],
                points[color_idx]
            )
            bricks.append(brick)

init_bricks()

# Input
keys = {"ArrowLeft": False, "ArrowRight": False, "KeyA": False, "KeyD": False, "Space": False}

def on_key_down(event):
    code = event.code
    if code in keys:
        keys[code] = True
    if code == "Space" and not ball.launched and not level_complete:
        ball.launch()
    if event.key == "Enter":
        if game_over:
            reset_game()
        elif level_complete:
            next_level()

def on_key_up(event):
    code = event.code
    if code in keys:
        keys[code] = False

down_proxy = create_proxy(on_key_down)
up_proxy = create_proxy(on_key_up)
js.document.addEventListener('keydown', down_proxy)
js.document.addEventListener('keyup', up_proxy)

def reset_game():
    global score, lives, game_over, level, level_complete, level_complete_timer
    score = 0
    lives = 3
    level = 1
    game_over = False
    level_complete = False
    level_complete_timer = 0
    try: js.window.setGameOver(False)
    except: pass
    init_bricks()
    ball.reset()

def next_level():
    global level, level_complete, level_complete_timer
    level += 1
    level_complete = False
    level_complete_timer = 0
    ball.base_speed = min(12, 8 + level * 0.5)  # Increase speed each level
    init_bricks()
    ball.reset()
    try: js.window.triggerSFX('powerup')
    except: pass

def update():
    global score, lives, game_over, level_complete, level_complete_timer
    
    if game_over or level_complete:
        if level_complete:
            level_complete_timer += 1
        return

    # Poll Input (Zero Latency)
    # 2=Left, 3=Right, 4=Space, 5=Enter
    
    # Enter Logic
    try:
        if fast_input.check_new(5):
             if game_over: reset_game()
             elif level_complete: next_level()
    except: pass
    
    # Paddle Movement
    try:
        if fast_input.check(2): paddle.move_left()
        if fast_input.check(3): paddle.move_right()
    except: pass
    
    # Launch Logic
    try:
         if fast_input.check_new(4) and not ball.launched and not level_complete:
             ball.launch()
    except: pass

    # Fallback to keys (if fast_input fails/not ready)
    if keys.get("ArrowLeft", False) or keys.get("KeyA", False):
        paddle.move_left()
    if keys.get("ArrowRight", False) or keys.get("KeyD", False):
        paddle.move_right()

    ball.update(paddle)
    ball.bounce_paddle(paddle)

    # Brick collisions
    for brick in bricks:
        if ball.check_brick(brick):
            brick.alive = False
            score += brick.points
            try: js.window.triggerSFX('score')
            except: pass
            
            # Check level complete
            if all(not b.alive for b in bricks):
                level_complete = True
                level_complete_timer = 0
            break

    # Bottom boundary
    if ball.y > 600:
        lives -= 1
        if lives <= 0:
            game_over = True
            try: js.window.setGameOver(True)
            except: pass
            try: 
                js.window.triggerSFX('game_over')
                if score > 0: js.window.submitScore(score)
            except: pass
        else:
            ball.reset()
            try: js.window.triggerSFX('enemy_hit')
            except: pass

def draw():
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 800, 600)
    
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, 38)
    ctx.lineTo(800, 38)
    ctx.stroke()

    paddle.draw()
    ball.draw()
    for brick in bricks:
        brick.draw()

    # HUD
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '20px "Press Start 2P", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(f"SCORE: {score}", 20, 28)
    ctx.textAlign = 'center'
    ctx.fillText(f"LEVEL {level}", 400, 28)
    ctx.textAlign = 'right'
    ctx.fillText(f"LIVES: {lives}", 780, 28)
    
    # Level Complete Message
    if level_complete:
        ctx.fillStyle = '#00FF41'
        ctx.font = '48px "Press Start 2P", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText("LEVEL COMPLETE!", 400, 280)
        ctx.font = '20px "Press Start 2P", sans-serif'
        ctx.fillText("PRESS ENTER", 400, 340)

req_id = None
def loop(timestamp):
    global req_id
    update()
    draw()
    if game_running:
        req_id = js.window.requestAnimationFrame(proxy_loop)

proxy_loop = create_proxy(loop)
req_id = js.window.requestAnimationFrame(proxy_loop)

def cleanup():
    global game_running
    game_running = False
    try: js.window.cancelAnimationFrame(req_id)
    except: pass
    try: js.document.removeEventListener('keydown', down_proxy)
    except: pass
    try: js.document.removeEventListener('keyup', up_proxy)
    except: pass
