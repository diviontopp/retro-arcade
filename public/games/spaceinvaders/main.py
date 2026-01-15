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
PLAYER_SPEED = 4

# ... (inside update_game_logic)

def update_game_logic():
    # 1. Player
    # Use fast_input for zero latency check
    try:
        if fast_input.check(2): game.playerX -= PLAYER_SPEED # Left
        elif fast_input.check(3): game.playerX += PLAYER_SPEED # Right
    except:
        # Fallback to keys dict if fast_input fails
        if keys.get('arrowleft') or keys.get('a'): game.playerX -= PLAYER_SPEED
        elif keys.get('arrowright') or keys.get('d'): game.playerX += PLAYER_SPEED
        
    game.playerX = max(0, min(game.playerX, SCREEN_WIDTH - 64))

# ...

         if game.state == GameStateEnum.PLAYING:
            global input_cooldown
            
            # Check Space (Index 4)
            pressed = False
            try: pressed = fast_input.check(4)
            except: pressed = keys.get(" ") or keys.get("space")
            
            if pressed:
                input_cooldown += 1
                if input_cooldown > 25: # Increased from 8 to 25 (~400ms)
                     fire_weapon(); input_cooldown = 0
            else: 
                input_cooldown = 25 # Ready to fire immediately on first press

            
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
