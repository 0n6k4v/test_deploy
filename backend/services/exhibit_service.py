from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.orm import joinedload
from typing import List, Optional, Dict, Any
from models.exhibit import Exhibit, Firearm, FirearmExampleImage

async def get_exhibits(db: AsyncSession) -> List[Exhibit]:
    """Get all exhibits with relationships loaded"""
    result = await db.execute(
        select(Exhibit)
        .options(joinedload(Exhibit.firearm))
        .options(joinedload(Exhibit.images))
    )
    return result.unique().scalars().all()  # เพิ่ม .unique() เพื่อจัดการกับข้อมูลที่ซ้ำซ้อนจาก eager loading

async def get_exhibit_by_id(db: AsyncSession, exhibit_id: int) -> Optional[Exhibit]:
    """Get a single exhibit by ID with relationships loaded"""
    result = await db.execute(
        select(Exhibit)
        .options(joinedload(Exhibit.firearm))
        .options(joinedload(Exhibit.images))
        .filter(Exhibit.id == exhibit_id)
    )
    return result.unique().scalars().first()  # เพิ่ม .unique() เช่นเดียวกับ get_exhibits

async def create_exhibit(
    db: AsyncSession, 
    exhibit_data: Dict[str, Any], 
    firearm_data: Optional[Dict[str, Any]] = None
) -> Exhibit:
    """Create a new exhibit record with optional firearm data"""
    # Create exhibit
    new_exhibit = Exhibit(**exhibit_data)
    db.add(new_exhibit)
    await db.flush()
    
    # If firearm data is provided, create firearm record
    if firearm_data:
        firearm = Firearm(exhibit_id=new_exhibit.id, **firearm_data)
        db.add(firearm)

    await db.commit()
    await db.refresh(new_exhibit)
    return new_exhibit

async def update_exhibit(
    db: AsyncSession, 
    exhibit_id: int, 
    exhibit_data: Dict[str, Any], 
    firearm_data: Optional[Dict[str, Any]] = None
) -> Optional[Exhibit]:
    """Update an exhibit and optionally its firearm data"""
    # Update exhibit
    if exhibit_data:
        await db.execute(
            update(Exhibit)
            .where(Exhibit.id == exhibit_id)
            .values(**exhibit_data)
        )
    
    # Update firearm if data provided
    if firearm_data:
        # Check if firearm exists for this exhibit
        firearm_result = await db.execute(
            select(Firearm).filter(Firearm.exhibit_id == exhibit_id)
        )
        firearm = firearm_result.scalars().first()
        
        if firearm:
            # Update existing firearm
            await db.execute(
                update(Firearm)
                .where(Firearm.exhibit_id == exhibit_id)
                .values(**firearm_data)
            )
        else:
            # Create new firearm
            new_firearm = Firearm(exhibit_id=exhibit_id, **firearm_data)
            db.add(new_firearm)
    
    await db.commit()
    
    # Return updated exhibit
    return await get_exhibit_by_id(db, exhibit_id)

async def delete_exhibit(db: AsyncSession, exhibit_id: int) -> bool:
    """Delete an exhibit and related records via cascade"""
    exhibit = await get_exhibit_by_id(db, exhibit_id)
    if not exhibit:
        return False
    
    await db.delete(exhibit)
    await db.commit()
    return True