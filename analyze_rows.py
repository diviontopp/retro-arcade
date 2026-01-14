from PIL import Image
import numpy as np

def analyze():
    src = "public/cyber_dog_animated.png"
    img = Image.open(src).convert('L')
    arr = np.array(img)
    
    # Sum brightness across columns to get a Y profile
    profile = np.sum(arr, axis=1) # (1024,)
    
    # Threshold
    limit = 5000 
    
    active_indices = np.where(profile > limit)[0]
    
    if len(active_indices) == 0:
        print("Empty")
        return

    # Find clusters
    dataset = []
    start = active_indices[0]
    prev = active_indices[0]
    
    for y in active_indices[1:]:
        if y > prev + 5: # Gap of 5px
            dataset.append((start, prev))
            start = y
        prev = y
    dataset.append((start, prev))
    
    print(f"Found {len(dataset)} main strips:")
    for i, (s, e) in enumerate(dataset):
        center = (s+e)//2
        height = e-s
        print(f"Strip {i}: Start {s}, End {e}, Height {height}, Center {center}")

if __name__ == "__main__":
    analyze()
