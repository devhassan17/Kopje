from PIL import Image
import sys
import os

def make_transparent(image_path, output_path, target_color=(255, 255, 255), threshold=50):
    img = Image.open(image_path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        # Check if the color is close to the target color (white)
        # Using a threshold to account for slight variations
        if all(abs(item[i] - target_color[i]) < threshold for i in range(3)):
            new_data.append((255, 255, 255, 0)) # Fully transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python transform.py <input> <output>")
        sys.exit(1)
        
    make_transparent(sys.argv[1], sys.argv[2])
