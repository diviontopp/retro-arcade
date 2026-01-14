# antigravity.py - Infinite Runner (Motherboard) for Pyodide
# Constraints: 640x480 canvas, colors #00FF41 (green) and #000000 (black)
# No external assets; all drawing via canvas 2D context.

import js
import random

canvas = js.document.getElementById('canvas')
canvas.width = 640
canvas.height = 480
ctx = canvas.getContext('2d')

# Game constants
PLAYER_SIZE = 20
GRAVITY_BASE = 0.3  # low gravity scale
GRAVITY = GRAVITY_BASE
SCROLL_SPEED = 2
OBSTACLE_WIDTH = 30
OBSTACLE_GAP = 150
OBSTACLE_FREQ = 2000  # ms between obstacles

# Player state
player_y = canvas.height // 2
player_vy = 0
on_floor = True  # start on floor

# Obstacles list: each is dict with x position
obstacles = []
last_obstacle_time = 0

# Input handling
def on_key(event):
    global GRAVITY, on_floor, player_vy
    if event.key == 'Space':
        GRAVITY = -GRAVITY  # flip gravity direction
        on_floor = not on_floor
        # give a small impulse opposite to gravity to make the flip feel responsive
        player_vy = -GRAVITY * 5
        js.window.triggerSFX('jump')
    elif event.key == 'Enter':
        reset_game()

js.document.addEventListener('keydown', on_key)

def reset_game():
    global player_y, player_vy, GRAVITY, on_floor, obstacles, last_obstacle_time
    player_y = canvas.height // 2
    player_vy = 0
    GRAVITY = GRAVITY_BASE
    on_floor = True
    obstacles = []
    last_obstacle_time = 0
    js.window.triggerSFX('game_over')

def spawn_obstacle(timestamp):
    global last_obstacle_time, obstacles
    if timestamp - last_obstacle_time > OBSTACLE_FREQ:
        # obstacle appears from right edge, with a gap for the player to pass
        gap_y = random.randint(50, canvas.height - 50 - OBSTACLE_GAP)
        obstacles.append({"x": canvas.width, "gap_y": gap_y})
        last_obstacle_time = timestamp

def update(timestamp):
    global player_y, player_vy, GRAVITY, obstacles
    # Apply gravity
    player_vy += GRAVITY
    player_y += player_vy
    # Keep player within bounds (floor/ceiling)
    if on_floor:
        if player_y > canvas.height - PLAYER_SIZE:
            player_y = canvas.height - PLAYER_SIZE
            player_vy = 0
    else:
        if player_y < 0:
            player_y = 0
            player_vy = 0
    # Move obstacles leftward
    for obs in obstacles:
        obs["x"] -= SCROLL_SPEED
    # Remove passed obstacles
    obstacles[:] = [o for o in obstacles if o["x"] + OBSTACLE_WIDTH > 0]
    # Collision detection
    for obs in obstacles:
        # obstacle consists of two solid bars: top and bottom, with a vertical gap
        if obs["x"] < PLAYER_SIZE and obs["x"] + OBSTACLE_WIDTH > 0:
            # player is within obstacle x range
            if on_floor:
                # player occupies bottom area
                if player_y + PLAYER_SIZE > obs["gap_y"]:
                    js.window.triggerSFX('game_over')
                    reset_game()
                    return
            else:
                # player on ceiling occupies top area
                if player_y < obs["gap_y"] + OBSTACLE_GAP:
                    js.window.triggerSFX('game_over')
                    reset_game()
                    return
    # Scoring: each obstacle passed increments score
    for obs in obstacles:
        if not obs.get('scored') and obs["x"] + OBSTACLE_WIDTH < PLAYER_SIZE:
            obs['scored'] = True
            js.window.triggerSFX('score')
    # Spawn new obstacles
    spawn_obstacle(timestamp)

def draw():
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    # draw player as rectangle (green)
    ctx.fillStyle = '#00FF41'
    ctx.fillRect(10, player_y, PLAYER_SIZE, PLAYER_SIZE)
    # draw obstacles (green bars)
    for obs in obstacles:
        # top bar
        ctx.fillRect(obs["x"], 0, OBSTACLE_WIDTH, obs["gap_y"])
        # bottom bar
        bottom_y = obs["gap_y"] + OBSTACLE_GAP
        ctx.fillRect(obs["x"], bottom_y, OBSTACLE_WIDTH, canvas.height - bottom_y)

def loop(timestamp):
    update(timestamp)
    draw()
    if game_running:
        js.window.requestAnimationFrame(loop)

game_running = True
js.window.requestAnimationFrame(loop)

def cleanup():
    global game_running
    if not game_running:
        return
    
    game_running = False
    
    try:
        js.document.removeEventListener('keydown', on_key)
    except Exception:
        pass
