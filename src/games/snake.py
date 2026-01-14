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

# Systems
particles = game_utils.ParticleSystem()
shake = game_utils.ScreenShake()

def reset_game():
    global snake, direction, next_direction, food, score, game_over
    snake = [(10, 10)]
    direction = (1, 0)
    next_direction = (1, 0)
    spawn_food()
    score = 0
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

def on_key(e):
    global next_direction, game_over
    try:
        key = e.key.lower()
        
        if key == "enter" and game_over:
            reset_game()
            return

        dx, dy = direction
        if (key == "arrowup" or key == "w") and dy == 0:
            next_direction = (0, -1)
        elif (key == "arrowdown" or key == "s") and dy == 0:
            next_direction = (0, 1)
        elif (key == "arrowleft" or key == "a") and dx == 0:
            next_direction = (-1, 0)
        elif (key == "arrowright" or key == "d") and dx == 0:
            next_direction = (1, 0)
    except: pass

# Setup Event Listener with Proxy
key_proxy = create_proxy(on_key)
js.document.addEventListener('keydown', key_proxy)

def update():
    global direction, score, game_over, snake
    
    if game_over: return

    direction = next_direction
    head_x, head_y = snake[0]
    dx, dy = direction
    new_head = (head_x + dx, head_y + dy)

    # Wrap around walls
    new_head = (new_head[0] % GRID_W, new_head[1] % GRID_H)

    # Collision with self
    if new_head in snake:
         end_game()
         return

    snake.insert(0, new_head)

    # Eat food
    if new_head == food:
        score += 10
        js.window.triggerSFX('score')
        particles.spawn(food[0] * GRID_SIZE + 10, food[1] * GRID_SIZE + 10, "#FF3333", 10)
        spawn_food()
    else:
        snake.pop()

def end_game():
    global game_over
    game_over = True
    js.window.setGameOver(True)
    js.window.triggerSFX('game_over')
    shake.trigger(10)
    try:
        js.window.submitScore(score)
    except:
        pass

def draw():
    # 1. Background (Pure Black)
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, 640, 480)
    
    shake.apply(ctx)
    
    # 2. Grid (Very Subtle)
    ctx.strokeStyle = "rgba(20, 20, 20, 0.5)"
    ctx.lineWidth = 1
    ctx.beginPath()
    for x in range(0, 640, GRID_SIZE):
        ctx.moveTo(x, 0); ctx.lineTo(x, 480)
    for y in range(0, 480, GRID_SIZE):
        ctx.moveTo(0, y); ctx.lineTo(640, y)
    ctx.stroke()

    # 3. Food (Red Orb)
    fx, fy = food
    ctx.shadowBlur = 15
    ctx.shadowColor = "#FF3333"
    ctx.fillStyle = "#FF3333"
    
    # Pulse animation
    pulse = (js.performance.now() % 1000) / 1000
    size_mod = 2 * pulse
    
    # Draw food
    ctx.beginPath()
    ctx.arc(fx * GRID_SIZE + GRID_SIZE/2, fy * GRID_SIZE + GRID_SIZE/2, GRID_SIZE/2 - 2 + size_mod, 0, 6.28)
    ctx.fill()
    ctx.shadowBlur = 0 # Reset shadow

    # 4. Snake (Gradient & Eyes)
    for i, (x, y) in enumerate(snake):
        # Body Gradient: Head is bright, tail is darker
        brightness = 255 - min(150, i * 5)
        color = f"rgb(0, {brightness}, 65)"
        
        ctx.fillStyle = color
        
        # Slight rounded effect
        ctx.fillRect(x * GRID_SIZE + 1, y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2)
        
        # Eyes on Head
        if i == 0:
            ctx.fillStyle = "white"
            cx = x * GRID_SIZE + GRID_SIZE / 2
            cy = y * GRID_SIZE + GRID_SIZE / 2
            
            # Eye offsets based on actual direction
            pd_x, pd_y = -direction[1], direction[0]
            
            eye_gap = GRID_SIZE * 0.25
            e1x = cx + pd_x * eye_gap + direction[0] * 5
            e1y = cy + pd_y * eye_gap + direction[1] * 5
            e2x = cx - pd_x * eye_gap + direction[0] * 5
            e2y = cy - pd_y * eye_gap + direction[1] * 5
            
            radius = GRID_SIZE * 0.15
            
            ctx.beginPath(); ctx.arc(e1x, e1y, radius, 0, 6.28); ctx.fill()
            ctx.beginPath(); ctx.arc(e2x, e2y, radius, 0, 6.28); ctx.fill()
            
            # Pupils (looking forward)
            ctx.fillStyle = "black"
            ctx.beginPath(); ctx.arc(e1x + direction[0]*2, e1y + direction[1]*2, radius*0.5, 0, 6.28); ctx.fill()
            ctx.beginPath(); ctx.arc(e2x + direction[0]*2, e2y + direction[1]*2, radius*0.5, 0, 6.28); ctx.fill()

    # 5. Particles
    particles.update_and_draw(ctx)
    
    shake.reset(ctx)

    # 6. HUD (Styled)
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(10, 10, 140, 40)
    ctx.strokeStyle = "#00FF41"
    ctx.lineWidth = 2
    ctx.strokeRect(10, 10, 140, 40)
    
    ctx.fillStyle = "#00FF41"
    ctx.font = "20px 'Courier New', monospace"
    ctx.textAlign = "center"
    ctx.fillText(f"SCORE: {score}", 80, 37)
    ctx.textAlign = "start"

last_time = 0
req_id = None

def loop(timestamp):
    global last_time, req_id
    if timestamp - last_time > 150: # Slower (~6.6 FPS)
        update()
        last_time = timestamp
    
    draw() 
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
