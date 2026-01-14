from PIL import Image
import numpy as np

def visualize_map():
    src = "public/cyber_dog_animated.png"
    img = Image.open(src).convert('L') # Grayscale
    arr = np.array(img)
    
    h, w = arr.shape
    
    # Compress chunks (32x32 blocks)
    block_size = 32
    rows = h // block_size
    cols = w // block_size
    
    print("Density Map (Dark . | Bright #):")
    print("   " + "".join([str(i%10) for i in range(cols)]))
    
    regions = []
    
    for r in range(rows):
        line = f"{r:2} "
        row_has_content = False
        for c in range(cols):
            y1, y2 = r*block_size, (r+1)*block_size
            x1, x2 = c*block_size, (c+1)*block_size
            
            chunk = arr[y1:y2, x1:x2]
            mean = np.mean(chunk)
            
            if mean > 20: # arbitrary brightness threshold
                line += "#"
                row_has_content = True
            else:
                line += "."
        print(line)

if __name__ == "__main__":
    visualize_map()
