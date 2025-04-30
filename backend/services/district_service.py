import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Dict, Any, Optional

async def get_districts(db: AsyncSession, province_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    ดึงข้อมูลอำเภอตามจังหวัดหรือทั้งหมด
    
    Args:
        db: AsyncSession - database session
        province_id: Optional[int] - ID ของจังหวัดที่ต้องการกรอง (ถ้าไม่ระบุจะดึงทั้งหมด)
        
    Returns:
        List[Dict[str, Any]]: รายการอำเภอ
    """
    try:
        if province_id:
            # ถ้ามี province_id ให้กรองเฉพาะอำเภอในจังหวัดนั้น
            query = text("""
                SELECT id, district_name, province_id, ST_AsGeoJSON(geom) AS geometry
                FROM districts
                WHERE province_id = :province_id
                ORDER BY district_name
            """)
            params = {"province_id": province_id}
        else:
            # ถ้าไม่มี province_id ให้ดึงข้อมูลทั้งหมด
            query = text("""
                SELECT id, district_name, province_id, ST_AsGeoJSON(geom) AS geometry
                FROM districts
                ORDER BY province_id, district_name
            """)
            params = {}
        
        result = await db.execute(query, params)
        districts = []
        
        for row in result:
            districts.append({
                "id": row.id,
                "district_name": row.district_name,
                "province_id": row.province_id,
                "geometry": json.loads(row.geometry) if row.geometry else None
            })
            
        return districts
    except Exception as e:
        print(f"Error fetching districts: {str(e)}")
        return []

async def get_district_by_id(db: AsyncSession, district_id: int) -> Dict[str, Any]:
    """
    ดึงข้อมูลอำเภอตาม ID
    
    Args:
        db: AsyncSession - database session
        district_id: int - ID ของอำเภอที่ต้องการ
        
    Returns:
        Dict[str, Any]: ข้อมูลอำเภอ
    """
    try:
        query = text("""
            SELECT id, district_name, province_id, ST_AsGeoJSON(geom) AS geometry
            FROM districts
            WHERE id = :district_id
        """)
        
        result = await db.execute(query, {"district_id": district_id})
        row = result.first()
        
        if not row:
            return None
            
        return {
            "id": row.id,
            "district_name": row.district_name,
            "province_id": row.province_id,
            "geometry": json.loads(row.geometry) if row.geometry else None
        }
    except Exception as e:
        print(f"Error fetching district by ID: {str(e)}")
        return None