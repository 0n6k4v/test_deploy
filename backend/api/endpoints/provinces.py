from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from config.database import get_db
from schemas.geography import Province
from services.province_service import get_provinces, get_province_by_id

router = APIRouter(tags=["geography"])

@router.get("/provinces", response_model=List[Province])
async def read_provinces(db: AsyncSession = Depends(get_db)):
    """
    ดึงข้อมูลจังหวัดทั้งหมด
    """
    provinces = await get_provinces(db)
    return provinces

@router.get("/provinces/{province_id}", response_model=Province)
async def read_province(province_id: int, db: AsyncSession = Depends(get_db)):
    """
    ดึงข้อมูลจังหวัดตาม ID
    """
    province = await get_province_by_id(db, province_id)
    if province is None:
        raise HTTPException(status_code=404, detail="Province not found")
    return province