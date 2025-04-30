from typing import List, Optional, Dict, Any, Union
from datetime import datetime, date, time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, delete, update
from sqlalchemy.orm import selectinload, joinedload
import models.history as models
from models.exhibit import Exhibit  # Import the Exhibit model
from schemas import history as schemas
from services.image_service import upload_image_to_cloudinary
import os
import psycopg2
from config.database import get_db_connection

async def get_location_names(province_id: Optional[int], district_id: Optional[int], subdistrict_id: Optional[int]) -> Dict[str, str]:
    """Get location names from IDs using direct PostgreSQL connection"""
    location_info = {
        "province_name": None,
        "district_name": None,
        "subdistrict_name": None
    }
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get province name if province_id exists
        if province_id:
            cursor.execute('SELECT province_name FROM provinces WHERE id = %s', (province_id,))
            result = cursor.fetchone()
            if result:
                location_info["province_name"] = result[0]
        
        # Get district name if district_id exists
        if district_id:
            cursor.execute('SELECT district_name FROM districts WHERE id = %s', (district_id,))
            result = cursor.fetchone()
            if result:
                location_info["district_name"] = result[0]
        
        # Get subdistrict name if subdistrict_id exists
        if subdistrict_id:
            cursor.execute('SELECT subdistrict_name FROM subdistricts WHERE id = %s', (subdistrict_id,))
            result = cursor.fetchone()
            if result:
                location_info["subdistrict_name"] = result[0]
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error fetching location names: {e}")
    
    return location_info

async def get_all_histories(db: AsyncSession) -> List[Dict[str, Any]]:
    """Get all history records with exhibit data and location names"""
    # Use selectinload to eagerly load exhibit and related data
    stmt = select(models.History).options(
        selectinload(models.History.exhibit).selectinload(Exhibit.firearm),  # Use imported Exhibit
        selectinload(models.History.exhibit).selectinload(Exhibit.images)    # Use imported Exhibit
    ).order_by(
        desc(models.History.date), 
        desc(models.History.time)
    )
    
    result = await db.execute(stmt)
    histories = result.scalars().all()
    
    enhanced_histories = []
    for history in histories:
        # Convert ORM object to dict
        history_dict = {c.name: getattr(history, c.name) for c in history.__table__.columns}
        
        # Convert date and time to string format
        if history_dict.get('date'):
            history_dict['date'] = history_dict['date'].isoformat() if history_dict['date'] else None
        
        if history_dict.get('time'):
            history_dict['time'] = history_dict['time'].isoformat() if history_dict['time'] else None
        
        # Add exhibit data if available
        if history.exhibit:
            exhibit_dict = {c.name: getattr(history.exhibit, c.name) for c in history.exhibit.__table__.columns}
            
            # Add firearm and images if available
            if history.exhibit.firearm:
                exhibit_dict['firearm'] = {
                    c.name: getattr(history.exhibit.firearm, c.name) 
                    for c in history.exhibit.firearm.__table__.columns
                }
            
            if history.exhibit.images:
                exhibit_dict['images'] = [
                    {c.name: getattr(img, c.name) for c in img.__table__.columns} 
                    for img in history.exhibit.images
                ]
            
            history_dict['exhibit'] = exhibit_dict
        
        # Get location names
        location_names = await get_location_names(
            history.province_id, 
            history.district_id, 
            history.subdistrict_id
        )
        
        # Merge location names into history dict
        history_dict.update(location_names)
        
        enhanced_histories.append(history_dict)
    
    return enhanced_histories

