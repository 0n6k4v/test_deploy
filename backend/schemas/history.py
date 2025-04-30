from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import date, time, datetime
from decimal import Decimal

# Base Schema for History with common attributes
class HistoryBase(BaseModel):
    exhibit_id: Optional[int] = None
    province_id: Optional[int] = None
    district_id: Optional[int] = None
    subdistrict_id: Optional[int] = None
    house_no: Optional[str] = None
    village_no: Optional[str] = None
    alley: Optional[str] = None
    road: Optional[str] = None
    place_name: Optional[str] = None
    date: Optional[str] = None  # Changed to only accept string
    time: Optional[str] = None  # Changed to only accept string
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    confidence_percentage: Optional[Union[Decimal, float, str]] = None
    image_url: Optional[str] = None
    
    @field_validator('date', mode='before')
    @classmethod
    def format_date(cls, value):
        # Convert Python date object to ISO format string
        if isinstance(value, date):
            return value.isoformat()
        # Return string as is
        elif isinstance(value, str):
            return value
        # Return None for None values
        elif value is None:
            return None
        # For any other type, try to convert to string
        return str(value)
        
    @field_validator('time', mode='before')
    @classmethod
    def format_time(cls, value):
        # Convert Python time object to string
        if isinstance(value, time):
            return value.strftime("%H:%M")
        # Return string as is
        elif isinstance(value, str):
            return value
        # Return None for None values
        elif value is None:
            return None
        # For any other type, try to convert to string
        return str(value)
        
    @field_validator('confidence_percentage', mode='before')
    @classmethod
    def parse_confidence(cls, value):
        if isinstance(value, str) and value:
            try:
                return Decimal(value)
            except:
                raise ValueError("Invalid confidence percentage value")
        return value

# Schema for creating a new History record
class HistoryCreate(HistoryBase):
    pass

# Schema for updating an existing History record
class HistoryUpdate(HistoryBase):
    pass

# Schema for returned History data
class History(BaseModel):
    id: int
    exhibit_id: Optional[int] = None
    province_id: Optional[int] = None
    district_id: Optional[int] = None
    subdistrict_id: Optional[int] = None
    house_no: Optional[str] = None
    village_no: Optional[str] = None
    alley: Optional[str] = None
    road: Optional[str] = None
    place_name: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    confidence_percentage: Optional[Decimal] = None
    image_url: Optional[str] = None
    province_name: Optional[str] = None
    district_name: Optional[str] = None
    subdistrict_name: Optional[str] = None
    
    # Using the new from_attributes config instead of orm_mode
    model_config = ConfigDict(from_attributes=True)
        
# Schema for History with exhibit details
class HistoryWithExhibit(History):
    exhibit: Optional[Dict[str, Any]] = None