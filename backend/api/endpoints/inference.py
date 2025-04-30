from fastapi import APIRouter, File, UploadFile, Form
from fastapi.responses import JSONResponse
from typing import Optional
import tempfile
import os
from services.inference_service import (
    analyze_image_service, 
    detect_realtime_service
)

router = APIRouter(tags=["inference"])

@router.post("/analyze")
async def analyze_image(
    image: UploadFile = File(...)
):
    """
    วิเคราะห์รูปภาพเพื่อตรวจจับทั้งอาวุธปืนและยาเสพติด
    ใช้โมเดล AI สำหรับการแยกประเภทวัตถุและจำแนกชนิดอาวุธปืน/ยาเสพติด
    """
    # ตรวจสอบว่าไฟล์เป็นรูปภาพหรือไม่
    if not image.content_type.startswith('image/'):
        return JSONResponse(
            status_code=400,
            content={"error": "ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะรูปภาพเท่านั้น"}
        )
        
    # บันทึกไฟล์ที่อัปโหลดชั่วคราว
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp:
        temp_path = temp.name
        contents = await image.read()
        temp.write(contents)
        
    try:
        # เรียกใช้บริการวิเคราะห์ภาพ (ไม่ใช้ db และ user)
        result = await analyze_image_service(temp_path)
        return result
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"ไม่สามารถประมวลผลรูปภาพได้: {str(e)}"}
        )
    finally:
        # ลบไฟล์ชั่วคราว
        if os.path.exists(temp_path):
            os.unlink(temp_path)

@router.post("/detect")
async def detect_realtime(
    image: UploadFile = File(...),
    mode: Optional[str] = Form(None)
):
    """
    ตรวจจับวัตถุแบบเรียลไทม์ ออกแบบสำหรับการตอบสนองอย่างรวดเร็ว
    เพื่อใช้ในฟีเจอร์การมองผ่านกล้อง
    """
    # อ่านข้อมูลภาพโดยตรงจากหน่วยความจำเพื่อประสิทธิภาพที่ดีขึ้น
    contents = await image.read()
    
    try:
        # เรียกใช้บริการตรวจจับแบบเรียลไทม์ (ไม่ใช้ db)
        result = await detect_realtime_service(contents, mode)
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"เกิดข้อผิดพลาดในการตรวจจับแบบเรียลไทม์: {str(e)}"}
        )