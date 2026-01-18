
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
PLAYER_SPEED = 6
BOSS_WIDTH = 256
BOSS_HEIGHT = 128

canvas = js.document.getElementById('game-canvas-invaders')
canvas.width = SCREEN_WIDTH
canvas.height = SCREEN_HEIGHT
ctx = canvas.getContext('2d')
ctx.imageSmoothingEnabled = False

# Asset Helper (with Transparency Fix)
def is_image_loaded(img):
    return img.complete and img.naturalWidth > 0

# FIX: Images have white backgrounds. We need to draw them to a temporary canvas 
# and clear the white pixels if possible, OR just use `globalCompositeOperation` tricks.
# A simpler way in canvas for pixel art with pure white bg is 'multiply' blend mode (if bg is white and sprite is dark)
# BUT since space is black, 'multiply' would make the sprite invisible if it's white-ish.
# Better approach: We can't manipulate pixels easily without a perf cost in Python loop every frame.
# Ideally, assets should be transparent PNGs.
# Since we can't edit assets easily, let's try to assume they ARE transparent now (User said they provided them).
# BUT if they still look white, it's likely the JPGs provided (uploaded_image_x.jpg).
# JPGs don't support transparency.
# WORKAROUND: We will iterate the enemies and if it's a JPG (no alpha), we can use `mix-blend-mode` style drawing?
# No, standard 2D canvas doesn't support 'remove white' easily without pixel manipulation.
# Let's trust the user provided correct PNGs now or live with it?
# User said: "make sure the backgrounds of invaders and shields arent shown. fix properly."
# We will use a cached 'sprite factory' strategy: Draw image to offscreen canvas once, clear white pixels, use that canvas as source.

SPRITE_CACHE = {}

def get_clean_sprite(img_key, img_obj):
    if not is_image_loaded(img_obj): return None
    
    # Check cache
    if img_key in SPRITE_CACHE: return SPRITE_CACHE[img_key]
    
    # Create cleaner version
    w = img_obj.naturalWidth
    h = img_obj.naturalHeight
    
    # Let's try to define a JS helper on window to clean image
    SPRITE_CACHE[img_key] = img_obj # Fallback
    
    try:
        cleaner = js.window.eval("""
            (function(img, key) {
                const c = document.createElement('canvas');
                c.width = img.naturalWidth;
                c.height = img.naturalHeight;
                const ctx = c.getContext('2d', {willReadFrequently: true});
                ctx.drawImage(img, 0, 0);
                const id = ctx.getImageData(0, 0, c.width, c.height);
                const d = id.data;
                for (let i = 0; i < d.length; i += 4) {
                    const r = d[i], g = d[i+1], b = d[i+2];
                    
                    if (key === 'shield') {
                        // Shield has BLACK background now. 
                        // Remove dark pixels.
                        if (r < 30 && g < 30 && b < 30) d[i+3] = 0; 
                    } else {
                        // Standard Invaders (Purple, Red, Green, Blue)
                        // Background is likely pure WHITE or close to It.
                        // Be strict.
                        if (r > 230 && g > 230 && b > 230) d[i+3] = 0;
                    }
                }
                ctx.putImageData(id, 0, 0);
                return c;
            })
        """)
        clean_canvas = cleaner(img_obj, img_key)
        SPRITE_CACHE[img_key] = clean_canvas
        return clean_canvas
    except:
        return img_obj

# Assets... (unchanged)

# ...

class Shield:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = 100 # Increased from 80
        self.height = 80 # Increased from 60
        self.health = 50
        
    def draw(self, ctx):
        if self.health <= 0: return
        
        # Use generated image if available, else fallback
        img = get_clean_sprite('shield', shield_img)
        
        if img:
             # Draw full opacity first time, then fade
             ctx.globalAlpha = self.health / 50.0
             ctx.drawImage(img, self.x, self.y, self.width, self.height)
             ctx.globalAlpha = 1.0
             return

        ctx.fillStyle = f'rgba(0, 255, 255, {self.health/50})'
        chunk = 10
        rows = self.height // chunk
        cols = self.width // chunk
        for r in range(rows):
            for c in range(cols):
                if r > rows - 4 and (c > 3 and c < cols - 4): continue
                if r == 0 and (c == 0 or c == cols - 1): continue
                if self.health < 25 and random.random() < 0.2: continue # Glitch
                ctx.fillRect(self.x + c*chunk, self.y + r*chunk, chunk-1, chunk-1)

