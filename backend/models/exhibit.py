from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from db.base import Base

class Exhibit(Base):
    __tablename__ = "exhibits"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category = Column(String)
    subcategory = Column(String)
    
    # Relationships
    firearm = relationship("Firearm", back_populates="exhibit", uselist=False)
    images = relationship("FirearmExampleImage", back_populates="exhibit", cascade="all, delete")
    # Simplified relationship definition - now that the foreign key is correctly defined in History model
    histories = relationship("History", back_populates="exhibit")

class Firearm(Base):
    __tablename__ = "firearms"

    exhibit_id = Column(Integer, ForeignKey("exhibits.id"), primary_key=True)
    mechanism = Column(String(255))
    brand = Column(String(255))
    series = Column(String(255), nullable=True)
    model = Column(String(255))
    normalized_name = Column(Text, nullable=True)

    # Relationships
    exhibit = relationship("Exhibit", back_populates="firearm")

class FirearmExampleImage(Base):
    __tablename__ = "firearm_example_images"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    exhibit_id = Column(Integer, ForeignKey("exhibits.id"))
    image_url = Column(Text)
    description = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=func.now())
    priority = Column(Integer, nullable=True)

    # Relationships
    exhibit = relationship("Exhibit", back_populates="images")