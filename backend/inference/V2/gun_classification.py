import os
import cv2
import torch
import pathlib
import numpy as np
import pandas as pd
from PIL import Image
from pathlib import Path
from ultralytics import YOLO

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(os.path.dirname(current_dir))

# 📁 Path หลักของ Model ต่าง ๆ
path_model_5MSegment = os.path.join(backend_dir, "model", "Model V2", "5M_Segment", "best_v8.pt")
path_model_CLS_Brand = os.path.join(backend_dir, "model", "Model V2", "Model-CLS-Brand V1", "best.pt")
path_model_CLS_MGUN = os.path.join(backend_dir, "model", "Model V2", "Model-CLS-MGun-V1")
path_model_CLS_MGUN = Path(path_model_CLS_MGUN)

# ✅ Dictionary ของชื่อแบรนด์ (index -> brand)
brand_map = {
    0: 'BERETTA', 1: 'CZ', 2: 'Colt', 3: 'GLOCK', 4: 'Kimber', 5: 'LES BAER',
    6: 'Mauser', 7: 'Norinco', 8: 'SIG', 9: 'Smith & wesson', 10: 'Sphinx', 11: 'Walther'
}

# 🔍 สร้าง mapping จากชื่อแบรนด์ → ชื่อโฟลเดอร์
def find_model_path_for_brand(brand_name):
    for folder in path_model_CLS_MGUN.iterdir():
        if folder.is_dir() and brand_name.lower() in folder.name.lower():
            model_path = folder / "best.pt"
            if model_path.exists():
                return str(model_path)
    return None

# ✅ สร้าง DataFrame
records = []
for idx, brand in brand_map.items():
    path = find_model_path_for_brand(brand)
    if path:
        records.append({"index": idx, "brand": brand, "path": path})

df_models = pd.DataFrame(records)

# ===== Load Models =====
model_segment = YOLO(path_model_5MSegment)
model_brand = YOLO(path_model_CLS_Brand)
model_map = {row['brand']: YOLO(row['path']) for _, row in df_models.iterrows()}

# ===== Class Map from Segment =====
segment_classes = {0: 'BigGun', 1: 'Bullet', 2: 'Drug', 3: 'Magazine', 4: 'PackageDrug', 5: 'Pistol', 6: 'Revolver'}
#segment_classes = {0: '0', 1: 'Bullet', 2: 'Drug', 3: 'GUN', 4: 'Magazine', 5: 'PackageDrug'}


# ===== Utils =====
def crop_mask_on_white(img, mask):
    # Resize mask ให้ตรงกับ shape ของ image
    if mask.shape != img.shape[:2]:
        mask = cv2.resize(mask.astype(np.uint8), (img.shape[1], img.shape[0]), interpolation=cv2.INTER_NEAREST)

    white_bg = np.ones_like(img) * 255
    mask = mask.astype(bool)

    # Apply mask to each channel
    for c in range(3):
        white_bg[:, :, c][mask] = img[:, :, c][mask]
    return white_bg

def get_top3(pred, class_names):
    probs = pred.probs.data.cpu().numpy()
    top3 = probs.argsort()[-3:][::-1]
    return [{"label": class_names[i], "confidence": round(float(probs[i]), 2)} for i in top3]

# ===== Main pipeline =====
def process_image(image_path):
    image = cv2.imread(image_path)
    results = model_segment(image)[0]

    objects = []

    for i, mask in enumerate(results.masks.data):
        cls_id = int(results.boxes.cls[i].item())
        cls_name = segment_classes.get(cls_id, "Unknown")

        # Create cropped object on white background
        cropped = crop_mask_on_white(image, mask.cpu().numpy())
        crop_path = f"cropped_object_{i}_{cls_name}.jpg"
        cv2.imwrite(crop_path, cropped)

        obj_data = {
            "object_index": i,
            "class": cls_name,
            "cropped_path": crop_path
        }

        if cls_name in ['GUN', 'Pistol']:
            # Predict Brand
            pred_brand = model_brand(cropped)[0]
            brand_top3 = get_top3(pred_brand, model_brand.names)
            selected_brand = brand_top3[0]['label']
            obj_data["brand_top3"] = brand_top3
            obj_data["selected_brand"] = selected_brand

            # Predict Model from brand-specific model
            if selected_brand in model_map:
                model_model = model_map[selected_brand]
                pred_model = model_model(cropped)[0]
                model_top3 = get_top3(pred_model, model_model.names)
                selected_model = model_top3[0]['label']
                obj_data["model_top3"] = model_top3
                obj_data["selected_model"] = selected_model
            else:
                obj_data["model_top3"] = []
                obj_data["selected_model"] = "Unknown"
        else:
            obj_data["note"] = "Not a GUN, brand/model skipped"

        if cls_name == 'Drug':
            objects.append(obj_data)

    return {
        "original_image": image_path,
        "detected_objects": objects
    }

#result = process_image("C:/Users/Kawee Lekmuenwai/Desktop/ปืนให้น้อง/Browning Hi power/IMG_0564_resize.JPG")
result = process_image("C:/Users/Kawee Lekmuenwai/งานโค้ด/Website/Pratyamic/glock.png")

import json
print(json.dumps(result, indent=2))