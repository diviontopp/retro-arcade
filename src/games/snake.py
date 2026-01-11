# snake.py - Classic Snake game for Pyodide
import js
import random
from pyodide.ffi import create_proxy

# Canvas setup
canvas = js.document.getElementById('game-canvas')
canvas.width = 640
canvas.height = 480
ctx = canvas.getContext('2d')

# Game settings
CELL_SIZE = 40
GRID_W = canvas.width // CELL_SIZE
GRID_H = canvas.height // CELL_SIZE

# Game State
snake = []
direction = (1, 0)
food = (0, 0)
score = 0
state = "PLAYING" # PLAYING, GAMEOVER
frame_count = 0
MOVE_INTERVAL = 10 # Move every 10 frames (approx 6 updates/sec at 60fps)

def reset_game():
    global snake, direction, food, score, state, frame_count
    snake = [(GRID_W // 2, GRID_H // 2)]
    direction = (1, 0)
    spawn_food()
    score = 0
    state = "PLAYING"
    frame_count = 0

def spawn_food():
    global food
    while True:
        food = (random.randint(0, GRID_W - 1), random.randint(0, GRID_H - 1))
        if food not in snake:
            break

# Input handling
key_queue = []

def on_key(event):
    global key_queue, state
    if state == "GAMEOVER":
        if event.key == "Enter":
            reset_game()
        return

    key_map = {
        'w': (0, -1), 'ArrowUp': (0, -1),
        's': (0, 1), 'ArrowDown': (0, 1),
        'a': (-1, 0), 'ArrowLeft': (-1, 0),
        'd': (1, 0), 'ArrowRight': (1, 0)
    }
    k = event.key
    if k in key_map:
        # Queue input to prevent 180-degree turn in same frame
        key_queue.append(key_map[k])

# Wrap key listener
key_proxy = create_proxy(on_key)
js.document.addEventListener('keydown', key_proxy)

def draw_cell(pos, color, inset=2):
    x, y = pos
    ctx.fillStyle = color
    ctx.fillRect(x * CELL_SIZE + inset, y * CELL_SIZE + inset, CELL_SIZE - inset*2, CELL_SIZE - inset*2)

def draw_text_centered(text, y, size=30, color="#00FF41"):
    ctx.fillStyle = color
    ctx.font = f"{size}px 'Press Start 2P', monospace"
    ctx.textAlign = "center"
    ctx.fillText(text, canvas.width / 2, y)

def loop(timestamp):
    global snake, direction, state, frame_count, score
    
    try:
        if state == "VIDE":
            return
            
        # Hook for React retry button
        if state == "GAMEOVER":
             js.window.setGameOver(True)
        else:
             js.window.setGameOver(False)

        # Clear screen
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        # Draw Grid (Boxes)
        ctx.strokeStyle = '#222222'
        ctx.lineWidth = 1
        ctx.beginPath()
        for x in range(0, canvas.width + 1, CELL_SIZE):
            ctx.moveTo(x, 0)
            ctx.lineTo(x, canvas.height)
        for y in range(0, canvas.height + 1, CELL_SIZE):
            ctx.moveTo(0, y)
            ctx.lineTo(canvas.width, y)
        ctx.stroke()
        
        # Render Score
        ctx.fillStyle = "#00FF41"
        ctx.font = "20px monospace"
        ctx.textAlign = "left"
        ctx.fillText(f"SCORE: {score}", 10, 30)

        if state == "PLAYING":
            frame_count += 1
            if frame_count >= MOVE_INTERVAL:
                frame_count = 0
                
                # Process Input
                if key_queue:
                    new_dir = key_queue.pop(0)
                    if new_dir[0] != -direction[0] or new_dir[1] != -direction[1]:
                        direction = new_dir
                    if len(key_queue) > 2: key_queue[:] = key_queue[:2]

                # Move
                head_x, head_y = snake[0]
                dx, dy = direction
                new_head = ((head_x + dx) % GRID_W, (head_y + dy) % GRID_H)

                # Collision
                if new_head in snake:
                    state = "GAMEOVER"
                    js.window.triggerSFX('game_over')
                    js.window.setGameOver(True)
                else:
                    snake.insert(0, new_head)
                    
                    if new_head == food:
                        score += 10
                        if score % 50 == 0: js.window.triggerSFX('jump') # Milestone sound
                        else: js.window.triggerSFX('click') # Eat sound
                        spawn_food()
                    else:
                        snake.pop()

        # Draw Snake
        for i, segment in enumerate(snake):
            color = "#00FF41"
            if i == 0: color = "#CCFFCC" # Lighter head
            # Draw with inset for 'box' look on snake too
            draw_cell(segment, color, inset=1)

        # Draw Food
        if (js.Date.now() // 200) % 2 == 0: # Flash 
             draw_cell(food, "#FF0000", inset=4) # Red food
        
        if state == "GAMEOVER":
            draw_text_centered("GAME OVER", canvas.height / 2, 40, "#FF0000")

    except Exception as e:
        print(f"Snake Error: {e}")

    if state != "VIDE":
        game_req_id = js.window.requestAnimationFrame(loop_proxy)

# Init
reset_game()
loop_proxy = create_proxy(loop)
game_req_id = js.window.requestAnimationFrame(loop_proxy)

def cleanup():
    global state
    state = "VIDE"
    js.window.cancelAnimationFrame(game_req_id)
    js.document.removeEventListener('keydown', key_proxy)
    key_proxy.destroy()
    loop_proxy.destroy()
