from PIL import Image
import numpy as np

def analyze_cols():
    img = Image.open("public/cyber_dog_animated.png").convert('L')
    arr = np.array(img)
    
    # Analyze Block 0 (Row 1-ish)
    # Y = 65 to 361
    row_slice = arr[65:361, :]
    
    # Sum vertical brightness to get horizontal profile
    profile = np.sum(row_slice, axis=0) # (1024,)
    
    limit = 2000 
    active = np.where(profile > limit)[0]

    ranges = []
    if len(active) > 0:
        start = active[0]
        prev = active[0]
        for x in active[1:]:
            if x > prev + 10:
                ranges.append((start, prev))
                start = x
            prev = x
        ranges.append((start, prev))
        
    print(f"Found {len(ranges)} sprites in Row 1:")
    for i, (s, e) in enumerate(ranges):
        w = e - s
        center = (s+e)//2
        print("---")
        print(f"Sprite {i}")
        print(f"Start: {s}")
        print(f"End: {e}")
        print(f"Width: {w}")
        print(f"Center: {center}")

if __name__ == "__main__":
    analyze_cols()