async def get_history_by_id(db: AsyncSession, history_id: int) -> Dict[str, Any]:
    """Get a specific history record by ID with exhibit data and location names"""
    # Use selectinload to eagerly load exhibit and related data
    stmt = select(models.History).options(
        selectinload(models.History.exhibit).selectinload(Exhibit.firearm),
        selectinload(models.History.exhibit).selectinload(Exhibit.images)
    ).where(models.History.id == history_id)
    
    result = await db.execute(stmt)
    history = result.scalars().first()
    
    if not history:
        return None
    
    # Convert ORM object to dict
    history_dict = {c.name: getattr(history, c.name) for c in history.__table__.columns}
    
    # Convert date and time to string format
    if history_dict.get('date'):
        history_dict['date'] = history_dict['date'].isoformat() if history_dict['date'] else None
    
    if history_dict.get('time'):
        history_dict['time'] = history_dict['time'].isoformat() if history_dict['time'] else None
    
    # Add exhibit data if available
    if history.exhibit:
        exhibit_dict = {c.name: getattr(history.exhibit, c.name) for c in history.exhibit.__table__.columns}
        
        # Add firearm and images if available
        if history.exhibit.firearm:
            exhibit_dict['firearm'] = {
                c.name: getattr(history.exhibit.firearm, c.name) 
                for c in history.exhibit.firearm.__table__.columns
            }
        
        if history.exhibit.images:
            exhibit_dict['images'] = [
                {c.name: getattr(img, c.name) for c in img.__table__.columns} 
                for img in history.exhibit.images
            ]
        
        history_dict['exhibit'] = exhibit_dict
    
    # Get location names
    location_names = await get_location_names(
        history.province_id, 
        history.district_id, 
        history.subdistrict_id
    )
    
    # Merge location names into history dict
    history_dict.update(location_names)
    
    return history_dict

async def create_history(db: AsyncSession, history_data: schemas.HistoryCreate, image_file=None) -> Dict[str, Any]:
    """Create a new history record with optional image upload"""
    try:
        # Print for debugging
        print(f"Creating history record with data: {history_data}")
        
        # Get history dict
        history_dict = {}
        
        # Handle basic fields
        if history_data.exhibit_id is not None:
            history_dict['exhibit_id'] = history_data.exhibit_id
        if history_data.province_id is not None:
            history_dict['province_id'] = history_data.province_id
        if history_data.district_id is not None:
            history_dict['district_id'] = history_data.district_id
        if history_data.subdistrict_id is not None:
            history_dict['subdistrict_id'] = history_data.subdistrict_id
        if history_data.house_no is not None:
            history_dict['house_no'] = history_data.house_no
        if history_data.village_no is not None:
            history_dict['village_no'] = history_data.village_no
        if history_data.alley is not None:
            history_dict['alley'] = history_data.alley
        if history_data.road is not None:
            history_dict['road'] = history_data.road
        if history_data.place_name is not None:
            history_dict['place_name'] = history_data.place_name
        if history_data.latitude is not None:
            history_dict['latitude'] = history_data.latitude
        if history_data.longitude is not None:
            history_dict['longitude'] = history_data.longitude
        if history_data.confidence_percentage is not None:
            history_dict['confidence_percentage'] = history_data.confidence_percentage
        
        # Properly handle date - convert to date object if string
        if history_data.date is not None:
            if isinstance(history_data.date, str):
                try:
                    history_dict['date'] = datetime.strptime(history_data.date, "%Y-%m-%d").date()
                except ValueError:
                    print(f"Invalid date format: {history_data.date}")
                    # Use current date as fallback
                    history_dict['date'] = datetime.now().date()
            else:
                history_dict['date'] = history_data.date
        else:
            # Use current date if not provided
            history_dict['date'] = datetime.now().date()
            
        # Properly handle time - convert to time object if string
        if history_data.time is not None:
            if isinstance(history_data.time, str):
                try:
                    history_dict['time'] = datetime.strptime(history_data.time, "%H:%M").time()
                except ValueError:
                    print(f"Invalid time format: {history_data.time}")
                    # Use current time as fallback
                    history_dict['time'] = datetime.now().time()
            else:
                history_dict['time'] = history_data.time
        else:
            # Use current time if not provided
            history_dict['time'] = datetime.now().time()
        
        # Handle image upload if present (can be file or base64 string)
        if image_file:
            try:
                print(f"Processing image upload: {type(image_file)}")
                image_url = await upload_image_to_cloudinary(image_file, 'evidence_history')
                history_dict['image_url'] = image_url
                print(f"Image uploaded successfully: {image_url}")
            except Exception as e:
                print(f"Image upload error: {e}")
                # Continue with creation even if upload fails
        
        # Create new history record
        print(f"Final history dict: {history_dict}")
        db_history = models.History(**history_dict)
        db.add(db_history)
        await db.commit()
        await db.refresh(db_history)
        print(f"History record created with ID: {db_history.id}")
        
        # Get the created history with location names
        return await get_history_by_id(db, db_history.id)
    except Exception as e:
        print(f"Error creating history record: {e}")
        import traceback
        traceback.print_exc()
        raise

