# Lab 6 - FastAPI Technical Cards Management System

## Опис
Веб-додаток для управління технічними картами виробництва, побудований на FastAPI (Python).

## Варіант 11 - База технічних карт
- **Поля**: назва деталі, вид обробки, тривалість обробки

## Функціональність
- **CRUD операції**: створення, читання, оновлення, видалення технічних карт
- **Фільтрація**: за видом обробки, тривалістю, назвою деталі
- **Статистика**: загальна та по видах обробки
- **HTML інтерфейс**: для зручного управління картами
- **API документація**: автоматична генерація Swagger UI та ReDoc

## Технології
- **FastAPI** - сучасний веб-фреймворк для Python
- **SQLAlchemy** - ORM для роботи з базами даних
- **SQLite** - локальна база даних
- **Pydantic** - валідація даних
- **Uvicorn** - ASGI сервер

## Встановлення та запуск

1. Створіть віртуальне середовище:
```bash
python -m venv venv
source venv/bin/activate  # На Windows: venv\Scripts\activate
```

2. Встановіть залежності:
```bash
cd lab6
pip install -r requirements.txt
```

3. Запустіть сервер:
```bash
python main.py
```

4. Відкрийте браузер:
- Головна сторінка: http://localhost:8000
- API документація: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Технічні карти
- `GET /technical-cards` - отримати всі карти (з фільтрацією)
- `GET /technical-cards/{id}` - отримати карту за ID
- `POST /technical-cards` - створити нову карту
- `PUT /technical-cards/{id}` - оновити карту
- `DELETE /technical-cards/{id}` - видалити карту

### Фільтрація
- `GET /technical-cards/filter` - фільтрація карт

Параметри фільтрації:
- `processing_type` - вид обробки
- `min_duration` - мінімальна тривалість
- `max_duration` - максимальна тривалість
- `detail_name_contains` - пошук за назвою

### Статистика
- `GET /stats` - загальна статистика
- `GET /stats/processing-types` - статистика по видах обробки

### Допоміжні
- `GET /processing-types` - список видів обробки
- `GET /health` - перевірка працездатності

## Структура проекту
```
lab6/
├── main.py              # Головний файл FastAPI
├── models.py            # SQLAlchemy моделі
├── schemas.py           # Pydantic схеми
├── database.py          # Підключення до БД
├── crud.py              # CRUD операції
├── requirements.txt     # Python залежності
├── .env                 # Змінні середовища
├── static/              # Статичні файли
│   ├── index.html      # HTML інтерфейс
│   ├── style.css       # Стилі
│   └── script.js       # JavaScript
└── README.md           # Документація
```

## Види обробки
- Токарна
- Фрезерна
- Свердлильна
- Шліфувальна
- Зварювальна
- Складальна
- Фарбування
- Термічна

## Приклади використання API

### Створення технічної карти
```bash
curl -X POST "http://localhost:8000/technical-cards" \
  -H "Content-Type: application/json" \
  -d '{
    "detail_name": "Вал приводний",
    "processing_type": "TURNING",
    "processing_duration": 45
  }'
```

### Фільтрація карт
```bash
curl "http://localhost:8000/technical-cards?processing_type=MILLING&min_duration=30"
```

### Отримання статистики
```bash
curl "http://localhost:8000/stats"
```

## Автор
Балахон М.О., група ІМ-22