# breakout.py - Data Blocks Breakout for Pyodide
# Constraints: 640x480 canvas, colors #00FF41 (green) and #000000 (black)
# No external assets; drawing via canvas 2D context.

import js
import random

canvas = js.document.getElementById('canvas')
canvas.width = 640
canvas.height = 480
ctx = canvas.getContext('2d')

# Game constants
PADDLE_WIDTH = 80
PADDLE_HEIGHT = 10
BALL_RADIUS = 6
BRICK_ROWS = 5
BRICK_COLS = 8
BRICK_WIDTH = (canvas.width - 40) // BRICK_COLS
BRICK_HEIGHT = 20

# Initial state
paddle_x = (canvas.width - PADDLE_WIDTH) // 2
paddle_y = canvas.height - 30
ball_x = canvas.width // 2
ball_y = paddle_y - BALL_RADIUS - 1
ball_dx = 2
ball_dy = -2

# Create bricks (Data Blocks)
bricks = []
for row in range(BRICK_ROWS):
    brick_y = 40 + row * (BRICK_HEIGHT + 5)
    for col in range(BRICK_COLS):
        brick_x = 20 + col * (BRICK_WIDTH + 5)
        bricks.append({"x": brick_x, "y": brick_y, "w": BRICK_WIDTH, "h": BRICK_HEIGHT, "alive": True})

# Input handling
key_state = {"a": False, "d": False}

def on_key_down(event):
    if event.key in key_state:
        key_state[event.key] = True
    elif event.key == 'Space':
        # launch ball if stationary
        global ball_dx, ball_dy
        if ball_dy == 0 and ball_dx == 0:
            ball_dx = 2
            ball_dy = -2
    elif event.key == 'Enter':
        reset_game()

def on_key_up(event):
    if event.key in key_state:
        key_state[event.key] = False

js.document.addEventListener('keydown', on_key_down)
js.document.addEventListener('keyup', on_key_up)

def reset_game():
    global paddle_x, ball_x, ball_y, ball_dx, ball_dy, bricks
    paddle_x = (canvas.width - PADDLE_WIDTH) // 2
    ball_x = canvas.width // 2
    ball_y = paddle_y - BALL_RADIUS - 1
    ball_dx = 0
    ball_dy = 0
    for b in bricks:
        b["alive"] = True

def draw():
    # clear
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    # draw paddle (player)
    ctx.fillStyle = '#00FF41'
    ctx.fillRect(paddle_x, paddle_y, PADDLE_WIDTH, PADDLE_HEIGHT)
    # draw ball (packet)
    ctx.beginPath()
    ctx.arc(ball_x, ball_y, BALL_RADIUS, 0, 2 * 3.14159)
    ctx.fill()
    # draw bricks (data blocks)
    for b in bricks:
        if b["alive"]:
            ctx.fillRect(b["x"], b["y"], b["w"], b["h"])

def update():
    global paddle_x, ball_x, ball_y, ball_dx, ball_dy
    # move paddle
    if key_state["a"]:
        paddle_x = max(0, paddle_x - 5)
    if key_state["d"]:
        paddle_x = min(canvas.width - PADDLE_WIDTH, paddle_x + 5)
    # move ball
    if ball_dy != 0 or ball_dx != 0:
        ball_x += ball_dx
        ball_y += ball_dy
        # wall collisions
        if ball_x <= BALL_RADIUS or ball_x >= canvas.width - BALL_RADIUS:
            ball_dx = -ball_dx
            js.window.triggerSFX('bounce')
        if ball_y <= BALL_RADIUS:
            ball_dy = -ball_dy
            js.window.triggerSFX('bounce')
        # paddle collision
        if (paddle_y <= ball_y + BALL_RADIUS <= paddle_y + PADDLE_HEIGHT) and (paddle_x <= ball_x <= paddle_x + PADDLE_WIDTH):
            ball_dy = -abs(ball_dy)
            js.window.triggerSFX('bounce')
        # brick collision
        for b in bricks:
            if b["alive"]:
                if (b["x"] <= ball_x <= b["x"] + b["w"]) and (b["y"] <= ball_y - BALL_RADIUS <= b["y"] + b["h"]):
                    b["alive"] = False
                    ball_dy = -ball_dy
                    js.window.triggerSFX('score')
                    break
        # bottom loss
        if ball_y >= canvas.height - BALL_RADIUS:
            js.window.triggerSFX('game_over')
            reset_game()

def loop(timestamp):
    update()
    draw()
    if game_running:
        js.window.requestAnimationFrame(loop)

js.window.requestAnimationFrame(loop)

def cleanup():
    global game_running
    game_running = False
    js.document.removeEventListener('keydown', on_key_down)
    js.document.removeEventListener('keyup', on_key_up)
