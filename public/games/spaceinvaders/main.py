import js
import math
import random
from pyodide.ffi import create_proxy

print("GAME RELOADED - PROFESSOR MODE: REFACTORED")

# =============================================================================
# ASSET MANAGEMENT
# =============================================================================

ASSET_BASE = "/games/spaceinvaders/assets/"

class Assets:
    def __init__(self):
        self.images = {}
        self.sounds = {}
        
    def load_image(self, name, filename):
        img = js.window.Image.new()
        img.src = ASSET_BASE + filename
        self.images[name] = img
        return img
        
    def load_sound(self, name, filename):
        snd = js.window.Audio.new(ASSET_BASE + "audio/" + filename)
        if name == 'music':
            snd.volume = 0.4
        elif name == 'laser':
            snd.volume = 0.3
        self.sounds[name] = snd
        return snd

assets = Assets()

# Load Assets
bg_img = assets.load_image('background', 'startScreenBackground.png')
player_img = assets.load_image('player', 'spaceship.png')
enemy_img = assets.load_image('enemy', 'invader.png')

# Sounds
background_music = assets.load_sound('music', 'backgroundMusic.wav')
laser_sound = assets.load_sound('laser', 'shoot.wav')
explosion_sound = assets.load_sound('explosion', 'explode.wav')

background_music.loop = True
try: background_music.play()
except: pass

# =============================================================================
# CONSTANTS & CONFIG
# =============================================================================

SCREEN_WIDTH = 800
SCREEN_HEIGHT = 500
PLAYER_Y_POS = 400

ENEMY_WIDTH = 48
ENEMY_HEIGHT = 48

# Physics Constants
DIVE_SPEED_BASE = 0.02 # Steering force
DIVE_MAX_SPEED = 5.0
PLAYER_SPEED = 7
SHIELD_BLAST_RADIUS_SMALL = 12
SHIELD_BLAST_RADIUS_LARGE = 20
INVINCIBILITY_FRAMES = 60 # 1 second at 60fps

canvas = js.document.getElementById('game-canvas')
canvas.width = SCREEN_WIDTH
canvas.height = SCREEN_HEIGHT
ctx = canvas.getContext('2d')
ctx.imageSmoothingEnabled = False

# =============================================================================
# GAME CLASSES
# =============================================================================

class GameStateEnum:
    MENU = 0
    PLAYING = 1
    GAME_OVER = 2

class Star:
    def __init__(self):
        self.reset(random_y=True)
        
    def reset(self, random_y=False):
        self.x = random.randint(0, SCREEN_WIDTH)
        self.y = random.randint(0, SCREEN_HEIGHT) if random_y else -5
        self.z = random.random() * 2 + 0.5 
        self.size = random.random() * 1.5 + 0.5
        self.opacity = random.random() * 0.5 + 0.3
        self.color = random.choice(["255, 255, 255", "200, 200, 255", "255, 200, 200"])

    def update(self, speed):
        self.y += speed * self.z
        if self.y > SCREEN_HEIGHT:
            self.reset()
            
    def draw(self, ctx):
        ctx.fillStyle = f"rgba({self.color}, {self.opacity})"
        ctx.fillRect(self.x, self.y, self.size, self.size)

