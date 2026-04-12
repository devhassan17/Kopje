from PIL import Image

# Load the coffee cup image
img = Image.open("media/graphics/game/ingame/coffee_cup.png").convert("RGBA")
pixels = img.getdata()

new_pixels = []
for r, g, b, a in pixels:
    # Remove near-white/near-grey background pixels
    # Background is light: r,g,b all > 180 and roughly equal (grey/white)
    is_background = (
        r > 180 and g > 180 and b > 180 and
        abs(int(r) - int(g)) < 25 and
        abs(int(g) - int(b)) < 25
    )
    if is_background:
        new_pixels.append((r, g, b, 0))  # fully transparent
    else:
        new_pixels.append((r, g, b, a))

img.putdata(new_pixels)
img.save("media/graphics/game/ingame/coffee_cup.png", "PNG")
print("Done! Background removed from coffee_cup.png")
