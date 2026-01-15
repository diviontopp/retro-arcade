from pyodide.ffi import create_proxy
import js
import random
import game_utils

canvas = js.document.getElementById('game-canvas-snake')
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
    global snake, direction, next_direction, food, score, game_over, delay, score_submitted
    snake = [(10, 10)]
    direction = (1, 0)
    next_direction = (1, 0)
    spawn_food()
    score = 0
    delay = 250
    game_over = False
    score_submitted = False
    shake.trigger(0)
    js.window.setGameOver(False)

# ... (lines 41-84 unchanged)

def update():
    global snake, food, score, delay, game_over, score_submitted
    
    if game_over:
        return

    global direction
    direction = next_direction
    dx, dy = direction
    head_x, head_y = snake[0]
    new_x = head_x + dx
    new_y = head_y + dy

    # Wall Wrap
    new_x = new_x % GRID_W
    new_y = new_y % GRID_H

    # Self Collision
    if (new_x, new_y) in snake:
        game_over = True
        shake.trigger(5)
        try: js.window.triggerSFX('crash')
        except: pass
        try: 
            js.window.setGameOver(True)
            if not score_submitted:
                js.window.submitScore(score)
                score_submitted = True
        except: pass
        return

    snake.insert(0, (new_x, new_y))

    # Food Collision
    if (new_x, new_y) == food:
        score += 10
        spawn_food()
        shake.trigger(2)
        try: js.window.triggerSFX('score')
        except: pass
        # Removed continuous submitScore
        particles.spawn(new_x * GRID_SIZE + GRID_SIZE//2, new_y * GRID_SIZE + GRID_SIZE//2, '#FFFF00', 5)
        
        # Speed up
        if score % 50 == 0:
            delay = max(50, delay - 10)
    else:
        snake.pop()

def draw():
    # Clear
    ctx.fillStyle = '#000000' 
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    # Shake effect
    sx, sy = shake.update()
    ctx.save()
    ctx.translate(sx, sy)
    
    # Draw Background Grid (Subtle)
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 1
    for x in range(0, canvas.width, GRID_SIZE):
        ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x, canvas.height); ctx.stroke()
    for y in range(0, canvas.height, GRID_SIZE):
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width, y); ctx.stroke()

    # Draw Food
    ctx.fillStyle = '#FF3333'
    ctx.shadowBlur = 10
    ctx.shadowColor = '#FF3333'
    # Circular Food
    ctx.beginPath()
    ctx.arc(food[0] * GRID_SIZE + GRID_SIZE/2, food[1] * GRID_SIZE + GRID_SIZE/2, GRID_SIZE/2 - 2, 0, 2 * 3.14159)
    ctx.fill()
    ctx.shadowBlur = 0

    # Draw Snake
    for i, (x, y) in enumerate(snake):
        if i == 0:
            ctx.fillStyle = '#00FF00' # Head
            ctx.shadowBlur = 0
            # Square Head
            ctx.fillRect(x * GRID_SIZE + 1, y * GRID_SIZE + 1, GRID_SIZE-2, GRID_SIZE-2)
            
            # Eyes
            eye_offset_x, eye_offset_y = 0, 0
            if direction[0] == 1: eye_offset_x = 8
            elif direction[0] == -1: eye_offset_x = -8
            elif direction[1] == 1: eye_offset_y = 8
            elif direction[1] == -1: eye_offset_y = -8
            
            # White
            ctx.fillStyle = '#FFFFFF'
            ctx.beginPath()
            ctx.arc(x * GRID_SIZE + GRID_SIZE/2 + eye_offset_x - (4 if direction[1] != 0 else 0), 
                    y * GRID_SIZE + GRID_SIZE/2 + eye_offset_y - (4 if direction[0] != 0 else 0), 4, 0, 2*3.14159)
            ctx.fill()
            ctx.beginPath()
            ctx.arc(x * GRID_SIZE + GRID_SIZE/2 + eye_offset_x + (4 if direction[1] != 0 else 0), 
                    y * GRID_SIZE + GRID_SIZE/2 + eye_offset_y + (4 if direction[0] != 0 else 0), 4, 0, 2*3.14159)
            ctx.fill()
            
            # Pupils
            ctx.fillStyle = '#000000'
            ctx.beginPath()
            ctx.arc(x * GRID_SIZE + GRID_SIZE/2 + eye_offset_x*1.2 - (4 if direction[1] != 0 else 0), 
                    y * GRID_SIZE + GRID_SIZE/2 + eye_offset_y*1.2 - (4 if direction[0] != 0 else 0), 2, 0, 2*3.14159)
            ctx.fill()
            ctx.beginPath()
            ctx.arc(x * GRID_SIZE + GRID_SIZE/2 + eye_offset_x*1.2 + (4 if direction[1] != 0 else 0), 
                    y * GRID_SIZE + GRID_SIZE/2 + eye_offset_y*1.2 + (4 if direction[0] != 0 else 0), 2, 0, 2*3.14159)
            ctx.fill()
        else:
            ctx.fillStyle = '#008000' # Body
            ctx.shadowBlur = 0
            ctx.fillRect(x * GRID_SIZE + 1, y * GRID_SIZE + 1, GRID_SIZE-2, GRID_SIZE-2)
            # Inner highlight (Square)
            ctx.fillStyle = '#66FF66'
            ctx.fillRect(x * GRID_SIZE + 6, y * GRID_SIZE + 6, GRID_SIZE-12, GRID_SIZE-12)

    ctx.shadowBlur = 0
    
    # Draw UI (Score)
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "20px monospace"
    ctx.fillText(f"SCORE: {score}", 20, 30)
    ctx.fillText(f"HIGH: {max(score, 0)}", canvas.width - 150, 30)

    # Particles
    particles.update_and_draw(ctx)
    
    ctx.restore()


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



def cleanup():
     try: js.window.cancelAnimationFrame(req_id)
     except: pass
     try: js.document.removeEventListener('keydown', key_proxy)
     except: pass
     try: key_proxy.destroy()
     except: pass
     try: proxy_loop.destroy()
     except: pass
