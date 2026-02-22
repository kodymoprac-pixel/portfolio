import os
import shutil
from PIL import Image
import json

from PIL import Image
# Přidejte tento řádek:
Image.MAX_IMAGE_PIXELS = None

# Nastavení složek
input_dir = "images_original"  # Zdrojové fotky
output_dir = "images"          # Cílové zmenšené fotky
output_file = "gallery_list.js"
max_width = 1000               # Maximální šířka

# 1️⃣ Vyčištění staré galerie
if os.path.exists(output_dir):
    shutil.rmtree(output_dir)
os.makedirs(output_dir, exist_ok=True)

# 2️⃣ Získání složek a jejich seřazení podle data (od nejnovější)
subfolders = [
    os.path.join(input_dir, d) 
    for d in os.listdir(input_dir) 
    if os.path.isdir(os.path.join(input_dir, d))
]

# Sort podle mtime (modify time) - reverse=True zajistí nejnovější nahoře
subfolders.sort(key=lambda x: os.path.getmtime(x), reverse=True)

gallery = {}

# 3️⃣ Zpracování fotek v seřazených složkách
for folder_path in subfolders:
    folder_name = os.path.basename(folder_path)
    images_list = []
    
    # Seřadíme i soubory uvnitř složky (např. podle názvu 01.jpg, 02.jpg...)
    files = sorted(os.listdir(folder_path))
    
    for f in files:
        if f.lower().endswith((".jpg", ".jpeg", ".png")):
            img_path = os.path.join(folder_path, f)
            
            # Resize pomocí Pillow
            img = Image.open(img_path)
            w_percent = max_width / float(img.width)
            h_size = int(img.height * w_percent)
            img = img.resize((max_width, h_size), Image.LANCZOS)
            
            # Uložení do ploché struktury v /images
            out_path = os.path.join(output_dir, f)
            img.save(out_path)
            
            images_list.append(f"{output_dir}/{f}")
    
    if images_list:
        gallery[folder_name] = images_list

# 4️⃣ Uložení do .js pro web
with open(output_file, "w", encoding="utf-8") as f:
    json_data = json.dumps(gallery, indent=2, ensure_ascii=False)
    f.write(f"const images = {json_data};")

print(f"Hotovo! Galerie je seřazena. Celkem zpracováno {len(gallery)} alb.")
