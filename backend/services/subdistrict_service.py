import json
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Dict, Any, Optional

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def get_subdistricts(
    db: AsyncSession, 
    district_id: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    ดึงข้อมูลตำบลตามอำเภอ
    
    Args:
        db: AsyncSession - database session
        district_id: Optional[int] - ID ของอำเภอที่ต้องการกรอง (ถ้ามี)
        
    Returns:
        List[Dict[str, Any]]: รายการตำบล หรือ list ว่างหากเกิดข้อผิดพลาด
    """
    try:
        params = {}
        conditions = []
        
        if district_id is not None:
            conditions.append("district_id = :district_id")
            params["district_id"] = district_id
        
        
        where_clause = " AND ".join(conditions)
        if where_clause:
            where_clause = "WHERE " + where_clause
        
        query = text(f"""
            SELECT id, subdistrict_name, district_id, ST_AsGeoJSON(geom) AS geometry
            FROM subdistricts
            {where_clause}
            ORDER BY subdistrict_name
        """)
        
        result = await db.execute(query, params)
        subdistricts = []
        
        for row in result:
            try:
                geometry = json.loads(row.geometry) if row.geometry else None
                subdistricts.append({
                    "id": row.id,
                    "subdistrict_name": row.subdistrict_name,
                    "district_id": row.district_id,
                    "geometry": geometry
                })
            except json.JSONDecodeError as json_err:
                logger.error(f"Error parsing geometry for subdistrict {row.id}: {str(json_err)}")
                # ยังคงเพิ่มข้อมูลตำบลแม้ว่า geometry จะมีปัญหา
                subdistricts.append({
                    "id": row.id,
                    "subdistrict_name": row.subdistrict_name,
                    "district_id": row.district_id,
                    "geometry": None
                })
            
        return subdistricts
    except Exception as e:
        logger.error(f"Error fetching subdistricts: {str(e)}", exc_info=True)
        return []  # คล้ายกับฝั่ง Node.js ที่ return array ว่างเมื่อเกิดข้อผิดพลาด

async def get_subdistrict_by_id(db: AsyncSession, subdistrict_id: int) -> Dict[str, Any]:
    """
    ดึงข้อมูลตำบลตาม ID
    
    Args:
        db: AsyncSession - database session
        subdistrict_id: int - ID ของตำบลที่ต้องการ
        
    Returns:
        Dict[str, Any]: ข้อมูลตำบล หรือ None หากไม่พบหรือเกิดข้อผิดพลาด
    """
    try:
        query = text("""
            SELECT id, subdistrict_name, district_id, ST_AsGeoJSON(geom) AS geometry
            FROM subdistricts
            WHERE id = :subdistrict_id
        """)
        
        result = await db.execute(query, {"subdistrict_id": subdistrict_id})
        row = result.first()
        
        if not row:
            return None
        
        try:
            geometry = json.loads(row.geometry) if row.geometry else None
            return {
                "id": row.id,
                "subdistrict_name": row.subdistrict_name,
                "district_id": row.district_id,
                "geometry": geometry
            }
        except json.JSONDecodeError as json_err:
            logger.error(f"Error parsing geometry for subdistrict {subdistrict_id}: {str(json_err)}")
            # ส่งคืนข้อมูลโดยไม่มี geometry
            return {
                "id": row.id,
                "subdistrict_name": row.subdistrict_name,
                "district_id": row.district_id,
                "geometry": None
            }
    except Exception as e:
        logger.error(f"Error fetching subdistrict by ID: {str(e)}", exc_info=True)
        return None