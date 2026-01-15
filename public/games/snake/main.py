from pyodide.ffi import create_proxy
import js
import random
import game_utils

canvas = js.document.getElementById('game-canvas')
ctx = canvas.getContext('2d')
canvas.width = 640
canvas.height = 480

# Constants
GRID_SIZE = 32
GRID_W = 640 // GRID_SIZE
GRID_H = 480 // GRID_SIZE

# State
snake = [(10, 10)]
direction = (1, 0) # dx, dy
next_direction = (1, 0)
food = (15, 10)
score = 0
game_over = False
delay = 250 # Start slower (250ms per frame)

# Systems
particles = game_utils.ParticleSystem()
shake = game_utils.ScreenShake()

def reset_game():
    global snake, direction, next_direction, food, score, game_over, delay
    snake = [(10, 10)]
    direction = (1, 0)
    next_direction = (1, 0)
    spawn_food()
    score = 0
    delay = 250
    game_over = False
    shake.trigger(0)
    js.window.setGameOver(False)

def spawn_food():
    global food
    while True:
        x = random.randint(0, GRID_W - 1)
        y = random.randint(0, GRID_H - 1)
        if (x, y) not in snake:
            food = (x, y)
            break

# Optimized Input Handling
KEY_UP = 0
KEY_DOWN = 1
KEY_LEFT = 2
KEY_RIGHT = 3
KEY_ENTER = 5

def check_input():
    global next_direction, game_over
    
    # Enter to restart
    if fast_input.check_new(KEY_ENTER) and game_over:
        reset_game()
        return

    dx, dy = direction
    
    # Prioritize inputs (Last pressed logic is tricky without state, but polling works)
    # We check all directions.
    
    if fast_input.check(KEY_UP) and dy == 0:
        next_direction = (0, -1)
    elif fast_input.check(KEY_DOWN) and dy == 0:
        next_direction = (0, 1)
    elif fast_input.check(KEY_LEFT) and dx == 0:
        next_direction = (-1, 0)
    elif fast_input.check(KEY_RIGHT) and dx == 0:
        next_direction = (1, 0)


# Loop
last_time = 0
req_id = None

def loop(timestamp):
    global last_time, req_id
    
    # Poll Input Every Frame (for lowest latency)
    check_input()
    
    if timestamp - last_time > delay: # Use dynamic delay
        update()
        last_time = timestamp
    
    draw() 
    req_id = js.window.requestAnimationFrame(proxy_loop)

# Create Proxy for Loop
proxy_loop = create_proxy(loop)
reset_game()
req_id = js.window.requestAnimationFrame(proxy_loop)

# Create Proxy for Loop
proxy_loop = create_proxy(loop)
reset_game()
req_id = js.window.requestAnimationFrame(proxy_loop)

def cleanup():
     try: js.window.cancelAnimationFrame(req_id)
     except: pass
     try: js.document.removeEventListener('keydown', key_proxy)
     except: pass
     try: key_proxy.destroy()
     except: pass
     try: proxy_loop.destroy()
     except: pass