# Assets
player_img = js.window.Image.new()
player_img.src = "/games/spaceinvaders/assets/spaceship.png"

# Enemy Assets
enemy_imgs = {
    'squid_green': js.window.Image.new(),
    'crab_purple': js.window.Image.new(),
    'octopus_red': js.window.Image.new(),
    'octopus_green': js.window.Image.new(),
    'crab_blue':js.window.Image.new(),
    'invader_default': js.window.Image.new() # Fallback for level 1 purple
}
enemy_imgs['squid_green'].src = "/games/spaceinvaders/assets/invader_squid_green.png"
enemy_imgs['crab_purple'].src = "/games/spaceinvaders/assets/invader.png" # The generic one used as purple/default
enemy_imgs['octopus_red'].src = "/games/spaceinvaders/assets/invader_octopus_red.png"
enemy_imgs['octopus_green'].src = "/games/spaceinvaders/assets/invader_squid_green.png" # Reuse? Or allow fallback
enemy_imgs['crab_blue'].src = "/games/spaceinvaders/assets/invader_crab_blue.png"
enemy_imgs['invader_default'].src = "/games/spaceinvaders/assets/invader.png"

boss_img = js.window.Image.new()
boss_img.src = "/games/spaceinvaders/assets/boss.png"

shield_img = js.window.Image.new()
shield_img.src = "/games/spaceinvaders/assets/invader_shield.png"


# Game State Enums
class GameStateEnum:
    PLAYING = 1
    GAME_OVER = 2

# Core Classes
class Particle:
    def __init__(self, x, y, color, speed, life):
        self.x = x
        self.y = y
        angle = random.uniform(0, 6.28)
        self.vx = math.cos(angle) * speed
        self.vy = math.sin(angle) * speed
        self.color = color
        self.life = life
        self.max_life = life
        self.size = random.randint(2, 4)

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.life -= 1
        self.size = max(0, self.size - 0.05)
        
    def draw(self, ctx):
        if self.life <= 0: return
        ctx.globalAlpha = self.life / self.max_life
        ctx.fillStyle = self.color
        ctx.fillRect(self.x, self.y, self.size, self.size)
        ctx.globalAlpha = 1.0

class Star:
    def __init__(self):
        self.reset(random.randint(0, SCREEN_HEIGHT))
        
    def reset(self, y=0):
        self.x = random.randint(0, SCREEN_WIDTH)
        self.y = y
        self.z = random.uniform(0.5, 3.0) # Depth/Speed
        self.size = 1 if self.z < 1.5 else 2
        
    def update(self):
        self.y += self.z * 0.5 # Scroll speed
        if self.y > SCREEN_HEIGHT:
            self.reset(0)
            
    def draw(self, ctx):
        alpha = min(1.0, 0.3 + (self.z / 3.0) * 0.7)
        ctx.fillStyle = f"rgba(255,255,255,{alpha})"
        ctx.fillRect(self.x, self.y, self.size, self.size)

class Projectile:
    def __init__(self, x, y, type_id, vx=0, vy=0):
        self.x = x
        self.y = y
        self.type_id = type_id
        self.active = True
        self.width = 4
        self.height = 10
        self.vx = vx
        self.vy = vy if vy != 0 else (-8 if 'player' in type_id else 4)
        
        if type_id == 'player_laser': self.color = '#00FF00'
        elif type_id == 'player_rapid': self.color = '#FFFF00'; self.vy = -12
        elif type_id == 'player_spread': self.color = '#FF00FF'; self.vy = -8
        else: self.color = '#FF0000'

    def update(self):
        self.x += self.vx
        self.y += self.vy
        if self.y < -10 or self.y > SCREEN_HEIGHT + 10 or self.x < -10 or self.x > SCREEN_WIDTH + 10:
            self.active = False
            
    def draw(self, ctx):
        ctx.save()
        ctx.shadowBlur = 10
        ctx.shadowColor = self.color
        ctx.fillStyle = self.color
        
        if 'player' in self.type_id:
             ctx.fillRect(self.x, self.y, 4, 15)
             ctx.fillStyle = '#FFFFFF'
             ctx.fillRect(self.x + 1, self.y, 2, 15)
        else:
             ctx.fillRect(self.x, self.y, self.width, self.height)
        ctx.restore()

