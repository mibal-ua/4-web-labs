from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
import models
import schemas

def get_technical_card(db: Session, card_id: int):
    """Отримати технічну карту за ID"""
    return db.query(models.TechnicalCard).filter(models.TechnicalCard.id == card_id).first()

def get_technical_cards(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    filters: Optional[schemas.TechnicalCardFilter] = None
):
    """Отримати список технічних карт з фільтрацією"""
    query = db.query(models.TechnicalCard)
    
    if filters:
        conditions = []
        
        if filters.processing_type:
            conditions.append(models.TechnicalCard.processing_type == filters.processing_type)
        
        if filters.min_duration is not None:
            conditions.append(models.TechnicalCard.processing_duration >= filters.min_duration)
        
        if filters.max_duration is not None:
            conditions.append(models.TechnicalCard.processing_duration <= filters.max_duration)
        
        if filters.detail_name_contains:
            conditions.append(models.TechnicalCard.detail_name.contains(filters.detail_name_contains))
        
        if conditions:
            query = query.filter(and_(*conditions))
    
    return query.offset(skip).limit(limit).all()

def create_technical_card(db: Session, card: schemas.TechnicalCardCreate):
    """Створити нову технічну карту"""
    db_card = models.TechnicalCard(**card.model_dump())
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card

def update_technical_card(db: Session, card_id: int, card_update: schemas.TechnicalCardUpdate):
    """Оновити технічну карту"""
    db_card = get_technical_card(db, card_id)
    if db_card:
        update_data = card_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_card, field, value)
        db.commit()
        db.refresh(db_card)
    return db_card

def delete_technical_card(db: Session, card_id: int):
    """Видалити технічну карту"""
    db_card = get_technical_card(db, card_id)
    if db_card:
        db.delete(db_card)
        db.commit()
    return db_card

def get_processing_stats(db: Session):
    """Отримати статистику по видах обробки"""
    stats = []
    
    # Отримуємо всі типи обробки
    for processing_type in models.ProcessingType:
        cards = db.query(models.TechnicalCard).filter(
            models.TechnicalCard.processing_type == processing_type
        ).all()
        
        if cards:
            count = len(cards)
            total_duration = sum(card.processing_duration for card in cards)
            avg_duration = total_duration / count
            
            stats.append({
                "processing_type": processing_type,
                "count": count,
                "total_duration": total_duration,
                "average_duration": round(avg_duration, 2)
            })
    
    return stats

def get_general_stats(db: Session):
    """Отримати загальну статистику"""
    all_cards = db.query(models.TechnicalCard).all()
    
    if not all_cards:
        return {
            "total_cards": 0,
            "total_processing_time": 0,
            "average_processing_time": 0,
            "processing_stats": []
        }
    
    total_cards = len(all_cards)
    total_time = sum(card.processing_duration for card in all_cards)
    avg_time = total_time / total_cards
    
    return {
        "total_cards": total_cards,
        "total_processing_time": total_time,
        "average_processing_time": round(avg_time, 2),
        "processing_stats": get_processing_stats(db)
    }