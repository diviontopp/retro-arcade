from PIL import Image
import os

def slice_sprites():
    src = "public/cyber_dog_animated.png"
    if not os.path.exists(src):
        print("Source image not found!")
        return

    try:
        img = Image.open(src)
        width, height = img.size
        # Assuming 4x4 grid based on 1024x1024 input and standard generation
        # If the user prompt asked for 3 rows, likely the 4th is empty or junk, 
        # but the grid logic of 256x256 tiles is the most probable for 1024px squares.
        
        tile_w = width // 4
        
        # Centers for 4x4 Grid - Shifted DOWN (+20) and RIGHT (+15)
        centers_y = {
            'row0': 250, 
            'row1': 580, 
            'row3': 880 
        }
        
        centers_x = [143, 399, 655, 911]
        
        half_size = 70 # 140x140 box.
        
        targets = [
            ('row0', 250),
            ('row1', 580),
            ('row3', 880) 
        ]
        
        for name, cy in targets:
            top = max(0, cy - half_size)
            bottom = cy + half_size
            
            for col_idx, cx in enumerate(centers_x):
                left = max(0, cx - half_size)
                right = cx + half_size
                
                # Double check boundaries
                if right > 1024: right = 1024
                
                crop = img.crop((left, top, right, bottom))
                
                out_name = f"public/pets/dog_{name}_{col_idx}.png"
                crop.save(out_name)
                print(f"Saved {out_name}")

    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    slice_sprites()