class Enemy:
    def __init__(self, x, y, sprite_key, row, col, behavior='normal'):
        self.x = x
        self.y = y
        self.row = row
        self.col = col
        self.width = ENEMY_WIDTH
        self.height = ENEMY_HEIGHT
        self.direction = 1
        self.active = True
        self.sprite_key = sprite_key
        self.behavior = behavior # 'normal', 'diver', 'shooter'
        
        # Dive Bomb State
        self.state = 'GRID' # GRID, DIVING, RETURNING
        self.dive_vx = 0
        self.dive_vy = 0

    def draw(self, ctx):
        img_raw = enemy_imgs.get(self.sprite_key)
        # Use cleaner if available
        img = get_clean_sprite(self.sprite_key, img_raw)
        
        if img:
            ctx.drawImage(img, self.x, self.y, self.width, self.height)
        else:
            ctx.fillStyle = '#FF00FF'
            ctx.fillRect(self.x, self.y, self.width, self.height)

class Boss:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = BOSS_WIDTH
        self.height = BOSS_HEIGHT
        self.health = 500 # Reduced from 1000
        self.max_health = 500
        self.direction = 1
        self.active = True
        self.attack_timer = 0
        self.frame_count = 0
        
    def update(self):
        self.attack_timer += 1
        self.frame_count += 1
        
        # Horizontal Movement
        self.x += self.direction * 2 # Reduced Speed from 4 to 2
        if self.x > SCREEN_WIDTH - self.width - 20:
            self.direction = -1
        elif self.x < 20:
            self.direction = 1
            
        # Vertical Hover (Sine Wave)
        # Keeps boss safe distance from player (base Y 100, +/- 50px)
        self.y = 100 + math.sin(self.frame_count * 0.03) * 50
        
    def draw(self, ctx):
        if not self.active: return
        img_raw = boss_img
        img = get_clean_sprite('boss', img_raw)
        
        if img:
             ctx.drawImage(img, self.x, self.y, self.width, self.height)
        else:
            ctx.fillStyle = '#9900FF'
            ctx.fillRect(self.x, self.y, self.width, self.height)
        
        # Boss Bar
        ctx.fillStyle = '#555555'
        ctx.fillRect(self.x, self.y - 15, self.width, 10)
        ctx.fillStyle = '#00FF00'
        hp_pct = max(0, self.health / self.max_health)
        if hp_pct < 0.3: ctx.fillStyle = '#FF0000'
        ctx.fillRect(self.x, self.y - 15, self.width * hp_pct, 10)

class Shield:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = 80
        self.height = 60 
        self.health = 50
        
    def draw(self, ctx):
        if self.health <= 0: return
        
        # Use generated image if available, else fallback
        img = get_clean_sprite('shield', shield_img)

        
        if img:
             # Draw full opacity first time, then fade
             ctx.globalAlpha = self.health / 50.0
             ctx.drawImage(img, self.x, self.y, self.width, self.height)
             ctx.globalAlpha = 1.0
             return

        ctx.fillStyle = f'rgba(0, 255, 255, {self.health/50})'
        chunk = 10
        rows = self.height // chunk
        cols = self.width // chunk
        for r in range(rows):
            for c in range(cols):
                if r > rows - 4 and (c > 3 and c < cols - 4): continue
                if r == 0 and (c == 0 or c == cols - 1): continue
                if self.health < 25 and random.random() < 0.2: continue # Glitch
                ctx.fillRect(self.x + c*chunk, self.y + r*chunk, chunk-1, chunk-1)

