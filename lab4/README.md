# Lab 4 - MongoDB CRUD Application

## Опис
Веб-додаток для управління продуктами з використанням MongoDB як бази даних. Додаток надає повний CRUD функціонал та статистику.

## Функціональність
- **CRUD операції**: створення, читання, оновлення та видалення продуктів
- **Фільтрація**: за категорією та діапазоном цін
- **Сортування**: за назвою та ціною
- **Статистика**: загальна та за категоріями
- **Адаптивний дизайн**: працює на всіх пристроях

## Технології
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (локальна)
- **Frontend**: HTML, CSS, JavaScript (Vanilla)

## Встановлення та запуск

1. Переконайтеся, що MongoDB встановлено та запущено локально:
```bash
mongod
```

2. Встановіть залежності:
```bash
cd lab4
npm install
```

3. Запустіть сервер:
```bash
npm start
```
або для режиму розробки:
```bash
npm run dev
```

4. Відкрийте браузер: http://localhost:3004

## API Endpoints

### Products
- `GET /api/products` - отримати всі продукти (з фільтрами)
- `GET /api/products/:id` - отримати продукт за ID
- `POST /api/products` - створити новий продукт
- `PUT /api/products/:id` - оновити продукт
- `DELETE /api/products/:id` - видалити продукт

### Categories
- `GET /api/categories` - отримати список категорій

### Statistics
- `GET /api/statistics` - отримати статистику

## Структура даних продукту
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  category: String,
  price: Number,
  quantity: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Конфігурація
Налаштування знаходяться в файлі `.env`:
- `MONGODB_URI` - URI підключення до MongoDB
- `PORT` - порт сервера

## Автор
Балахон