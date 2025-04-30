from sqlalchemy import Column, Integer, String, Float, Date, Time, ForeignKey, Text, DECIMAL
from sqlalchemy.orm import relationship
from db.base import Base

class History(Base):
    __tablename__ = "history"
    
    id = Column(Integer, primary_key=True, index=True)
    exhibit_id = Column(Integer, ForeignKey("exhibits.id"), nullable=True)
    province_id = Column(Integer, nullable=True)
    district_id = Column(Integer, nullable=True)
    subdistrict_id = Column(Integer, nullable=True)
    house_no = Column(String(50), nullable=True)
    village_no = Column(String(10), nullable=True)
    alley = Column(String(100), nullable=True)
    road = Column(String(100), nullable=True)
    place_name = Column(Text, nullable=True)
    date = Column(Date, nullable=True)
    time = Column(Time, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    confidence_percentage = Column(DECIMAL(5, 2), nullable=True)
    image_url = Column(Text, nullable=True)
    
    # Relationships
    exhibit = relationship("Exhibit", back_populates="histories")