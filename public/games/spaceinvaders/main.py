
import js
import math
import random
import time
from pyodide.ffi import create_proxy

# Constants
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 500
PLAYER_WIDTH = 64
PLAYER_HEIGHT = 64
ENEMY_WIDTH = 48
ENEMY_HEIGHT = 48
PLAYER_SPEED = 3 # Reduced from 4
BOSS_WIDTH = 128
BOSS_HEIGHT = 64

canvas = js.document.getElementById('game-canvas-invaders')
canvas.width = SCREEN_WIDTH
canvas.height = SCREEN_HEIGHT
ctx = canvas.getContext('2d')
ctx.imageSmoothingEnabled = False

# Asset Helper
def is_image_loaded(img):
    return img.complete and img.naturalWidth > 0

# Assets
player_img = js.window.Image.new()
player_img.src = "/games/spaceinvaders/assets/spaceship.png"

enemy_img = js.window.Image.new()
enemy_img.src = "/games/spaceinvaders/assets/invader.png"

# Game State Enums
class GameStateEnum:
    PLAYING = 1
    GAME_OVER = 2

# Game Classes
class Projectile:
    def __init__(self, x, y, type_id):
        self.x = x
        self.y = y
        self.type_id = type_id
        self.active = True
        self.width = 4
        self.height = 10
        self.vy = -8 if 'player' in type_id else 4
        
        # Weapon Types
        if type_id == 'player_laser': self.color = '#00FF00'
        elif type_id == 'player_rapid': self.color = '#FFFF00'; self.vy = -12
        elif type_id == 'player_spread': self.color = '#FF00FF'; self.vy = -8
        else: self.color = '#FF0000' # Enemy

    def update(self):
        self.y += self.vy
        if self.y < -10 or self.y > SCREEN_HEIGHT + 10:
            self.active = False
            
    def draw(self, ctx):
        ctx.save()
        ctx.shadowBlur = 10
        ctx.shadowColor = self.color
        ctx.fillStyle = self.color
        
        if self.type_id == 'player_laser':
             # Thin beam with white core
             ctx.fillStyle = self.color
             ctx.fillRect(self.x, self.y, 4, 15)
             ctx.fillStyle = '#FFFFFF'
             ctx.fillRect(self.x + 1, self.y, 2, 15)
             
        elif self.type_id == 'player_rapid':
             # Short dashed bolts with core
             ctx.fillStyle = self.color
             ctx.fillRect(self.x, self.y, 4, 8)
             ctx.fillRect(self.x, self.y + 12, 4, 8)
             ctx.fillStyle = '#FFFFFF'
             ctx.fillRect(self.x + 1, self.y, 2, 8)
             ctx.fillRect(self.x + 1, self.y + 12, 2, 8)
             
        elif self.type_id == 'player_spread':
             # Circular energy balls with core
             ctx.fillStyle = self.color
             ctx.beginPath()
             ctx.arc(self.x + 2, self.y + 5, 5, 0, 6.28)
             ctx.fill()
             ctx.fillStyle = '#FFFFFF'
             ctx.beginPath()
             ctx.arc(self.x + 2, self.y + 5, 2, 0, 6.28)
             ctx.fill()
        else:
             # Enemy zigzag or simple rect
             ctx.fillRect(self.x, self.y, self.width, self.height)
             
        ctx.restore()

class Enemy:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = ENEMY_WIDTH
        self.height = ENEMY_HEIGHT
        self.direction = 1 # 1: Right, -1: Left
        self.active = True
        
    def draw(self, ctx):
        if is_image_loaded(enemy_img):
            ctx.drawImage(enemy_img, self.x, self.y, self.width, self.height)
        else:
            ctx.fillStyle = '#FF0000'
            ctx.fillRect(self.x, self.y, self.width, self.height)

