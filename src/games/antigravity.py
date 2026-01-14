# antigravity.py - Infinite Runner (Motherboard) for Pyodide
# Constraints: 640x480 canvas, colors #00FF41 (green) and #000000 (black)

import js
import random
import game_utils

canvas = js.document.getElementById('game-canvas')
ctx = canvas.getContext('2d')

# Constants
PLAYER_SIZE = 20
GRAVITY_BASE = 0.3
GRAVITY = GRAVITY_BASE
SCROLL_SPEED = 3
OBSTACLE_WIDTH = 40
OBSTACLE_GAP = 160
OBSTACLE_FREQ = 1800 

# Game State
player_y = 240
player_vy = 0
on_floor = True
obstacles = []
last_obstacle_time = 0
score = 0
high_score = 0
game_over = False

# Systems
particles = game_utils.ParticleSystem()
shake = game_utils.ScreenShake()

def on_key(event):
    global GRAVITY, on_floor, player_vy, game_over
    if event.key == ' ':
        if game_over: return
        GRAVITY = -GRAVITY 
        on_floor = not on_floor
        player_vy = -GRAVITY * 5
        js.window.triggerSFX('jump')
        particles.spawn(40, player_y, "#00FF41", 5)
    elif event.key == 'Enter':
        if game_over: reset_game()

js.document.addEventListener('keydown', on_key)

def reset_game():
    global player_y, player_vy, GRAVITY, on_floor, obstacles, last_obstacle_time, score, game_over
    player_y = 240
    player_vy = 0
    GRAVITY = GRAVITY_BASE
    on_floor = True
    obstacles = []
    last_obstacle_time = 0
    score = 0
    game_over = False
    shake.trigger(0)
    js.window.setGameOver(False)

def spawn_obstacle(timestamp):
    global last_obstacle_time
    if timestamp - last_obstacle_time > OBSTACLE_FREQ:
        gap_y = random.randint(50, 480 - 50 - OBSTACLE_GAP)
        obstacles.append({"x": 640, "gap_y": gap_y, "scored": False})
        last_obstacle_time = timestamp

def end_game():
    global game_over
    if not game_over:
        game_over = True
        shake.trigger(20)
        particles.spawn(40, player_y, "#FF0000", 30)
        js.window.triggerSFX('crash')
        js.window.triggerSFX('game_over')
        js.window.setGameOver(True)
        try:
            js.window.submitScore(score)
        except:
            pass

def update(timestamp):
    global player_y, player_vy, obstacles, score
    
    if game_over:
        return

    player_vy += GRAVITY
    player_y += player_vy

    # Floor/Ceiling collision
    if on_floor:
        if player_y > 480 - PLAYER_SIZE:
            player_y = 480 - PLAYER_SIZE; player_vy = 0
    else:
        if player_y < 0:
            player_y = 0; player_vy = 0

    # Obstacles
    for obs in obstacles:
        obs["x"] -= SCROLL_SPEED
    
    obstacles = [o for o in obstacles if o["x"] + OBSTACLE_WIDTH > -10]

    # Collision & Scoring
    player_rect = (10, player_y, PLAYER_SIZE, PLAYER_SIZE)
    
    for obs in obstacles:
        # Check X overlap
        if obs["x"] < 10 + PLAYER_SIZE and obs["x"] + OBSTACLE_WIDTH > 10:
            # Check Y collision (hit top pipe OR hit bottom pipe)
            # Gap is from obs["gap_y"] to obs["gap_y"] + OBSTACLE_GAP
            if player_y < obs["gap_y"] or player_y + PLAYER_SIZE > obs["gap_y"] + OBSTACLE_GAP:
                end_game()
                return
        
        # Score
        if not obs["scored"] and obs["x"] + OBSTACLE_WIDTH < 10:
            obs["scored"] = True
            score += 1
            js.window.triggerSFX('score')
            if score % 5 == 0: SCROLL_SPEED += 0.2

    spawn_obstacle(timestamp)

def draw():
    # Background
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 640, 480)
    
    shake.apply(ctx)
    
    # Player
    ctx.fillStyle = '#00FF41' if not game_over else '#FF0000'
    ctx.fillRect(10, player_y, PLAYER_SIZE, PLAYER_SIZE)
    # Trail
    if not game_over:
        ctx.globalAlpha = 0.3
        ctx.fillRect(10 - player_vy, player_y - player_vy, PLAYER_SIZE, PLAYER_SIZE)
        ctx.globalAlpha = 1.0

    # Obstacles
    ctx.fillStyle = '#005500'
    for obs in obstacles:
        # Top
        ctx.fillRect(obs["x"], 0, OBSTACLE_WIDTH, obs["gap_y"])
        # Bottom
        ctx.fillRect(obs["x"], obs["gap_y"] + OBSTACLE_GAP, OBSTACLE_WIDTH, 480)
        # Highlight edge
        ctx.fillStyle = '#00FF41'
        ctx.fillRect(obs["x"], obs["gap_y"] - 10, OBSTACLE_WIDTH, 10)
        ctx.fillRect(obs["x"], obs["gap_y"] + OBSTACLE_GAP, OBSTACLE_WIDTH, 10)
        ctx.fillStyle = '#005500'

    particles.update_and_draw(ctx)
    
    # HUD
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '20px monospace'
    ctx.fillText(f"SCORE: {score}", 10, 30)

    shake.reset(ctx)

def loop(timestamp):
    update(timestamp)
    draw()
    js.window.requestAnimationFrame(loop)

js.window.requestAnimationFrame(loop)

def cleanup():
    try: js.document.removeEventListener('keydown', on_key)
    except: pass
