import os
import shutil
import json
import sys
from PIL import Image

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

input_dir = "3d_original"
output_dir = "3d_data"
output_file = "3d_list.js"
max_width = 1200

def get_creation_time(path):
    stat = os.stat(path)
    try: return stat.st_birthtime
    except AttributeError: return stat.st_ctime

if os.path.exists(output_dir): shutil.rmtree(output_dir)
os.makedirs(output_dir, exist_ok=True)

subfolders = [os.path.join(input_dir, d) for d in os.listdir(input_dir) if os.path.isdir(os.path.join(input_dir, d)) and not d.startswith('.')]
subfolders.sort(key=get_creation_time, reverse=True)

models3d = []
print(f"Zpracovávám {len(subfolders)} 3D projektů...")

for folder_path in subfolders:
    folder_name = os.path.basename(folder_path)
    files = os.listdir(folder_path)
    
    stl_file = None
    images_list = []
    makerworld_url = ""
    
    # Detekce souborů
    for f in files:
        f_lower = f.lower()
        if f_lower.endswith(".stl"):
            stl_file = f
        elif f_lower.endswith((".jpg", ".jpeg", ".png", ".webp")):
            images_list.append(f)
        elif f_lower.endswith(".txt"):
            try:
                with open(os.path.join(folder_path, f), "r", encoding="utf-8") as txt:
                    makerworld_url = txt.read().strip()
            except: pass

    # Zpracování projektu
    if stl_file:
        safe_prefix = folder_name.replace(" ", "_")
        
        # 1. Zkopírování STL
        out_stl = f"{safe_prefix}_{stl_file.replace(' ', '_')}"
        shutil.copy2(os.path.join(folder_path, stl_file), os.path.join(output_dir, out_stl))
        
        # 2. Zpracování VŠECH obrázků
        out_images = []
        out_thumb = ""
        
        # Seřadíme obrázky (první abecedně bude brán jako náhled)
        for idx, img_name in enumerate(sorted(images_list)):
            img_path = os.path.join(folder_path, img_name)
            try:
                img = Image.open(img_path)
                w_percent = max_width / float(img.width)
                h_size = int(img.height * w_percent)
                img = img.resize((max_width, h_size), Image.Resampling.LANCZOS)
                
                out_img_name = f"{safe_prefix}_img_{idx}.jpg"
                out_img_path = os.path.join(output_dir, out_img_name)
                
                if img.mode in ("RGBA", "P"): img = img.convert("RGB")
                img.save(out_img_path, "JPEG", quality=85)
                
                saved_path = f"{output_dir}/{out_img_name}"
                out_images.append(saved_path)
                
                # První obrázek se použije na úvodní kartu
                if idx == 0:
                    out_thumb = saved_path
                    
            except Exception as e:
                print(f"Chyba u obrázku {img_name}: {e}")
        
        # 3. Zapsání do seznamu
        models3d.append({
            "name": folder_name,
            "stl": f"{output_dir}/{out_stl}",
            "thumbnail": out_thumb,
            "images": out_images,  # Zde ukládáme pole všech fotek projektu
            "makerworld_url": makerworld_url
        })
        print(f"OK: Projekt '{folder_name}' ({len(out_images)} fotek)")

# Export do JS
try:
    with open(output_file, "w", encoding="utf-8") as f:
        json_data = json.dumps(models3d, indent=2, ensure_ascii=False)
        f.write(f"const models3d = {json_data};")
    print(f"\nHotovo! Seznam 3D modelů uložen do {output_file}")
except Exception as e:
    print(f"Chyba při zápisu: {e}")