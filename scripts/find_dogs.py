from PIL import Image
import numpy as np

def find_dogs():
    img = Image.open("public/cyber_dog_animated.png").convert('L')
    arr = np.array(img)
    
    # Sum horizontal brightness to get vertical profile
    # shape (1024, 1024) -> (1024,)
    profile = np.sum(arr, axis=1)
    
    # Threshold for "content" vs "black background"
    # A full row of pixels even if dark grey will sum up.
    # 1024 width * 10 value = 10000.
    threshold = 5000 
    
    active = np.where(profile > threshold)[0]
    
    if len(active) == 0:
        print("No content?")
        return

    # Group into ranges
    ranges = []
    start = active[0]
    last = active[0]
    
    for y in active[1:]:
        if y > last + 20: # If gap > 20px, new section
            ranges.append((start, last))
            start = y
        last = y
    ranges.append((start, last))
    
    print(f"Found {len(ranges)} vertical blocks:")
    
    valid_blocks = []
    for i, (s, e) in enumerate(ranges):
        h = e - s
        center = (s + e) // 2
        print(f"Block {i}: Y={s} to {e} (Height: {h}) Center={center}")
        
        if h > 100: # Filter out text labels (usually < 50px height)
            valid_blocks.append((s, e))
            
    print(f"\nidentified {len(valid_blocks)} likely Dog Rows:")
    for i, (s, e) in enumerate(valid_blocks):
        print(f"Dog Row {i}: {s}-{e} (Center: {(s+e)//2})")

if __name__ == "__main__":
    find_dogs()
