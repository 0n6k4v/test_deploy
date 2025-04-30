import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Dict, Any

async def get_provinces(db: AsyncSession) -> List[Dict[str, Any]]:
    """
    ดึงข้อมูลจังหวัดทั้งหมด
    """
    try:
        # ใช้ raw SQL query เหมือนกับ Node.js version
        query = text("""
            SELECT id, province_name, ST_AsGeoJSON(geom) AS geometry
            FROM provinces
        """)
        
        result = await db.execute(query)
        provinces = []
        
        for row in result:
            provinces.append({
                "id": row.id,
                "province_name": row.province_name,
                "geometry": json.loads(row.geometry) if row.geometry else None
            })
            
        return provinces
    except Exception as e:
        print(f"Error fetching provinces: {str(e)}")
        return []

async def get_province_by_id(db: AsyncSession, province_id: int) -> Dict[str, Any]:
    """
    ดึงข้อมูลจังหวัดตาม ID
    """
    try:
        query = text("""
            SELECT id, province_name, ST_AsGeoJSON(geom) AS geometry
            FROM provinces
            WHERE id = :province_id
        """)
        
        result = await db.execute(query, {"province_id": province_id})
        row = result.first()
        
        if not row:
            return None
            
        return {
            "id": row.id,
            "province_name": row.province_name,
            "geometry": json.loads(row.geometry) if row.geometry else None
        }
    except Exception as e:
        print(f"Error fetching province by ID: {str(e)}")
        return None