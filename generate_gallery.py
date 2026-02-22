import os
import shutil
import json
import sys
from PIL import Image

# Fix pro kódování ve Windows konzoli
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

Image.MAX_IMAGE_PIXELS = None

# --- KONFIGURACE ---
input_dir = "images_original"
output_dir = "images"
output_file = "gallery_list.js"
max_width = 1200

def get_creation_time(path):
    stat = os.stat(path)
    try:
        return stat.st_birthtime
    except AttributeError:
        # Na Windows je st_ctime čas vytvoření
        return stat.st_ctime

# 1️⃣ Vyčištění starého výstupu
if os.path.exists(output_dir):
    shutil.rmtree(output_dir)
os.makedirs(output_dir, exist_ok=True)

# 2️⃣ Načtení a seřazení složek (nejnovější jako první)
subfolders = [
    os.path.join(input_dir, d) 
    for d in os.listdir(input_dir) 
    if os.path.isdir(os.path.join(input_dir, d)) and not d.startswith('.')
]
subfolders.sort(key=get_creation_time, reverse=True)

# gallery je nyní POLE (Array) pro zachování pořadí
gallery = []

print(f"Zpracovávám {len(subfolders)} složek...")

# 3️⃣ Zpracování fotek
for folder_path in subfolders:
    folder_name = os.path.basename(folder_path)
    images_list = []
    
    files = sorted(os.listdir(folder_path))
    
    for f in files:
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            img_path = os.path.join(folder_path, f)
            try:
                img = Image.open(img_path)
                
                # Resize
                w_percent = max_width / float(img.width)
                h_size = int(img.height * w_percent)
                img = img.resize((max_width, h_size), Image.Resampling.LANCZOS)
                
                # Unikátní název souboru
                safe_file_name = f"{folder_name}_{f}".replace(" ", "_")
                out_path = os.path.join(output_dir, safe_file_name)
                
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                    
                img.save(out_path, "JPEG", quality=85)
                images_list.append(f"{output_dir}/{safe_file_name}")
                
            except Exception as e:
                print(f"Chyba u {img_path}: {e}")
    
    if images_list:
        # Uložíme jako objekt do pole
        gallery.append({
            "folder": folder_name,
            "files": images_list
        })
        print(f"OK: '{folder_name}' ({len(images_list)} fotek)")

# 4️⃣ Export do JS (v novém formátu Pole)
try:
    with open(output_file, "w", encoding="utf-8") as f:
        json_data = json.dumps(gallery, indent=2, ensure_ascii=False)
        f.write(f"const images = {json_data};")
    print(f"\nHotovo! Seznam uložen do {output_file}")
except Exception as e:
    print(f"Chyba při zápisu: {e}")