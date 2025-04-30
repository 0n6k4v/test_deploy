import os
import cv2
import numpy as np
import traceback
from typing import Optional
from pathlib import Path
from ultralytics import YOLO
import tempfile
from inference.pill_recognition import ImprovedPillRecognitionSystem

# Get base directories
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = current_dir

# Initialize pill model
pill_model = ImprovedPillRecognitionSystem(
    model_path='model/pill_model.h5',
    prototype_path='model/pill_prototypes.json'
)

# Initialize gun models paths for new model
path_model_5MSegment = os.path.join(backend_dir, "model", "Model V2", "5M_Segment", "best_v8.pt")
path_model_CLS_Brand = os.path.join(backend_dir, "model", "Model V2", "Model-CLS-Brand V1", "best.pt")
path_model_CLS_MGUN = os.path.join(backend_dir, "model", "Model V2", "Model-CLS-MGun-V1")
path_model_CLS_MGUN = Path(path_model_CLS_MGUN)

# Initialize old weapon model
weapon_model = YOLO('./model/best.pt')

# Brand mapping dictionary for gun classification
brand_map = {
    0: 'BERETTA', 1: 'CZ', 2: 'Colt', 3: 'GLOCK', 4: 'Kimber', 5: 'LES BAER',
    6: 'Mauser', 7: 'Norinco', 8: 'SIG', 9: 'Smith & wesson', 10: 'Sphinx', 11: 'Walther'
}

# Function to find model paths for each brand
def find_model_path_for_brand(brand_name):
    for folder in path_model_CLS_MGUN.iterdir():
        if folder.is_dir() and brand_name.lower() in folder.name.lower():
            model_path = folder / "best.pt"
            if model_path.exists():
                return str(model_path)
    return None

# Prepare model records
model_records = []
for idx, brand in brand_map.items():
    path = find_model_path_for_brand(brand)
    if path:
        model_records.append({"index": idx, "brand": brand, "path": path})

# Load gun-related models
try:
    print("Loading gun detection and classification models...")
    model_segment = YOLO(path_model_5MSegment)
    model_brand = YOLO(path_model_CLS_Brand)
    model_map = {}
    
    # Load brand-specific models
    for record in model_records:
        brand = record['brand']
        path = record['path']
        model_map[brand] = YOLO(path)
    
    print(f"Successfully loaded {len(model_map) + 2} gun models")
except Exception as e:
    print(f"Error loading gun models: {e}")
    model_segment = None
    model_brand = None
    model_map = {}

# Class map for segmentation model (updated to match gun_classification.py)
segment_classes = {0: 'BigGun', 1: 'Bullet', 2: 'Drug', 3: 'Magazine', 4: 'PackageDrug', 5: 'Pistol', 6: 'Revolver'}

# Utility functions for gun detection
def crop_mask_on_white(img, mask):
    # Resize mask to match image shape
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

# Main processing function for gun detection and classification
def process_image_with_gun_models(image_path):
    image = cv2.imread(image_path)
    results = model_segment(image)[0]

    objects = []

    for i, mask in enumerate(results.masks.data):
        cls_id = int(results.boxes.cls[i].item())
        cls_name = segment_classes.get(cls_id, "Unknown")

        # Create cropped object on white background
        cropped = crop_mask_on_white(image, mask.cpu().numpy())
        temp_crop_path = f"{image_path}_crop_{i}_{cls_name}.jpg"
        cv2.imwrite(temp_crop_path, cropped)

        obj_data = {
            "object_index": i,
            "class": cls_name,
            "cropped_path": temp_crop_path
        }

        # Process gun objects (BigGun, Pistol, Revolver)
        if cls_name in ['BigGun', 'Pistol']:
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
        
        # Add all objects to the results - don't filter by class type
        objects.append(obj_data)

    # Clean up temporary crop files
    for obj in objects:
        if "cropped_path" in obj and os.path.exists(obj["cropped_path"]):
            os.remove(obj["cropped_path"])

    return {
        "original_image": image_path,
        "detected_objects": objects
    }

def detect_weapon(image_path):
    """Process image with YOLO model and return detection results"""
    # Run detection
    results = weapon_model(image_path)
    
    # Process results
    detections = []
    highest_conf = 0
    highest_class = None
    
    for result in results:
        boxes = result.boxes
        
        for box in boxes:
            # Get coordinates
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            
            # Get class and confidence
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            
            # Get class name
            class_name = result.names[cls] if hasattr(result, 'names') else f"Class {cls}"
            
            # Track highest confidence detection
            if conf > highest_conf:
                highest_conf = conf
                highest_class = class_name
            
            # Add to detections list
            detections.append({
                "class": class_name,
                "confidence": conf,
                "box": [int(x1), int(y1), int(x2), int(y2)]
            })
    
    # Sort detections by confidence (highest first)
    detections.sort(key=lambda x: x['confidence'], reverse=True)
    
    # Save annotated image for reference
    annotated_image = results[0].plot()
    annotated_image_path = f"{image_path}_annotated.jpg"
    cv2.imwrite(annotated_image_path, annotated_image)
    
    # Return formatted results
    return {
        "detected": len(detections) > 0,
        "confidence": highest_conf,
        "weaponType": highest_class,
        "detections": detections,
        "annotatedImagePath": annotated_image_path
    }

