import os
from PIL import Image

def remove_white_bg(img_path):
    try:
        img = Image.open(img_path).convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # Check if pixel is white or near-white (threshold 230)
            if item[0] > 230 and item[1] > 230 and item[2] > 230:
                newData.append((255, 255, 255, 0)) # transparent
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(img_path, "PNG")
        print(f"Processed: {img_path}")
    except Exception as e:
        print(f"Error processing {img_path}: {e}")

base_dir = "/home/maxim/Projeler/Clinical-case-share-api-main/frontend/public/animations"
images = ["ai-icon.png", "rag-icon.png", "secure-icon.png"]

for img in images:
    remove_white_bg(os.path.join(base_dir, img))
