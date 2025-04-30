from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from config.database import get_db
from schemas.geography import Subdistrict
from services.subdistrict_service import get_subdistricts, get_subdistrict_by_id

router = APIRouter(tags=["geography"])

@router.get("/subdistricts", response_model=List[Subdistrict])
async def read_subdistricts(
    district_id: Optional[int] = Query(None, description="Filter subdistricts by district ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    ดึงข้อมูลตำบลทั้งหมดหรือกรองตามอำเภอและ/หรือจังหวัด
    """
    subdistricts = await get_subdistricts(db, district_id)
    
    if (district_id) and not subdistricts:
        filter_desc = []
        if district_id:
            filter_desc.append(f"district ID: {district_id}")
        
        raise HTTPException(
            status_code=404, 
            detail=f"No subdistricts found for {' and '.join(filter_desc)}"
        )
        
    return subdistricts

@router.get("/subdistricts/{subdistrict_id}", response_model=Subdistrict)
async def read_subdistrict(subdistrict_id: int, db: AsyncSession = Depends(get_db)):
    """
    ดึงข้อมูลตำบลตาม ID
    """
    subdistrict = await get_subdistrict_by_id(db, subdistrict_id)
    if subdistrict is None:
        raise HTTPException(status_code=404, detail="Subdistrict not found")
    return subdistrict