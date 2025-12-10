from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn
from dotenv import load_dotenv
import os

import models
import schemas
import crud
from database import engine, get_db

# Завантаження змінних середовища
load_dotenv()

# Створення таблиць в БД
models.Base.metadata.create_all(bind=engine)

# Створення FastAPI додатку
app = FastAPI(
    title="Technical Cards Management System",
    description="API для управління технічними картами виробництва",
    version="1.0.0"
)

# Підключення статичних файлів
app.mount("/static", StaticFiles(directory="static"), name="static")

# Головна сторінка
@app.get("/", response_class=HTMLResponse)
def read_root():
    """Повертає HTML інтерфейс"""
    with open("static/index.html", "r", encoding="utf-8") as f:
        return f.read()

# CRUD операції для технічних карт

@app.get("/technical-cards", response_model=List[schemas.TechnicalCard])
def read_technical_cards(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    processing_type: Optional[models.ProcessingType] = None,
    min_duration: Optional[int] = Query(None, ge=0),
    max_duration: Optional[int] = Query(None, ge=0),
    detail_name_contains: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Отримати список технічних карт з можливістю фільтрації.
    
    - **skip**: кількість записів для пропуску
    - **limit**: максимальна кількість записів для повернення
    - **processing_type**: фільтр за типом обробки
    - **min_duration**: мінімальна тривалість обробки
    - **max_duration**: максимальна тривалість обробки
    - **detail_name_contains**: пошук за назвою деталі
    """
    filters = schemas.TechnicalCardFilter(
        processing_type=processing_type,
        min_duration=min_duration,
        max_duration=max_duration,
        detail_name_contains=detail_name_contains
    )
    cards = crud.get_technical_cards(db, skip=skip, limit=limit, filters=filters)
    return cards

@app.get("/technical-cards/filter", response_model=List[schemas.TechnicalCard])
def filter_technical_cards(
    processing_type: Optional[models.ProcessingType] = None,
    min_duration: Optional[int] = Query(None, ge=0),
    max_duration: Optional[int] = Query(None, ge=0),
    detail_name_contains: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Фільтрація технічних карт за різними критеріями.
    """
    filters = schemas.TechnicalCardFilter(
        processing_type=processing_type,
        min_duration=min_duration,
        max_duration=max_duration,
        detail_name_contains=detail_name_contains
    )
    cards = crud.get_technical_cards(db, filters=filters)
    return cards

@app.get("/technical-cards/{card_id}", response_model=schemas.TechnicalCard)
def read_technical_card(card_id: int, db: Session = Depends(get_db)):
    """Отримати технічну карту за ID"""
    db_card = crud.get_technical_card(db, card_id=card_id)
    if db_card is None:
        raise HTTPException(status_code=404, detail="Технічна карта не знайдена")
    return db_card

@app.post("/technical-cards", response_model=schemas.TechnicalCard, status_code=201)
def create_technical_card(
    card: schemas.TechnicalCardCreate,
    db: Session = Depends(get_db)
):
    """Створити нову технічну карту"""
    return crud.create_technical_card(db=db, card=card)

@app.put("/technical-cards/{card_id}", response_model=schemas.TechnicalCard)
def update_technical_card(
    card_id: int,
    card: schemas.TechnicalCardUpdate,
    db: Session = Depends(get_db)
):
    """Оновити технічну карту"""
    db_card = crud.update_technical_card(db, card_id=card_id, card_update=card)
    if db_card is None:
        raise HTTPException(status_code=404, detail="Технічна карта не знайдена")
    return db_card

@app.delete("/technical-cards/{card_id}")
def delete_technical_card(card_id: int, db: Session = Depends(get_db)):
    """Видалити технічну карту"""
    db_card = crud.delete_technical_card(db, card_id=card_id)
    if db_card is None:
        raise HTTPException(status_code=404, detail="Технічна карта не знайдена")
    return {"message": "Технічна карта успішно видалена"}

# Статистика

@app.get("/stats", response_model=schemas.GeneralStats)
def get_statistics(db: Session = Depends(get_db)):
    """Отримати загальну статистику по технічних картах"""
    return crud.get_general_stats(db)

@app.get("/stats/processing-types", response_model=List[schemas.ProcessingStats])
def get_processing_statistics(db: Session = Depends(get_db)):
    """Отримати статистику по видах обробки"""
    return crud.get_processing_stats(db)

# Допоміжні endpoints

@app.get("/processing-types")
def get_processing_types():
    """Отримати список доступних типів обробки"""
    type_labels = {
        "TURNING": "Токарна",
        "MILLING": "Фрезерна",
        "DRILLING": "Свердлільна", 
        "GRINDING": "Шліфувальна",
        "WELDING": "Зварювальна",
        "ASSEMBLY": "Складальна",
        "PAINTING": "Фарбування",
        "THERMAL": "Термічна"
    }
    return [{"value": pt.value, "label": type_labels[pt.value]} for pt in models.ProcessingType]

@app.get("/health")
def health_check():
    """Перевірка працездатності API"""
    return {"status": "healthy", "service": "Technical Cards API"}

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("DEBUG", "True").lower() == "true"
    
    print(f"🚀 Starting server at http://{host}:{port}")
    print(f"📚 API documentation: http://{host}:{port}/docs")
    print(f"📊 ReDoc documentation: http://{host}:{port}/redoc")
    
    uvicorn.run("main:app", host=host, port=port, reload=reload)