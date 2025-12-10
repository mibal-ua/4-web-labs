from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from database import Base
import enum

class ProcessingType(str, enum.Enum):
    """Типи обробки деталей"""
    TURNING = "TURNING"
    MILLING = "MILLING" 
    DRILLING = "DRILLING"
    GRINDING = "GRINDING"
    WELDING = "WELDING"
    ASSEMBLY = "ASSEMBLY"
    PAINTING = "PAINTING"
    THERMAL = "THERMAL"

class TechnicalCard(Base):
    """Модель технічної карти"""
    __tablename__ = "technical_cards"

    id = Column(Integer, primary_key=True, index=True)
    detail_name = Column(String, nullable=False, index=True)
    processing_type = Column(Enum(ProcessingType), nullable=False, index=True)
    processing_duration = Column(Integer, nullable=False)  # в хвилинах
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<TechnicalCard(id={self.id}, detail_name='{self.detail_name}', processing_type='{self.processing_type}', duration={self.processing_duration}min)>"