class Enemy:
    def __init__(self, x, y, type_id, level_mod=0):
        self.x = x
        self.y = y
        self.width = ENEMY_WIDTH
        self.height = ENEMY_HEIGHT
        self.alive = True
        self.type_id = type_id # 0=Normal, 1=Elite, 2=Heavy, 99=BOSS
        self.health = 1 + (type_id * 1) 
        
        # Setup BOSS
        if type_id == 99:
            self.width = 128
            self.height = 128
            self.health = 40 + (level_mod * 5)
            self.score_val = 5000
        else:
            self.score_val = 10 * (type_id + 1)
            
        self.max_health = self.health
        
        # Behavior State
        self.state = "FORMATION" 
        self.vx = 0
        self.vy = 0
        self.formation_x = x 
        self.formation_y = y 
        
    def update(self, game_speed, direction, target_x, target_y):
        if self.type_id == 99: return # Boss handled separately

        if self.state == "FORMATION":
             # Normal Grid Movement handled by GameState
             pass
            
        elif self.state == "DIVE":
            # STEERING BEHAVIOR (Simple Seek)
            # Vector to target
            dx = target_x - self.x
            dy = target_y - self.y
            dist = math.sqrt(dx*dx + dy*dy)
            
            if dist > 0:
                # Normalize and apply steering force
                dx /= dist
                dy /= dist
                self.vx += dx * DIVE_SPEED_BASE
                self.vy += dy * DIVE_SPEED_BASE
                
            # Cap speed
            speed = math.sqrt(self.vx*self.vx + self.vy*self.vy)
            if speed > DIVE_MAX_SPEED:
                self.vx = (self.vx / speed) * DIVE_MAX_SPEED
                self.vy = (self.vy / speed) * DIVE_MAX_SPEED
                
            self.x += self.vx
            self.y += self.vy + 2 # Constant downward gravity
            
            if self.y > SCREEN_HEIGHT + 50:
                self.y = -50
                self.state = "RETURN"
                self.vx = 0
                self.vy = 0
                
        elif self.state == "RETURN":
            # Move back to formation slot
            dx = self.formation_x - self.x
            dy = self.formation_y - self.y
            self.x += dx * 0.05
            self.y += dy * 0.05
            
            if abs(dx) < 2 and abs(dy) < 2:
                self.state = "FORMATION"
                self.x = self.formation_x
                self.y = self.formation_y
        
    def draw(self, ctx):
        if not self.alive: return
        
        if self.type_id == 99: # BOSS
             img_ok = False
             try: img_ok = enemy_img.complete and enemy_img.naturalWidth > 0
             except: pass

             if img_ok:
                 ctx.drawImage(enemy_img, self.x, self.y, self.width, self.height)
                 ctx.fillStyle = "rgba(255, 0, 0, 0.4)"; ctx.fillRect(self.x, self.y, self.width, self.height)
             else:
                 ctx.fillStyle = "#FF0000"; ctx.fillRect(self.x, self.y, self.width, self.height)
             
             ctx.fillStyle = "red"; ctx.fillRect(self.x, self.y - 15, self.width, 10)
             ctx.fillStyle = "#00FF00"; pct = max(0.0, self.health / self.max_health)
             ctx.fillRect(self.x, self.y - 15, self.width * pct, 10)
             return

        # Check image loaded
        img_ok = False
        try: img_ok = enemy_img.complete and enemy_img.naturalWidth > 0
        except: pass

        if img_ok:
            ctx.drawImage(enemy_img, self.x, self.y, 48, 48)
            if self.type_id == 1: ctx.fillStyle = "rgba(0, 255, 255, 0.3)"; ctx.fillRect(self.x, self.y, 48, 48)
            elif self.type_id == 2: ctx.fillStyle = "rgba(255, 255, 0, 0.3)"; ctx.fillRect(self.x, self.y, 48, 48)

            if self.max_health > 1:
                ctx.fillStyle = "red"; ctx.fillRect(self.x, self.y - 8, 48, 4)
                ctx.fillStyle = "#00FF00"; pct = max(0, self.health / self.max_health); ctx.fillRect(self.x, self.y - 8, 48 * pct, 4)
        else:
            ctx.fillStyle = ["#FF00FF", "#00FFFF", "#FFFF00"][self.type_id % 3]
            ctx.fillRect(self.x, self.y, 48, 48)

