from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from models import ProcessingType

class TechnicalCardBase(BaseModel):
    """Базова схема технічної карти"""
    detail_name: str = Field(..., min_length=1, max_length=200, description="Назва деталі")
    processing_type: ProcessingType = Field(..., description="Тип обробки")
    processing_duration: int = Field(..., gt=0, description="Тривалість обробки в хвилинах")

class TechnicalCardCreate(TechnicalCardBase):
    """Схема для створення технічної карти"""
    pass

class TechnicalCardUpdate(BaseModel):
    """Схема для оновлення технічної карти"""
    detail_name: Optional[str] = Field(None, min_length=1, max_length=200)
    processing_type: Optional[ProcessingType] = None
    processing_duration: Optional[int] = Field(None, gt=0)

class TechnicalCard(TechnicalCardBase):
    """Повна схема технічної карти з усіма полями"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class TechnicalCardFilter(BaseModel):
    """Схема для фільтрації технічних карт"""
    processing_type: Optional[ProcessingType] = None
    min_duration: Optional[int] = Field(None, ge=0)
    max_duration: Optional[int] = Field(None, ge=0)
    detail_name_contains: Optional[str] = None

class ProcessingStats(BaseModel):
    """Схема для статистики по видах обробки"""
    processing_type: ProcessingType
    count: int
    total_duration: int
    average_duration: float

class GeneralStats(BaseModel):
    """Загальна статистика"""
    total_cards: int
    total_processing_time: int
    average_processing_time: float
    processing_stats: list[ProcessingStats]