class Boss:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = BOSS_WIDTH
        self.height = BOSS_HEIGHT
        self.health = 500
        self.max_health = 500
        self.direction = 1
        self.active = True
        self.attack_timer = 0
        
    def update(self):
        self.x += self.direction * 2
        if self.x > SCREEN_WIDTH - self.width - 20 or self.x < 20:
             self.direction *= -1
             
        self.attack_timer += 1
        
    def draw(self, ctx):
        if not self.active: return
        # Draw Boss Ship
        ctx.fillStyle = '#9900FF'
        ctx.fillRect(self.x, self.y, self.width, self.height)
        # Eye
        ctx.fillStyle = '#FFFF00'
        ctx.fillRect(self.x + self.width//2 - 10, self.y + 20, 20, 20)
        
        # Health Bar
        ctx.fillStyle = '#555555'
        ctx.fillRect(self.x, self.y - 15, self.width, 10)
        ctx.fillStyle = '#00FF00'
        
        hp_pct = self.health / self.max_health
        if hp_pct < 0.3: ctx.fillStyle = '#FF0000'
        
        ctx.fillRect(self.x, self.y - 15, self.width * hp_pct, 10)

class Shield:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = 80 # Reduced from 120
        self.height = 60 # Reduced from 80
        self.health = 50
        
    def draw(self, ctx):
        if self.health <= 0: return
        
        # Draw "Bunker" style using small rects
        ctx.fillStyle = f'rgba(0, 255, 255, {self.health/50})'
        
        # Main Block (Pixelated look)
        chunk = 10
        rows = self.height // chunk
        cols = self.width // chunk
        
        for r in range(rows):
            for c in range(cols):
                # Cut out arch
                if r > rows - 4 and (c > 3 and c < cols - 4): continue
                # Cut out top corners
                if r == 0 and (c == 0 or c == cols - 1): continue
                
                # Jitter slightly for damage effect based on health
                if self.health < 25 and random.random() < 0.2: continue
                
                ctx.fillRect(self.x + c*chunk, self.y + r*chunk, chunk-1, chunk-1)

class Game:
    def __init__(self):
        self.reset()
        
    def reset(self):
        self.state = GameStateEnum.PLAYING
        self.playerX = SCREEN_WIDTH // 2 - PLAYER_WIDTH // 2
        self.playerY = SCREEN_HEIGHT - 80
        self.projectiles = []
        self.enemies = []
        self.shields = []
        self.score = 0
        self.lives = 3
        self.level = 1
        self.boss = None
        self.weapon_type = 'standard'
        self.invincibility_timer = 0
        self.last_shot_time = 0
        self.spawn_enemies()
        self.spawn_shields()
        try: js.window.setGameOver(False)
        except: pass

    def spawn_enemies(self):
        self.projectiles = [] # Clear bullets
        
        if self.level == 5:
            # BOSS LEVEL
            self.boss = Boss(SCREEN_WIDTH//2 - BOSS_WIDTH//2, 50)
            try: js.window.triggerSFX('start')
            except: pass
            return

        # Normal Levels
        rows = 3 + (self.level // 2)
        cols = 6 + (self.level // 2)
        start_x = 50
        start_y = 50
        for row in range(min(6, rows)):
            for col in range(min(10, cols)):
                self.enemies.append(Enemy(start_x + col * 60, start_y + row * 50))
                
    def spawn_shields(self):
        # One large shield in the center (per user request)
        self.shields = [Shield(SCREEN_WIDTH // 2 - 40, 350)]

    def update(self):
        if self.state != GameStateEnum.PLAYING: return
        
        # Projectiles
        for p in self.projectiles:
            p.update()
        self.projectiles = [p for p in self.projectiles if p.active]
        
        # BOSS LOGIC
        if self.boss and self.boss.active:
            self.boss.update()
            
            # Boss Shooting
            if self.boss.attack_timer > 60:
                self.boss.attack_timer = 0
                # Spread Shot
                self.projectiles.append(Projectile(self.boss.x + 20, self.boss.y + 60, 'enemy_laser'))
                self.projectiles.append(Projectile(self.boss.x + self.boss.width - 20, self.boss.y + 60, 'enemy_laser'))
                self.projectiles.append(Projectile(self.boss.x + self.boss.width//2, self.boss.y + 60, 'enemy_laser'))
            
            # Boss Collision
            for p in self.projectiles:
                if not p.active: continue
                if 'player' in p.type_id and \
                   p.x > self.boss.x and p.x < self.boss.x + self.boss.width and \
                   p.y > self.boss.y and p.y < self.boss.y + self.boss.height:
                       p.active = False
                       self.boss.health -= 10
                       try: js.window.triggerSFX('enemy_hit')
                       except: pass
                       if self.boss.health <= 0:
                           self.boss.active = False
                           self.score += 5000
                           self.level += 1
                           self.spawn_enemies()
                           
        
        # Enemy Movement
        move_down = False
        game_speed = 0.5 + (self.score / 5000) # MUCH Slower speed scaling (Base 0.5)
        
        # Enemy Shooting (Random) - Significantly Reduced
        # Base chance 0.005 (0.5%) + tiny scaling
        if random.random() < 0.005 + (self.level * 0.001):
            shooting_candidates = [e for e in self.enemies if e.active]
            if shooting_candidates:
                shooter = random.choice(shooting_candidates)
                self.projectiles.append(Projectile(shooter.x + shooter.width//2, shooter.y + shooter.height, 'enemy_laser'))
        
        # Check edges first
        for e in self.enemies:
            if not e.active: continue
            
            # Move
            e.x += e.direction * game_speed
            
            # Check edge
            if (e.direction == 1 and e.x + e.width > SCREEN_WIDTH - 20) or \
               (e.direction == -1 and e.x < 20):
                move_down = True
                
        if move_down:
            for e in self.enemies:
                e.direction *= -1
                e.y += 10 # Reduced drop amount (was 20)
        
        # Collision
        for p in self.projectiles:
            if not p.active: continue
            
            if 'player' in p.type_id:
                for e in self.enemies:
                    if e.active and \
                       p.x < e.x + e.width and p.x + p.width > e.x and \
                       p.y < e.y + e.height and p.y + p.height > e.y:
                        e.active = False
                        p.active = False
                        self.score += 100
                        invaders_game.weapon_level = min(2, self.score // 1000)
                        try: js.window.triggerSFX('enemy_hit')
                        except: pass
                        break

            elif 'enemy' in p.type_id: # Enemy laser hits player
                 if p.x < invaders_game.playerX + PLAYER_WIDTH and \
                    p.x + p.width > invaders_game.playerX and \
                    p.y < invaders_game.playerY + PLAYER_HEIGHT and \
                    p.y + p.height > invaders_game.playerY:
                     p.active = False
                     invaders_game.lives -= 1
                     invaders_game.playerX = SCREEN_WIDTH // 2 # Reset pos
                     try: js.window.triggerSFX('crash')
                     except: pass
                     if invaders_game.lives <= 0:
                         invaders_game.state = GameStateEnum.GAME_OVER
                         try: js.window.setGameOver(True)
                         except: pass
                         try: js.window.submitScore(invaders_game.score)
                         except: pass
        
        self.enemies = [e for e in self.enemies if e.active]
        if not self.enemies and (not self.boss or not self.boss.active):
            self.level += 1
            # Weapon Upgrades
            if self.level == 3: self.weapon_type = 'rapid'
            if self.level == 5: self.weapon_type = 'spread'
            
            self.spawn_enemies()

# Globals
invaders_game = Game()
# Input
keys = {}
input_cooldown = 0

def on_key_down(e): keys[e.key.lower()] = True
def on_key_up(e): keys[e.key.lower()] = False

down_proxy = create_proxy(on_key_down)
up_proxy = create_proxy(on_key_up)
js.document.addEventListener('keydown', down_proxy)
js.document.addEventListener('keyup', up_proxy)

# Utils
def update_particles(): pass # Placeholder
def draw_particles(ctx): pass # Placeholder
def draw_hud():
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '20px monospace'
    ctx.fillText(f"SCORE: {invaders_game.score}", 20, 30)
    ctx.fillText(f"LIVES: {invaders_game.lives}", SCREEN_WIDTH - 120, 30)
    ctx.fillText(f"LEVEL: {invaders_game.level}", SCREEN_WIDTH // 2 - 40, 30)

def fire_weapon():
    # Cooldown Logic
    current_time = time.time()
    cooldown = 0.6 # Standard slow fire
    if invaders_game.weapon_type == 'rapid': cooldown = 0.2
    if invaders_game.weapon_type == 'spread': cooldown = 0.45
    
    if current_time - invaders_game.last_shot_time < cooldown:
        return

    # Bullet Limit Logic
    limit = 3
    if invaders_game.weapon_type == 'rapid': limit = 8
    if invaders_game.weapon_type == 'spread': limit = 6
    
    current_shots = len([p for p in invaders_game.projectiles if p.active and 'player' in p.type_id])
    
    if current_shots < limit:
        invaders_game.last_shot_time = current_time
        
        if invaders_game.weapon_type == 'spread':
             invaders_game.projectiles.append(Projectile(invaders_game.playerX + 28, invaders_game.playerY, 'player_laser'))
             # Angled shots simulation (just offset x/y)
             p1 = Projectile(invaders_game.playerX + 10, invaders_game.playerY + 10, 'player_spread')
             p1.vy = -6; p1.x -= 1 # Drift left
             
             p2 = Projectile(invaders_game.playerX + 46, invaders_game.playerY + 10, 'player_spread')
             p2.vy = -6; p2.x += 1 # Drift right
             
             invaders_game.projectiles.append(p1)
             invaders_game.projectiles.append(p2)
        
        elif invaders_game.weapon_type == 'rapid':
             invaders_game.projectiles.append(Projectile(invaders_game.playerX + 28, invaders_game.playerY, 'player_rapid'))
        else:
             invaders_game.projectiles.append(Projectile(invaders_game.playerX + 28, invaders_game.playerY, 'player_laser'))
             
        try: js.window.triggerSFX('shoot')
        except: pass

def loop(timestamp):
    # Clear
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
    
    # Input
    global input_cooldown
    if input_cooldown > 0: input_cooldown -= 1
    
    if keys.get('arrowleft') or keys.get('a'): invaders_game.playerX -= PLAYER_SPEED
    if keys.get('arrowright') or keys.get('d'): invaders_game.playerX += PLAYER_SPEED
    invaders_game.playerX = max(0, min(invaders_game.playerX, SCREEN_WIDTH - PLAYER_WIDTH))
    
    if (keys.get(' ') or keys.get('space')) and input_cooldown == 0:
        fire_weapon()
        input_cooldown = 20
        
    invaders_game.update()
    
    # Draw
    if is_image_loaded(player_img):
        ctx.drawImage(player_img, invaders_game.playerX, invaders_game.playerY, PLAYER_WIDTH, PLAYER_HEIGHT)
    else:
        ctx.fillStyle = '#00FF00'
        ctx.fillRect(invaders_game.playerX, invaders_game.playerY, PLAYER_WIDTH, PLAYER_HEIGHT)
        
    for e in invaders_game.enemies: e.draw(ctx)
    if invaders_game.boss: invaders_game.boss.draw(ctx)
    for p in invaders_game.projectiles: p.draw(ctx)
    for s in invaders_game.shields: s.draw(ctx)
    
    draw_hud()
    
    global req_id
    req_id = js.window.requestAnimationFrame(proxy_loop)
    js.window.invaders_req_id = req_id

proxy_loop = create_proxy(loop)

# Safe Start: Cancel any existing loop
if hasattr(js.window, 'invaders_req_id'):
    js.window.cancelAnimationFrame(js.window.invaders_req_id)

req_id = js.window.requestAnimationFrame(proxy_loop)
js.window.invaders_req_id = req_id

def cleanup():
    if hasattr(js.window, 'invaders_req_id'):
        js.window.cancelAnimationFrame(js.window.invaders_req_id)
    try: js.window.cancelAnimationFrame(req_id)
    except: pass
    try: js.document.removeEventListener('keydown', down_proxy)
    except: pass
    try: js.document.removeEventListener('keyup', up_proxy)
    except: pass
    try: proxy_loop.destroy()
    except: pass
