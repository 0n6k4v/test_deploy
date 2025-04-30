from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import date, time, datetime
import json
import traceback

from config.database import get_db
from schemas import history as schemas
from services import history_service

router = APIRouter()

@router.get("/history", response_model=List[schemas.HistoryWithExhibit])
async def get_all_histories(db: Session = Depends(get_db)):
    """
    Get all history records with exhibit data and location names
    """
    histories = await history_service.get_all_histories(db)
    return histories

@router.get("/history/{history_id}", response_model=schemas.HistoryWithExhibit)
async def get_history_by_id(history_id: int, db: Session = Depends(get_db)):
    """
    Get a specific history record by ID with exhibit data and location names
    """
    history = await history_service.get_history_by_id(db, history_id)
    if not history:
        raise HTTPException(status_code=404, detail="History record not found")
    return history

@router.post("/history", response_model=schemas.HistoryWithExhibit)
async def create_history(
    exhibit_id: Optional[int] = Form(None),
    province_id: Optional[int] = Form(None),
    district_id: Optional[int] = Form(None),
    subdistrict_id: Optional[int] = Form(None),
    house_no: Optional[str] = Form(None),
    village_no: Optional[str] = Form(None),
    alley: Optional[str] = Form(None),
    road: Optional[str] = Form(None),
    place_name: Optional[str] = Form(None),
    date: Optional[str] = Form(None),
    time: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    confidence_percentage: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Create a new history record with optional image upload
    """
    try:
        # Debug log
        print(f"Received form data - date: {date}, time: {time}")
        
        # Create a dictionary with all fields
        history_dict = {
            "exhibit_id": exhibit_id,
            "province_id": province_id,
            "district_id": district_id,
            "subdistrict_id": subdistrict_id,
            "house_no": house_no,
            "village_no": village_no,
            "alley": alley,
            "road": road,
            "place_name": place_name,
            "latitude": latitude,
            "longitude": longitude,
            "confidence_percentage": confidence_percentage
        }
        
        # Only add date and time if they are valid strings
        if date:
            try:
                date_obj = datetime.strptime(date, "%Y-%m-%d").date()
                history_dict["date"] = date
            except ValueError:
                print(f"Invalid date format: {date}")
                # Don't add invalid dates
        else:
            # Use current date if none provided
            history_dict["date"] = datetime.now().date().isoformat()
            
        if time:
            try:
                time_obj = datetime.strptime(time, "%H:%M").time()
                history_dict["time"] = time
            except ValueError:
                print(f"Invalid time format: {time}")
                # Don't add invalid times
        else:
            # Use current time if none provided
            history_dict["time"] = datetime.now().time().strftime("%H:%M")
        
        # Create history data object 
        history_data = schemas.HistoryCreate(**history_dict)
        
        # Create the history record
        history = await history_service.create_history(db, history_data, image)
        
        return history
        
    except Exception as e:
        error_detail = f"Error creating history record: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/history/{history_id}", response_model=schemas.HistoryWithExhibit)
async def update_history(
    history_id: int,
    exhibit_id: Optional[int] = Form(None),
    province_id: Optional[int] = Form(None),
    district_id: Optional[int] = Form(None),
    subdistrict_id: Optional[int] = Form(None),
    house_no: Optional[str] = Form(None),
    village_no: Optional[str] = Form(None),
    alley: Optional[str] = Form(None),
    road: Optional[str] = Form(None),
    place_name: Optional[str] = Form(None),
    date: Optional[str] = Form(None),
    time: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    confidence_percentage: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Update a history record with optional image upload
    """
    try:
        # Check if history exists
        existing_history = await history_service.get_history_by_id(db, history_id)
        if not existing_history:
            raise HTTPException(status_code=404, detail="History record not found")
        
        # Create update data from form fields, only including provided fields
        update_data = {}
        if exhibit_id is not None:
            update_data["exhibit_id"] = exhibit_id
        if province_id is not None:
            update_data["province_id"] = province_id
        if district_id is not None:
            update_data["district_id"] = district_id
        if subdistrict_id is not None:
            update_data["subdistrict_id"] = subdistrict_id
        if house_no is not None:
            update_data["house_no"] = house_no
        if village_no is not None:
            update_data["village_no"] = village_no
        if alley is not None:
            update_data["alley"] = alley
        if road is not None:
            update_data["road"] = road
        if place_name is not None:
            update_data["place_name"] = place_name
        if latitude is not None:
            update_data["latitude"] = latitude
        if longitude is not None:
            update_data["longitude"] = longitude
        if confidence_percentage is not None:
            update_data["confidence_percentage"] = confidence_percentage
            
        # Handle date and time specially
        if date is not None:
            update_data["date"] = date
            
        if time is not None:
            update_data["time"] = time
        
        # Create HistoryUpdate object
        history_update = schemas.HistoryUpdate(**update_data)
        
        # Update the history record
        updated_history = await history_service.update_history(db, history_id, history_update, image)
        
        if not updated_history:
            raise HTTPException(status_code=404, detail="History record not found")
        
        return updated_history
        
    except Exception as e:
        error_detail = f"Error updating history record: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/history/{history_id}", status_code=status.HTTP_200_OK)
async def delete_history(history_id: int, db: Session = Depends(get_db)):
    """
    Delete a history record
    """
    deleted = await history_service.delete_history(db, history_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="History record not found")
    
    return {"message": "History record deleted successfully"}

@router.get("/history/exhibit/{exhibit_id}", response_model=List[schemas.HistoryWithExhibit])
async def get_histories_by_exhibit_id(exhibit_id: int, db: Session = Depends(get_db)):
    """
    Get history records by exhibit ID with location names
    """
    histories = await history_service.get_histories_by_exhibit_id(db, exhibit_id)
    if not histories:
        raise HTTPException(status_code=404, detail="No history records found for this exhibit")
    
    return histories