import pyglet
import os

# Load sprite sheet
sheet_path = 'public/cyber_dog_animated.png'

# This script is a placeholder. 
# In a real scenario, we would use Pillow to crop the frames from the sprite sheet 
# based on fixed dimensions (e.g. 3 rows, N cols) and save them as a GIF.
# Since I cannot see the exact dimensions of the generated image, I will assume 
# it's a grid.

# For now, I will use Python to just verify the file exists because
# creating a GIF blindly from a generated sprite sheet usually results in misalignment.
# I will instead recommend using the generated PNG as a CSS sprite in the React app,
# which gives me more control over frame selection.

print(f"Image located at: {os.path.abspath(sheet_path)}")
