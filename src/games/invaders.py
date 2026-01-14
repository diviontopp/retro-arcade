# invaders.py - Space Invaders style for Pyodide
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
ENEMY_SIZE = 12
ENEMY_ROWS = 3
ENEMY_COLS = 8
ENEMY_H_SPACING = 30
ENEMY_V_SPACING = 30
ENEMY_START_X = 50
ENEMY_START_Y = 50
BULLET_SPEED = 6
ENEMY_SPEED = 0.5

# Player state
player_x = canvas.width // 2
player_y = canvas.height - PLAYER_SIZE - 10
player_dx = 0

# Enemy list
enemies = []
for row in range(ENEMY_ROWS):
    for col in range(ENEMY_COLS):
        ex = ENEMY_START_X + col * ENEMY_H_SPACING
        ey = ENEMY_START_Y + row * ENEMY_V_SPACING
        enemies.append({"x": ex, "y": ey, "alive": True})

# Bullets
bullets = []  # each bullet: {x, y, dy}

# Input handling
key_state = {"a": False, "d": False}

def on_key_down(event):
    if event.key in key_state:
        key_state[event.key] = True
    elif event.key == 'Space':
        # fire bullet
        bullets.append({"x": player_x, "y": player_y, "dy": -BULLET_SPEED})
        js.window.triggerSFX('shoot')
    elif event.key == 'Enter':
        reset_game()

def on_key_up(event):
    if event.key in key_state:
        key_state[event.key] = False

js.document.addEventListener('keydown', on_key_down)
js.document.addEventListener('keyup', on_key_up)

def reset_game():
    global player_x, enemies, bullets
    player_x = canvas.width // 2
    enemies.clear()
    for row in range(ENEMY_ROWS):
        for col in range(ENEMY_COLS):
            ex = ENEMY_START_X + col * ENEMY_H_SPACING
            ey = ENEMY_START_Y + row * ENEMY_V_SPACING
            enemies.append({"x": ex, "y": ey, "alive": True})
    bullets.clear()

def draw():
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    # draw player as triangle
    ctx.fillStyle = '#00FF41'
    ctx.beginPath()
    ctx.moveTo(player_x, player_y)
    ctx.lineTo(player_x - PLAYER_SIZE // 2, player_y + PLAYER_SIZE)
    ctx.lineTo(player_x + PLAYER_SIZE // 2, player_y + PLAYER_SIZE)
    ctx.closePath()
    ctx.fill()
    # draw enemies as small squares
    for e in enemies:
        if e["alive"]:
            ctx.fillRect(e["x"], e["y"], ENEMY_SIZE, ENEMY_SIZE)
    # draw bullets
    for b in bullets:
        ctx.fillRect(b["x"] - 2, b["y"] - 5, 4, 10)

def update():
    global player_x
    # move player
    if key_state["a"]:
        player_x = max(PLAYER_SIZE // 2, player_x - 4)
    if key_state["d"]:
        player_x = min(canvas.width - PLAYER_SIZE // 2, player_x + 4)
    # move bullets
    for b in bullets[:]:
        b["y"] += b["dy"]
        if b["y"] < 0:
            bullets.remove(b)
    # move enemies down slowly
    for e in enemies:
        e["y"] += ENEMY_SPEED
        if e["y"] > canvas.height:
            js.window.triggerSFX('game_over')
            reset_game()
            return
    # collision detection
    for b in bullets[:]:
        for e in enemies:
            if e["alive"] and (e["x"] <= b["x"] <= e["x"] + ENEMY_SIZE) and (e["y"] <= b["y"] <= e["y"] + ENEMY_SIZE):
                e["alive"] = False
                bullets.remove(b)
                js.window.triggerSFX('enemy_hit')
                break

def loop(timestamp):
    update()
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
        js.document.removeEventListener('keydown', on_key_down)
    except Exception:
        pass
    
    try:
        js.document.removeEventListener('keyup', on_key_up)
    except Exception:
        pass