class Projectile:
    def __init__(self, x, y, type_id, target_x=None, target_y=None):
        self.x = x; self.y = y; self.type_id = type_id; self.active = True; self.dx = 0; self.dy = 0
        
        if type_id == 'player_laser': self.dy = -12; self.w = 4; self.h = 24; self.color = '#00FF41'
        elif type_id == 'plasma': self.dy = -15; self.w = 8; self.h = 20; self.color = '#00FFFF'
        elif type_id == 'rocket': self.dy = -8; self.w = 12; self.h = 12; self.color = '#FF4100'
        
        elif type_id == 'enemy_laser': self.dy = 4; self.w = 4; self.h = 16; self.color = '#FF0000'
        elif type_id == 'boss_laser': 
            self.w = 20; self.h = 40; self.color = '#880000'
            if target_x:
                angle = math.atan2(target_y - y, target_x - x)
                speed = 8
                self.dx = math.cos(angle) * speed; self.dy = math.sin(angle) * speed
            else: self.dy = 9

    def update(self):
        self.y += self.dy; self.x += self.dx
        if self.y < -50 or self.y > SCREEN_HEIGHT + 50 or self.x < -50 or self.x > SCREEN_WIDTH + 50: self.active = False
            
    def draw(self, ctx):
        ctx.fillStyle = self.color
        if self.type_id == 'boss_laser':
             ctx.beginPath(); ctx.arc(self.x + self.w/2, self.y + self.h/2, 10, 0, math.pi*2); ctx.fill()
             ctx.fillStyle = "#FF0000"; ctx.beginPath(); ctx.arc(self.x + self.w/2, self.y + self.h/2, 5, 0, math.pi*2); ctx.fill()
        elif self.type_id == 'enemy_laser': ctx.fillRect(self.x, self.y, self.w, self.h); ctx.fillStyle = "#FF5555"; ctx.fillRect(self.x+1, self.y, 2, self.h)
        elif self.type_id == 'player_laser':
             ctx.shadowBlur = 10; ctx.shadowColor = self.color; ctx.fillRect(self.x, self.y, self.w, self.h); ctx.shadowBlur = 0; ctx.fillStyle = "#WHITE"; ctx.fillRect(self.x+1, self.y, 2, self.h)
        elif self.type_id == 'plasma': ctx.beginPath(); ctx.arc(self.x + 4, self.y + 10, 6, 0, math.pi * 2); ctx.fill()
        elif self.type_id == 'rocket': ctx.fillRect(self.x, self.y, self.w, self.h); ctx.fillStyle = "orange"; ctx.fillRect(self.x+2, self.y+12, 8, 8)

BUNKER_SHAPE = ["  XXXXXXX  ", " XXXXXXXXX ", "XXXXXXXXXXX", "XXXXXXXXXXX", "XXXXXXXXXXX", "XXXXXXXXXXX", "XXXXXXXXXXX", "XXX     XXX", "XX       XX"]

class Shield:
    def __init__(self, x, y):
        self.x = x; self.y = y; self.block_size = 6; self.blocks = []
        for r, row in enumerate(BUNKER_SHAPE):
            for c, char in enumerate(row):
                if char == "X": self.blocks.append({'x': x + c*6, 'y': y + r*6, 'w': 6, 'h': 6, 'active': True})

    def check_hit(self, rect):
        hit = False; bx = rect['x'] + rect['w'] / 2; by = rect['y'] + rect['h'] / 2
        blast_radius = SHIELD_BLAST_RADIUS_LARGE if rect['w'] > 10 else SHIELD_BLAST_RADIUS_SMALL
        for b in self.blocks:
            if not b['active']: continue
            if (rect['x'] < b['x'] + b['w'] and rect['x'] + rect['w'] > b['x'] and rect['y'] < b['y'] + b['h'] and rect['y'] + rect['h'] > b['y']):
                hit = True; self.explode(bx, by, blast_radius); break
        return hit

    def explode(self, bx, by, radius):
        for b in self.blocks:
            if not b['active']: continue
            if math.sqrt(((b['x']+3)-bx)**2 + ((b['y']+3)-by)**2) < radius:
                b['active'] = False
                if random.random() < 0.2: create_particles(b['x'], b['y'], "#00FF41", 1)

    def draw(self, ctx):
        ctx.fillStyle = "#00FF41"; ctx.shadowBlur = 4; ctx.shadowColor = "#005500"
        for b in self.blocks:
            if b['active']: ctx.fillRect(b['x'], b['y'], b['w'] - 1, b['h'] - 1)
        ctx.shadowBlur = 0

