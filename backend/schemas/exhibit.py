from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# FirearmExampleImage schemas
class FirearmExampleImageBase(BaseModel):
    image_url: str
    description: Optional[str] = None
    priority: Optional[int] = None

class FirearmExampleImageCreate(FirearmExampleImageBase):
    exhibit_id: int

class FirearmExampleImage(FirearmExampleImageBase):
    id: int
    exhibit_id: int
    uploaded_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

# Firearm schemas
class FirearmBase(BaseModel):
    mechanism: str
    brand: str
    series: Optional[str] = None
    model: Optional[str] = None  # แก้จาก model: str เป็น Optional ให้รองรับค่า None
    normalized_name: Optional[str] = None

class FirearmCreate(FirearmBase):
    pass

class Firearm(FirearmBase):
    exhibit_id: int

    class Config:
        orm_mode = True
        from_attributes = True

# Exhibit schemas
class ExhibitBase(BaseModel):
    category: str
    subcategory: str

class ExhibitCreate(ExhibitBase):
    pass

class ExhibitUpdate(BaseModel):
    category: Optional[str] = None
    subcategory: Optional[str] = None

class Exhibit(ExhibitBase):
    id: int
    firearm: Optional[Firearm] = None
    images: List[FirearmExampleImage] = []

    class Config:
        orm_mode = True
        from_attributes = True