async def update_history(db: AsyncSession, history_id: int, history_data: schemas.HistoryUpdate, image_file=None) -> Dict[str, Any]:
    """Update a history record with optional image upload"""
    # First get the history record
    stmt = select(models.History).where(models.History.id == history_id)
    result = await db.execute(stmt)
    history = result.scalars().first()
    
    if not history:
        return None
    
    # Prepare update data
    update_data = {}
    
    # Handle basic fields
    for field in ['exhibit_id', 'province_id', 'district_id', 'subdistrict_id', 
                 'house_no', 'village_no', 'alley', 'road', 'place_name',
                 'latitude', 'longitude', 'confidence_percentage']:
        value = getattr(history_data, field, None)
        if value is not None:
            update_data[field] = value
    
    # Handle date - convert to date object if string
    if history_data.date is not None:
        if isinstance(history_data.date, str):
            try:
                update_data['date'] = datetime.strptime(history_data.date, "%Y-%m-%d").date()
            except ValueError:
                print(f"Invalid date format: {history_data.date}")
                # Keep existing date
        else:
            update_data['date'] = history_data.date
            
    # Handle time - convert to time object if string
    if history_data.time is not None:
        if isinstance(history_data.time, str):
            try:
                update_data['time'] = datetime.strptime(history_data.time, "%H:%M").time()
            except ValueError:
                print(f"Invalid time format: {history_data.time}")
                # Keep existing time
        else:
            update_data['time'] = history_data.time
    
    # Handle image upload if present (file or base64 string)
    if image_file:
        try:
            image_url = await upload_image_to_cloudinary(image_file, 'evidence_history')
            update_data['image_url'] = image_url
        except Exception as e:
            print(f"Image upload error: {e}")
            # Continue with update even if upload fails
    
    # Update history fields
    for key, value in update_data.items():
        setattr(history, key, value)
    
    await db.commit()
    await db.refresh(history)
    
    # Get the updated history with location names
    return await get_history_by_id(db, history.id)

async def delete_history(db: AsyncSession, history_id: int) -> bool:
    """Delete a history record"""
    # First get the history record
    stmt = select(models.History).where(models.History.id == history_id)
    result = await db.execute(stmt)
    history = result.scalars().first()
    
    if not history:
        return False
    
    await db.delete(history)
    await db.commit()
    return True

async def get_histories_by_exhibit_id(db: AsyncSession, exhibit_id: int) -> List[Dict[str, Any]]:
    """Get history records by exhibit ID with location names"""
    # Use selectinload to eagerly load exhibit and related data
    stmt = select(models.History).options(
        selectinload(models.History.exhibit).selectinload(Exhibit.firearm),
        selectinload(models.History.exhibit).selectinload(Exhibit.images)
    ).where(
        models.History.exhibit_id == exhibit_id
    ).order_by(
        desc(models.History.date), 
        desc(models.History.time)
    )
    
    result = await db.execute(stmt)
    histories = result.scalars().all()
    
    if not histories:
        return []
    
    enhanced_histories = []
    for history in histories:
        # Convert ORM object to dict
        history_dict = {c.name: getattr(history, c.name) for c in history.__table__.columns}
        
        # Convert date and time to string format
        if history_dict.get('date'):
            history_dict['date'] = history_dict['date'].isoformat() if history_dict['date'] else None
        
        if history_dict.get('time'):
            history_dict['time'] = history_dict['time'].isoformat() if history_dict['time'] else None
        
        # Add exhibit data if available
        if history.exhibit:
            exhibit_dict = {c.name: getattr(history.exhibit, c.name) for c in history.exhibit.__table__.columns}
            
            # Add firearm and images if available
            if history.exhibit.firearm:
                exhibit_dict['firearm'] = {
                    c.name: getattr(history.exhibit.firearm, c.name) 
                    for c in history.exhibit.firearm.__table__.columns
                }
            
            if history.exhibit.images:
                exhibit_dict['images'] = [
                    {c.name: getattr(img, c.name) for c in img.__table__.columns} 
                    for img in history.exhibit.images
                ]
            
            history_dict['exhibit'] = exhibit_dict
        
        # Get location names
        location_names = await get_location_names(
            history.province_id, 
            history.district_id, 
            history.subdistrict_id
        )
        
        # Merge location names into history dict
        history_dict.update(location_names)
        
        enhanced_histories.append(history_dict)
    
    return enhanced_histories