class GameState:
    def __init__(self):
        self.stars = [Star() for _ in range(150)]
        self.projectiles = []
        self.particles = []
        self.shields = []
        self.state = GameStateEnum.MENU
        self.reset()
        
    def reset(self):
        self.playerX = SCREEN_WIDTH // 2 - 32
        self.playerY = PLAYER_Y_POS
        self.playerX_change = 0
        self.player_health = 3
        self.invincibility_timer = 0
        
        self.weapon_level = 0
        self.score_value = 0
        self.level = 0
        self.state = GameStateEnum.PLAYING
        
        self.enemies = []
        self.projectiles = []
        self.boss_active = False
        self.enemy_direction = 1 
        self.formation_y_offset = 0 
        
        self.shields = []
        self.shields.append(Shield((SCREEN_WIDTH // 2) - 33, PLAYER_Y_POS - 80))
        self.next_level()
        
    def next_level(self):
        self.level += 1
        self.enemies = []
        self.projectiles = []
        self.formation_y_offset = 0
        self.boss_active = False
        
        if self.level < 3: self.weapon_level = 0 
        elif self.level < 6: self.weapon_level = 1 
        else: self.weapon_level = 2 
        
        for s in self.shields:
            for b in s.blocks:
                if not b['active'] and random.random() < 0.3: b['active'] = True
        
        if self.level % 5 == 0:
            self.boss_active = True
            self.enemies.append(Enemy(SCREEN_WIDTH//2 - 64, 50, 99, self.level))
            for i in range(4): self.enemies.append(Enemy(100 + i * 150, 200, 1))
        else:
            rows = 3; cols = 6
            if self.level > 1: rows += (self.level - 1) // 3
            if self.level > 1: cols += (self.level - 1) // 3
            if rows > 5: rows = 5
            if cols > 9: cols = 9
            start_x = (SCREEN_WIDTH - (cols * 60)) // 2
            
            for row in range(rows):
                type_id = 0
                if row == 0 and self.level > 3: type_id = 2 
                elif row == 1 and self.level > 2: type_id = 1
                for col in range(cols):
                    e = Enemy(start_x + col * 60, 50 + row * 50, type_id)
                    if self.level > 1: e.max_health += min(4, (self.level - 1)); e.health = e.max_health
                    self.enemies.append(e)
                    
        self.enemy_speed = min(3.5, 0.4 + ((self.level - 1) * 0.2))
        js.window.setGameOver(False)

game = GameState()

# =============================================================================
# MAIN FUNCTIONS
# =============================================================================

def check_collision(rect1, rect2):
    return (rect1['x'] < rect2['x'] + rect2['w'] and
            rect1['x'] + rect1['w'] > rect2['x'] and
            rect1['y'] < rect2['y'] + rect2['h'] and
            rect1['y'] + rect1['h'] > rect2['y'])

def create_particles(x, y, color, count=10):
    for i in range(count):
        game.particles.append({'x': x, 'y': y, 'vx': (random.random()-0.5)*10, 'vy': (random.random()-0.5)*10, 'life': 1.0, 'color': color})

def update_particles():
    for p in game.particles:
        p['x'] += p['vx']
        p['y'] += p['vy']
        p['life'] -= 0.02
    game.particles = [p for p in game.particles if p['life'] > 0]

def draw_particles(ctx):
    for p in game.particles:
        ctx.globalAlpha = p['life']
        ctx.fillStyle = p['color']
        ctx.fillRect(p['x'], p['y'], 3, 3)
    ctx.globalAlpha = 1.0

def update_game_logic():
    # 1. Player
    if keys.get('arrowleft') or keys.get('a'): game.playerX -= PLAYER_SPEED
    elif keys.get('arrowright') or keys.get('d'): game.playerX += PLAYER_SPEED
    game.playerX = max(0, min(game.playerX, SCREEN_WIDTH - 64))
    
    if game.invincibility_timer > 0: game.invincibility_timer -= 1

    # 2. Projectiles
    for p in game.projectiles: p.update()
    game.projectiles = [p for p in game.projectiles if p.active]
    
    # 3. Enemies
    active = [e for e in game.enemies if e.alive]
    if not active: game.next_level(); return

    # Grid Move
    forming = [e for e in active if e.state == "FORMATION" and e.type_id != 99]
    if forming:
        rm = max(e.x for e in forming); lm = min(e.x for e in forming)
        if (rm + 64 > SCREEN_WIDTH and game.enemy_direction == 1) or (lm < 0 and game.enemy_direction == -1):
            game.enemy_direction *= -1; game.formation_y_offset += 20
            for e in forming: e.y += 20; e.formation_y += 20
        else:
            for e in forming: e.x += game.enemy_speed * game.enemy_direction; e.formation_x += game.enemy_speed * game.enemy_direction

    # Boss AI
    for b in [e for e in active if e.type_id == 99]:
        b.x = (SCREEN_WIDTH // 2 - 64) + math.sin(js.performance.now() / 1500) * (SCREEN_WIDTH // 2 - 80)
        if random.random() < 0.025: game.projectiles.append(Projectile(b.x + b.width//2, b.y + b.height, 'boss_laser', game.playerX + 32, game.playerY + 32))

    # Diver AI
    diving_count = len([e for e in active if e.state == "DIVE"])
    if not game.boss_active and game.level > 1 and diving_count < 2 and random.random() < (0.001 + game.level * 0.0002): 
        if forming:
             d = random.choice(forming); d.state = "DIVE"
             # Initial velocity towards player
             d.vx = (random.random() - 0.5) * 2; d.vy = 2 

    for e in active:
        e.update(game.enemy_speed, game.enemy_direction, game.playerX, game.playerY)
        if e.type_id != 99 and random.random() < (0.0001 + game.level * 0.00005): game.projectiles.append(Projectile(e.x+24, e.y+48, 'enemy_laser'))

    # Collisions
    player_rect = {'x': game.playerX, 'y': game.playerY, 'w': 64, 'h': 64}
    for p in game.projectiles:
        if not p.active: continue
        br = {'x': p.x, 'y': p.y, 'w': p.w, 'h': p.h}
        
        if 'enemy' in p.type_id or 'boss' in p.type_id:
            if check_collision(br, player_rect):
                p.active = False
                if game.invincibility_timer == 0:
                    game.player_health -= (999 if p.type_id == 'boss_laser' else 1)
                    game.invincibility_timer = INVINCIBILITY_FRAMES
                    js.window.triggerSFX('enemy_hit'); create_particles(game.playerX+32, game.playerY+32, "#00FF00", 20)
                    if game.player_health <= 0:
                        game.state = GameStateEnum.GAME_OVER
                        js.window.setGameOver(True)
                        js.window.triggerSFX('game_over')
                        try:
                            js.window.submitScore(game.score_value)
                        except:
                            pass
                continue
            for s in game.shields: 
                if s.check_hit(br): p.active = False; create_particles(p.x, p.y, "#00FF41", 5); break
        else:
            # Player hits enemy
            for e in active:
                if check_collision(br, {'x': e.x, 'y': e.y, 'w': e.width, 'h': e.height}):
                    p.active = False; e.health -= 1; create_particles(p.x, p.y, "#FFF", 3)
                    if e.health <= 0: 
                        e.alive = False; game.score_value += e.score_val
                        create_particles(e.x+24, e.y+24, "#FF0000", 15); explosion_sound.play()
                    break
            # Player hits shield
            for s in game.shields:
                if s.check_hit(br): p.active = False; create_particles(p.x, p.y, "#00FF41", 2); break
    
    # Particles
    for p in game.particles: p['x']+=p['vx']; p['y']+=p['vy']; p['life']-=0.05
    game.particles = [p for p in game.particles if p['life']>0]

def draw_hud():
    ctx.shadowColor = "#000"; ctx.shadowBlur = 0
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; ctx.fillRect(0, 0, SCREEN_WIDTH, 50)
    ctx.strokeStyle = "#00FF41"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 50); ctx.lineTo(SCREEN_WIDTH, 50); ctx.stroke()
    
    ctx.shadowBlur = 5; ctx.shadowColor = "#00FF41"
    ctx.fillStyle = "#FFFFFF"; ctx.font = "24px 'Impact', monospace"
    ctx.textAlign = "left"; ctx.fillText(f"SCORE: {game.score_value}", 20, 35)
    
    ctx.textAlign = "center"
    txt = f"WAVE {game.level}"; color = "#FFF"
    if game.boss_active: txt = f"!!! BOSS BATTLE !!!"; color = "#F00"
    ctx.fillStyle = color; ctx.fillText(txt, SCREEN_WIDTH//2, 35)
    
    ctx.textAlign = "right"; ctx.fillStyle = "#00FFFF"
    wep = ["LASER", "PLASMA", "ROCKETS"][min(2, game.weapon_level)]
    ctx.fillText(f"WEAPON: {wep}", SCREEN_WIDTH - 20, 35)
    
    # Hearts
    ctx.fillStyle = "red"
    for i in range(game.player_health): ctx.fillText("♥", SCREEN_WIDTH//2 + 140 + i*25, 35)
    ctx.shadowBlur = 0

keys = {}; input_cooldown = 0

# Event Listeners
def on_key_down(e):
    try:
        if hasattr(e, 'key'):
            k = e.key.lower()
            keys[k] = True
            if k == "enter" and game.state == GameStateEnum.GAME_OVER:
                reset_game()
    except: pass

def on_key_up(e):
    try:
        if hasattr(e, 'key'):
            keys[e.key.lower()] = False
    except: pass

def on_mouse_down(e):
    try:
        if game.state == GameStateEnum.PLAYING:
            fire_weapon()
    except: pass

down_proxy = create_proxy(on_key_down)
up_proxy = create_proxy(on_key_up)
mouse_proxy = create_proxy(on_mouse_down)

js.document.addEventListener('keydown', down_proxy)
js.document.addEventListener('keyup', up_proxy)
js.document.addEventListener('mousedown', mouse_proxy)

# Robust Image Check
def is_image_loaded(img):
    try:
        return img.complete and img.naturalWidth > 0
    except:
        return False

def loop(t):
    try:
        ctx.fillStyle = "#020205"; ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT) 
        for s in game.stars: s.update(8 if game.weapon_level > 1 else 3); s.draw(ctx)

        if game.state == GameStateEnum.PLAYING:
            global input_cooldown
            if keys.get(" ") or keys.get("space"):
                input_cooldown += 1
                if input_cooldown > 8: fire_weapon(); input_cooldown = 0
            else: input_cooldown = 10 
            
            update_game_logic()
            
            # Draw Player with Invincibility Flash
            if game.invincibility_timer % 10 < 5:
                 if is_image_loaded(player_img): ctx.drawImage(player_img, game.playerX, game.playerY, 64, 64)
                 else:
                     ctx.fillStyle = "#00FF00"; ctx.fillRect(game.playerX, game.playerY, 64, 64)
                 
                 ctx.fillStyle = "cyan"; ctx.fillRect(game.playerX + 28, game.playerY + 60, 8, random.randint(5, 15))

            for e in game.enemies: e.draw(ctx)
            for s in game.shields: s.draw(ctx) 
            for p in game.projectiles: p.draw(ctx)
            update_particles()
            draw_particles(ctx)
        
        draw_hud()
        
        if game.state == GameStateEnum.GAME_OVER:
            update_particles(); draw_particles(ctx)
            # Overlay handled by React

    except Exception as e:
        print(f"GAME LOOP ERROR: {e}")
        import traceback
        traceback.print_exc()

    global game_req_id
    game_req_id = js.window.requestAnimationFrame(proxy_loop)

proxy_loop = create_proxy(loop)
game_req_id = js.window.requestAnimationFrame(proxy_loop)

def reset_game(): game.reset()
def fire_weapon():
    if len([p for p in game.projectiles if p.active and 'player' in p.type_id]) < 3 + game.weapon_level * 2:
        try: laser_sound.currentTime = 0; laser_sound.play()
        except: pass
        if game.weapon_level == 0: game.projectiles.append(Projectile(game.playerX+28, game.playerY, 'player_laser'))
        elif game.weapon_level == 1: game.projectiles.append(Projectile(game.playerX+18, game.playerY, 'plasma')); game.projectiles.append(Projectile(game.playerX+38, game.playerY, 'plasma'))
        else: game.projectiles.append(Projectile(game.playerX+28, game.playerY-10, 'rocket')); game.projectiles.append(Projectile(game.playerX+8, game.playerY, 'player_laser')); game.projectiles.append(Projectile(game.playerX+48, game.playerY, 'player_laser'))

def cleanup():
    try: js.window.cancelAnimationFrame(game_req_id)
    except: pass
    
    try: js.document.removeEventListener('keydown', down_proxy)
    except: pass
    try: down_proxy.destroy()
    except: pass
    
    try: js.document.removeEventListener('keyup', up_proxy)
    except: pass
    try: up_proxy.destroy()
    except: pass
    
    try: js.document.removeEventListener('mousedown', mouse_proxy)
    except: pass
    try: mouse_proxy.destroy()
    except: pass
    
    try: proxy_loop.destroy()
    except: pass
