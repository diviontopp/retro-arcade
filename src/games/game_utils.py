import js
import random
import math

SCREEN_WIDTH = 640
SCREEN_HEIGHT = 480

class Particle:
    def __init__(self, x, y, color, life=1.0, speed=10):
        self.x = x
        self.y = y
        angle = random.random() * 2 * math.pi
        mag = random.random() * speed
        self.vx = math.cos(angle) * mag
        self.vy = math.sin(angle) * mag
        self.life = life
        self.color = color
        self.decay = 0.05

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.life -= self.decay

    def draw(self, ctx):
        ctx.globalAlpha = max(0, self.life)
        ctx.fillStyle = self.color
        ctx.fillRect(self.x, self.y, 4, 4)
        ctx.globalAlpha = 1.0

class ParticleSystem:
    def __init__(self):
        self.particles = []

    def spawn(self, x, y, color, count=10):
        for _ in range(count):
            self.particles.append(Particle(x, y, color))

    def update_and_draw(self, ctx):
        for p in self.particles:
            p.update()
            p.draw(ctx)
        self.particles = [p for p in self.particles if p.life > 0]

class ScreenShake:
    def __init__(self):
        self.intensity = 0

    def trigger(self, amount=10):
        self.intensity = amount

    def apply(self, ctx):
        if self.intensity > 0:
            dx = (random.random() - 0.5) * self.intensity
            dy = (random.random() - 0.5) * self.intensity
            ctx.translate(dx, dy)
            self.intensity *= 0.9
            if self.intensity < 0.5:
                self.intensity = 0
            return True # Applied
        return False

    def reset(self, ctx):
        # Always reset transform if we applied it
        ctx.setTransform(1, 0, 0, 1, 0, 0)
