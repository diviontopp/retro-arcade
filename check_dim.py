from PIL import Image
try:
    with Image.open("public/cyber_dog_animated.png") as img:
        print(f"Dimensions: {img.width}x{img.height}")
except Exception as e:
    print(f"Error: {e}")