class Game:
    def __init__(self, ):
        self.stars = [Star() for _ in range(100)]
        self.particles = []
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
        self.last_shot_time = 0
        self.enemy_shoot_timer = 120 # Start with a delay
        self.spawn_enemies()
        self.spawn_shields()
        self.score_submitted = False
        try: js.window.pyodide.globals['score_submitted'] = False
        except: pass
        try: js.window.setGameOver(False)
        except: pass

    def spawn_particles(self, x, y, color, count=10):
        for _ in range(count):
            self.particles.append(Particle(x, y, color, random.uniform(2, 6), random.randint(10, 30)))

    def spawn_enemies(self):
        self.projectiles = []
        self.enemies = [] 
        
        if self.level == 5:
            # Boss Level 1
            self.boss = Boss(SCREEN_WIDTH//2 - BOSS_WIDTH//2, 90)
            try: js.window.triggerSFX('start')
            except: pass
            return
            
        elif self.level == 10:
            # Boss Level 2 (Harder)
            self.boss = Boss(SCREEN_WIDTH//2 - BOSS_WIDTH//2, 90)
            self.boss.health = 1000
            self.boss.max_health = 1000
            try: js.window.triggerSFX('start')
            except: pass
            return

        # Level Definitions based on request
        start_x = 50
        start_y = 50
        rows_def = []
        
        if self.level == 1:
            # 4 rows of purple invaders
            for _ in range(4): rows_def.append('invader_default')
            
        elif self.level == 2:
            # 2 rows purple, 2 rows blue
            for _ in range(2): rows_def.append('invader_default')
            for _ in range(2): rows_def.append('crab_blue')
            
        elif self.level == 3:
            # 2 rows blue, 2 rows red octopus
            for _ in range(2): rows_def.append('crab_blue')
            for _ in range(2): rows_def.append('octopus_red')
            
        elif self.level == 4:
            # 2 rows red octopus, 2 rows green octopus
            for _ in range(2): rows_def.append('octopus_red')
            for _ in range(2): rows_def.append('octopus_green') 
            
        elif self.level == 6:
            # 1 row purple, 1 row blue, 1 row red, 1 row green
            rows_def = ['invader_default', 'crab_blue', 'octopus_red', 'octopus_green']
            
        elif self.level == 7:
            # 1 row blue, 2 row red, 1 row green
            rows_def = ['crab_blue', 'octopus_red', 'octopus_red', 'octopus_green']
            
        elif self.level == 8:
            # 1 row blue, 1 row red, 2 row green
            rows_def = ['crab_blue', 'octopus_red', 'octopus_green', 'octopus_green']
            
        elif self.level == 9:
            # 3 row green, 1 row red
            rows_def = ['octopus_green', 'octopus_green', 'octopus_green', 'octopus_red']
            
        else:
            # Post-boss infinity scaling (Level 11+)
            # 25% Chance for Boss + Invaders
            if random.random() < 0.25:
                # Spawn Boss (Hard)
                self.boss = Boss(SCREEN_WIDTH//2 - BOSS_WIDTH//2, 90)
                self.boss.health = 1000
                self.boss.max_health = 1000
                try: js.window.triggerSFX('start')
                except: pass
                
                # ... and Lesser Invaders (2 rows only)
                pool = ['invader_default', 'crab_blue', 'octopus_red', 'octopus_green']
                rows_def = [random.choice(pool) for _ in range(2)]
            else:
                # Standard Infinity (4 rows)
                pool = ['invader_default', 'crab_blue', 'octopus_red', 'octopus_green']
                rows_def = [random.choice(pool) for _ in range(4)]

        for r, sprite_key in enumerate(rows_def):
            for col in range(8): # 8 columns
                e = Enemy(start_x + col * 60, start_y + r * 50, sprite_key, r, col)
                
                # Special Behaviors
                if sprite_key == 'crab_blue':
                    if self.level >= 2 and random.random() < 0.3: e.behavior = 'diver' 
                elif sprite_key == 'octopus_red':
                    e.behavior = 'shooter_spread' 
                elif sprite_key == 'octopus_green':
                    e.behavior = 'shooter_aimed'
                
                self.enemies.append(e)

        # Cap divers
        divers = [e for e in self.enemies if e.behavior == 'diver']
        if len(divers) > 4:
             for i in range(4, len(divers)):
                 divers[i].behavior = 'normal'

    def spawn_shields(self):
        # Center the shield: ScreenCenter (400) - HalfShieldWidth (50) = 350
        self.shields = [Shield(SCREEN_WIDTH // 2 - 50, 350)]

    def update(self):
        for s in self.stars: s.update()
        for p in self.particles: p.update()
        self.particles = [p for p in self.particles if p.life > 0]

        if self.state != GameStateEnum.PLAYING: return
        
        # Projectiles
        for p in self.projectiles: p.update()
        self.projectiles = [p for p in self.projectiles if p.active]
        
        # BOSS
        if self.boss and self.boss.active:
            self.boss.update()
            if self.boss.attack_timer > 90: # Slower Attack (1.5s)
                self.boss.attack_timer = 0
                self.projectiles.append(Projectile(self.boss.x + 20, self.boss.y + 60, 'enemy_laser'))
                self.projectiles.append(Projectile(self.boss.x + self.boss.width - 20, self.boss.y + 60, 'enemy_laser'))
                self.projectiles.append(Projectile(self.boss.x + self.boss.width//2, self.boss.y + 60, 'enemy_laser'))
            
            for p in self.projectiles:
                if not p.active: continue
                if 'player' in p.type_id and \
                   p.x > self.boss.x and p.x < self.boss.x + self.boss.width and \
                   p.y > self.boss.y and p.y < self.boss.y + self.boss.height:
                       p.active = False
                       self.boss.health -= 10
                       self.spawn_particles(p.x, p.y, '#9900FF', 5)
                       try: js.window.triggerSFX('enemy_hit')
                       except: pass
                       if self.boss.health <= 0:
                           self.boss.active = False
                           self.score += 5000
                           self.spawn_particles(self.boss.x + self.boss.width//2, self.boss.y + self.boss.height//2, '#FF00FF', 100)
                           self.level += 1
                           self.spawn_enemies()

        # Enemy Logic
        enemy_move_down = False
        game_speed = 0.5 + (self.score / 10000) 
        
        # FIX: Cooldown-based Shooting System
        # Level 1: ~2.5s cooldown (150 frames). Burst chance low.
        # Level 5: ~1.0s cooldown (60 frames). Burst chance higher.
        
        if self.enemy_shoot_timer > 0:
            self.enemy_shoot_timer -= 1
        else:
            # Time to shoot!
            candidates = [e for e in self.enemies if e.active]
            if candidates:
                # Determine how many shots
                num_shots = 1
                burst_chance = 0.05 + (self.level * 0.05) # Lvl 1: 10%, Lvl 5: 30%
                if random.random() < burst_chance:
                    num_shots = random.randint(2, 3)
                
                # Pick shooters
                for _ in range(num_shots):
                    if not candidates: break
                    shooter = random.choice(candidates)
                    candidates.remove(shooter) # Don't start same guy twice in one burst ideally
                    
                    # Fire logic
                    if shooter.behavior == 'shooter_spread':
                         self.projectiles.append(Projectile(shooter.x+shooter.width//2, shooter.y+shooter.height, 'enemy_laser', vx=-2, vy=4))
                         self.projectiles.append(Projectile(shooter.x+shooter.width//2, shooter.y+shooter.height, 'enemy_laser', vx=2, vy=4))
                    elif shooter.behavior == 'shooter_aimed':
                         dx = self.playerX - shooter.x
                         dy = self.playerY - shooter.y
                         dist = math.sqrt(dx*dx + dy*dy)
                         if dist > 0:
                             p_vx = (dx/dist) * 5
                             p_vy = (dy/dist) * 5
                             self.projectiles.append(Projectile(shooter.x+shooter.width//2, shooter.y+shooter.height, 'enemy_laser', vx=p_vx, vy=p_vy))
                    else:
                         self.projectiles.append(Projectile(shooter.x+shooter.width//2, shooter.y+shooter.height, 'enemy_laser'))

            # Reset Timer
            # Lvl 1: 120-180 frames (2-3s). Lvl 5: 60-90 frames (1-1.5s)
            min_cd = max(60, 150 - (self.level * 15))
            max_cd = max(90, 210 - (self.level * 20))
            self.enemy_shoot_timer = random.randint(min_cd, max_cd)

        active_divers = len([e for e in self.enemies if e.state == 'DIVING'])

        # Update Enemies Loop (Move Only)
        for e in self.enemies:
            if not e.active: continue
            
            # COLLISION CHECK WITH PLAYER
            # Hitbox: Player is 64x64, Enemy is 48x48. 
            # Use smaller hitbox for fairness (padding 10)
            if e.x < self.playerX + PLAYER_WIDTH - 10 and \
               e.x + e.width > self.playerX + 10 and \
               e.y < self.playerY + PLAYER_HEIGHT - 10 and \
               e.y + e.height > self.playerY + 10:
                   
                # HIT!
                self.lives -= 1
                self.playerX = SCREEN_WIDTH // 2 - PLAYER_WIDTH // 2
                self.spawn_particles(self.playerX, self.playerY, '#FFFFFF', 20)
                try: js.window.triggerSFX('crash')
                except: pass
                
                # Check Death
                if self.lives <= 0:
                    self.state = GameStateEnum.GAME_OVER
                    try: js.window.setGameOver(True, self.score)
                    except: pass
                    if not getattr(self, 'score_submitted', False):
                        try: js.window.submitScore(self.score)
                        except: pass
                        self.score_submitted = True
                        try: js.window.pyodide.globals['score_submitted'] = True
                        except: pass
                pass # Don't break, allow multiple collisions? No, just handled one frame.

            # MOVEMENT
            if e.state == 'GRID':
                e.x += e.direction * game_speed
                
                if (e.direction == 1 and e.x + e.width > SCREEN_WIDTH - 20) or \
                   (e.direction == -1 and e.x < 20):
                    enemy_move_down = True
                
                # Check Dive Trigger (Max 1 active, rare chance)
                if e.behavior == 'diver' and active_divers < 1 and random.random() < 0.002:
                    e.state = 'DIVING'
                    dx = self.playerX - e.x
                    dy = self.playerY - e.y
                    dist = math.sqrt(dx*dx + dy*dy)
                    speed = 4
                    e.dive_vx = (dx / dist) * speed
                    e.dive_vy = (dy / dist) * speed
                    active_divers += 1

            elif e.state == 'DIVING':
                e.x += e.dive_vx
                e.y += e.dive_vy
                # Reset if off screen
                if e.y > SCREEN_HEIGHT + 50:
                     # FIX: Wrap Logic - Return to formation!
                     buddies = [b for b in self.enemies if b.active and b.state == 'GRID' and b is not e]
                     if buddies:
                         guide = buddies[0]
                         e.state = 'GRID'
                         # Snap relative to guide
                         e.x = guide.x + (e.col - guide.col) * 60
                         e.y = guide.y + (e.row - guide.row) * 50
                         e.direction = guide.direction
                     else:
                         e.state = 'DIVING'
                         e.y = -50
                         e.x = random.randint(50, SCREEN_WIDTH - 50)
                         dx = self.playerX - e.x
                         dy = self.playerY - e.y
                         dist = math.sqrt(dx*dx + dy*dy) if (dx*dx + dy*dy) > 0 else 1
                         speed = 4
                         e.dive_vx = (dx/dist) * speed
                         e.dive_vy = (dy/dist) * speed

        if enemy_move_down:
             for e in self.enemies:
                 e.direction *= -1

        # Collision System
        for p in self.projectiles:
            if not p.active: continue
            
            if 'player' in p.type_id:
                # Shield Hit - Reduced Hitbox
                for s in self.shields:
                     # Hitbox Margin: 15px from sides, 10px from top
                     sx = s.x + 15
                     sy = s.y + 10
                     sw = s.width - 30
                     sh = s.height - 15
                     
                     if s.health > 0 and \
                        p.x < sx + sw and p.x + p.width > sx and \
                        p.y < sy + sh and p.y + p.height > sy:
                         s.health -= 2
                         p.active = False
                         self.spawn_particles(p.x, p.y, '#00FFFF', 3)
                         try: js.window.triggerSFX('bounce')
                         except: pass
                         break
                if not p.active: continue

                # Enemy Hit
                for e in self.enemies:
                    if e.active and \
                       p.x < e.x + e.width and p.x + p.width > e.x and \
                       p.y < e.y + e.height and p.y + p.height > e.y:
                        e.active = False
                        p.active = False
                        self.score += 50
                        self.spawn_particles(e.x + e.width//2, e.y + e.height//2, '#00FF00', 8)
                        invaders_game.weapon_level = min(2, self.score // 1000)
                        try: js.window.triggerSFX('enemy_hit')
                        except: pass
                        break
                        
            elif 'enemy' in p.type_id:
                 # Shield Hit - Reduced Hitbox
                 for s in self.shields:
                     sx = s.x + 15
                     sy = s.y + 10
                     sw = s.width - 30
                     sh = s.height - 15
                     
                     if s.health > 0 and \
                        p.x < sx + sw and p.x + p.width > sx and \
                        p.y < sy + sh and p.y + p.height > sy:
                         s.health -= 2
                         p.active = False
                         self.spawn_particles(p.x, p.y, '#00FFFF', 3)
                         try: js.window.triggerSFX('bounce')
                         except: pass
                         break
                 if not p.active: continue

                 # Player Hit
                 player_hitbox_w = PLAYER_WIDTH - 10
                 player_hitbox_h = PLAYER_HEIGHT - 10
                 px = invaders_game.playerX + 5
                 py = invaders_game.playerY + 5
                 
                 if p.x < px + player_hitbox_w and \
                    p.x + p.width > px and \
                    p.y < py + player_hitbox_h and \
                    p.y + p.height > py:
                     p.active = False
                     invaders_game.lives -= 1
                     invaders_game.playerX = SCREEN_WIDTH // 2
                     self.spawn_particles(invaders_game.playerX, invaders_game.playerY, '#FFFFFF', 20)
                     try: js.window.triggerSFX('crash')
                     except: pass
                     if invaders_game.lives <= 0:
                         invaders_game.state = GameStateEnum.GAME_OVER
                         try: js.window.setGameOver(True, invaders_game.score)
                         except: pass
                         if not getattr(invaders_game, 'score_submitted', False):
                             try: js.window.submitScore(invaders_game.score)
                             except: pass
                             invaders_game.score_submitted = True
                             try: js.window.pyodide.globals['score_submitted'] = True
                             except: pass

        self.enemies = [e for e in self.enemies if e.active]
        if not self.enemies and (not self.boss or not self.boss.active):
            self.level += 1
            if self.level == 3: self.weapon_type = 'rapid'
            if self.level == 5: self.weapon_type = 'spread'
            self.spawn_enemies()

# Globals
invaders_game = Game()
input_cooldown = 0
KEY_LEFT = 2
KEY_RIGHT = 3
KEY_SPACE = 4

# Cleanup
try: js.document.removeEventListener('keydown', down_proxy); js.document.removeEventListener('keyup', up_proxy)
except: pass

def reset_game():
    invaders_game.reset()

def draw_hud():
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '24px "LowresPixel", monospace'
    ctx.textAlign = 'left'
    ctx.fillText(f"SCORE: {invaders_game.score}", 20, 30)
    ctx.textAlign = 'center'
    display_high = max(invaders_game.score, int(getattr(js.window, 'GLOBAL_HIGH_SCORE', 0)))
    ctx.fillText(f"TOP: {display_high}", 300, 30)
    ctx.fillText(f"LEVEL: {invaders_game.level}", 500, 30)
    ctx.textAlign = 'right'
    ctx.fillText(f"LIVES: {invaders_game.lives}", SCREEN_WIDTH - 20, 30)

def fire_weapon():
    current_time = time.time()
    cooldown = 0.3 # Reduced from 0.4
    if invaders_game.weapon_type == 'rapid': cooldown = 0.12 # Reduced from 0.15
    if invaders_game.weapon_type == 'spread': cooldown = 0.25 # Reduced from 0.3
    
    if current_time - invaders_game.last_shot_time < cooldown: return
    
    limit = 3
    if invaders_game.weapon_type == 'rapid': limit = 8
    if invaders_game.weapon_type == 'spread': limit = 6
    current_shots = len([p for p in invaders_game.projectiles if p.active and 'player' in p.type_id])
    
    if current_shots < limit:
        invaders_game.last_shot_time = current_time
        if invaders_game.weapon_type == 'spread':
             invaders_game.projectiles.append(Projectile(invaders_game.playerX + 28, invaders_game.playerY, 'player_laser'))
             p1 = Projectile(invaders_game.playerX + 10, invaders_game.playerY + 10, 'player_spread'); p1.vy = -6; p1.x -= 1
             p2 = Projectile(invaders_game.playerX + 46, invaders_game.playerY + 10, 'player_spread'); p2.vy = -6; p2.x += 1
             invaders_game.projectiles.append(p1); invaders_game.projectiles.append(p2)
        elif invaders_game.weapon_type == 'rapid':
             invaders_game.projectiles.append(Projectile(invaders_game.playerX + 28, invaders_game.playerY, 'player_rapid'))
        else:
             invaders_game.projectiles.append(Projectile(invaders_game.playerX + 28, invaders_game.playerY, 'player_laser'))
        try: js.window.triggerSFX('shoot')
        except: pass

def loop(timestamp):
    # Draw Background
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
    
    for s in invaders_game.stars: s.draw(ctx)
    
    # Input
    global input_cooldown
    if input_cooldown > 0: input_cooldown -= 1
    
    try:
        if fast_input.check(KEY_LEFT): invaders_game.playerX = max(0, invaders_game.playerX - PLAYER_SPEED)
        if fast_input.check(KEY_RIGHT): invaders_game.playerX = min(SCREEN_WIDTH - PLAYER_WIDTH, invaders_game.playerX + PLAYER_SPEED)
        if fast_input.check(KEY_SPACE) and input_cooldown == 0:
            fire_weapon()
            input_cooldown = 20
    except: pass
        
    invaders_game.update()
    
    # Draw
    if is_image_loaded(player_img):
        ctx.drawImage(player_img, invaders_game.playerX, invaders_game.playerY, PLAYER_WIDTH, PLAYER_HEIGHT)
    else:
        ctx.fillStyle = '#00FF00'; ctx.fillRect(invaders_game.playerX, invaders_game.playerY, PLAYER_WIDTH, PLAYER_HEIGHT)
        
    for e in invaders_game.enemies: e.draw(ctx)
    if invaders_game.boss: invaders_game.boss.draw(ctx)
    for p in invaders_game.projectiles: p.draw(ctx)
    for s in invaders_game.shields: s.draw(ctx)
    for p in invaders_game.particles: p.draw(ctx)
    
    draw_hud()
    
    global req_id
    req_id = js.window.requestAnimationFrame(proxy_loop)
    js.window.invaders_req_id = req_id

proxy_loop = create_proxy(loop)

if hasattr(js.window, 'invaders_req_id'):
    js.window.cancelAnimationFrame(js.window.invaders_req_id)
req_id = js.window.requestAnimationFrame(proxy_loop)
js.window.invaders_req_id = req_id

def cleanup():
    if hasattr(js.window, 'invaders_req_id'):
        js.window.cancelAnimationFrame(js.window.invaders_req_id)
    try: js.window.cancelAnimationFrame(req_id)
    except: pass
    try: proxy_loop.destroy()
    except: pass
