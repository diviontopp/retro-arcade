from PIL import Image
import numpy as np

files = ['paddle', 'ball', 'brick_red', 'brick_orange', 'brick_yellow', 'brick_blue', 'brick_green', 'brick_purple']

for name in files:
    try:
        img = Image.open(f'public/assets/breakout/{name}.png').convert('RGBA')
        data = np.array(img)
        
        # Remove pink/magenta background (RGB values around 255, 0, 255)
        pink_mask = (data[:,:,0] > 200) & (data[:,:,1] < 100) & (data[:,:,2] > 200)
        data[pink_mask] = [0, 0, 0, 0]  # Make transparent
        
        # Save back
        Image.fromarray(data).save(f'public/assets/breakout/{name}.png')
        print(f'Fixed {name}.png')
    except Exception as e:
        print(f'Error with {name}: {e}')