async def analyze_image_service(image_path: str):
    """
    บริการวิเคราะห์รูปภาพสำหรับทั้งยาเสพติดและอาวุธ
    """
    try:
        print(f"Analyzing image at path: {image_path}")
        # ประมวลผลด้วยโมเดลตรวจจับอาวุธปืน
        if model_segment is not None:
            print("Using segment model for analysis")
            result = process_image_with_gun_models(image_path)
            # จัดกลุ่มผลลัพธ์ตามประเภทวัตถุ (gun = BigGun, Pistol, Revolver)
            gun_classes = ['BigGun', 'Pistol', 'Revolver']
            gun_objects = [obj for obj in result["detected_objects"] if obj["class"] in gun_classes]
            drug_objects = [obj for obj in result["detected_objects"] if obj["class"] in ["Drug", "PackageDrug"]]
            other_objects = [obj for obj in result["detected_objects"] 
                            if obj["class"] not in gun_classes + ["Drug", "PackageDrug"]]
            # กำหนดประเภทการตรวจจับตามวัตถุที่พบ
            if gun_objects:
                result["detectionType"] = "weapon"
                result["primaryObjects"] = gun_objects
                result["secondaryObjects"] = other_objects
                
            elif drug_objects:
                result["detectionType"] = "drug"
                result["primaryObjects"] = drug_objects
                result["secondaryObjects"] = other_objects
                
                # สำหรับยาเสพติด ลองใช้การรู้จำยาเม็ดสำหรับรายละเอียดเพิ่มเติม
                try:
                    pill_results = pill_model.predict(image_path)
                    result["pillRecognition"] = pill_results
                        
                except Exception as e:
                    print(f"Error in pill recognition: {str(e)}")
            else:
                result["detectionType"] = "unknown"
                result["primaryObjects"] = other_objects
            
            return result
        else:
            # เป็นทางเลือกสำรองใช้การรู้จำยาเม็ดหากโมเดลอาวุธล้มเหลวในการโหลด
            print("Gun models not loaded, falling back to pill recognition")
            result = pill_model.predict(image_path)
            return result
            
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        traceback.print_exc()  # พิมพ์ traceback แบบเต็ม
        raise Exception(f"Failed to process image: {str(e)}")

async def detect_realtime_service(image_bytes: bytes, mode: Optional[str] = None):
    """
    บริการตรวจจับแบบเรียลไทม์สำหรับการแสดงผลผ่านกล้อง
    """
    # แปลงข้อมูลรูปภาพจาก bytes เป็น numpy array
    np_array = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_array, cv2.IMREAD_COLOR)
    
    try:
        # ใช้โมเดล segment สำหรับการตรวจจับแบบเรียลไทม์โดยไม่คำนึงถึงโหมด
        if model_segment is not None:
            results = model_segment(img, conf=0.3)[0]
            detections = []
            
            for i, box in enumerate(results.boxes.data):
                cls_id = int(results.boxes.cls[i].item())
                cls_name = segment_classes.get(cls_id, "Unknown")
                conf = float(results.boxes.conf[i].item())
                
                detections.append({
                    "class": cls_name,
                    "confidence": conf
                })
            
            # จัดกลุ่มการตรวจจับตามประเภท
            gun_detections = [d for d in detections if d["class"] == "GUN"]
            drug_detections = [d for d in detections if d["class"] in ["Drug", "PackageDrug"]]
            
            # กำหนดประเภทการตรวจจับหลัก
            detection_type = "unknown"
            if gun_detections:
                detection_type = "weapon"
                primary_detections = gun_detections
            elif drug_detections:
                detection_type = "drug"
                primary_detections = drug_detections
            else:
                primary_detections = []
                
            return {
                "detected": len(primary_detections) > 0,
                "detectionType": detection_type,
                "detections": primary_detections,
                "allDetections": detections
            }
        else:
            # เป็นทางเลือกสำรองใช้โมเดลอาวุธเดิมหากจำเป็น
            if mode == "อาวุปืน" or mode == "weapon":
                # ใช้เวอร์ชันที่เร็วกว่าของการตรวจจับสำหรับเรียลไทม์
                results = weapon_model(img, conf=0.3)
                detections = []
                highest_conf = 0
                highest_class = None
                
                for result in results:
                    boxes = result.boxes
                    for box in boxes:
                        cls = int(box.cls[0])
                        conf = float(box.conf[0])
                        class_name = result.names[cls] if hasattr(result, 'names') else f"Class {cls}"
                        if conf > highest_conf:
                            highest_conf = conf
                            highest_class = class_name
                        detections.append({
                            "class": class_name,
                            "confidence": conf
                        })
                
                return {
                    "detected": len(detections) > 0,
                    "detectionType": "weapon",
                    "weaponType": highest_class,
                    "confidence": highest_conf,
                    "detections": detections
                }
            else:
                # โหมดการตรวจจับอัตโนมัติเริ่มต้น
                return {"error": "Models unavailable for real-time detection"}
    except Exception as e:
        print(f"Error in real-time detection: {str(e)}")
        raise Exception(f"Error in real-time detection: {str(e)}")