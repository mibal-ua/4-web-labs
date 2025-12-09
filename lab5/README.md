# Lab 5 - GraphQL Server with Schema and Resolvers

## Опис
GraphQL сервер для управління бібліотекою книг з повним набором Schema, Resolvers, Query та Mutation операцій.

## Функціональність
- **GraphQL Schema**: повні типи даних та їх зв'язки
- **Queries**: отримання даних з фільтрацією та пагінацією
- **Mutations**: CRUD операції для управління книгами
- **Resolvers**: логіка обробки GraphQL запитів
- **MongoDB**: збереження даних з Mongoose ODM
- **GraphQL Playground**: інтерактивне тестування API

## Технології
- **Apollo Server Express** - GraphQL сервер
- **GraphQL** - мова запитів та схем
- **MongoDB** + **Mongoose** - база даних
- **Express.js** - веб-фреймворк

## Встановлення та запуск

1. Переконайтеся, що MongoDB запущено:
```bash
mongod
```

2. Встановіть залежності:
```bash
cd lab5
npm install
```

3. Запустіть сервер:
```bash
npm start
```

4. Відкрийте GraphQL Playground: http://localhost:4000/graphql

## GraphQL Schema

### Types
```graphql
type Book {
  id: ID!
  title: String!
  author: Author!
  description: String
  publishedYear: Int
  category: Category!
  price: Float
  inStock: Boolean!
  isbn: String
  pages: Int
  language: String
  publisher: String
  rating: Float
}

type Author {
  id: ID!
  name: String!
  bio: String
  birthDate: Date
  country: String
}
```

### Queries
- `books(filters, sort, page, limit)` - отримати книги з фільтрацією
- `book(id)` - отримати книгу за ID
- `searchBooks(query)` - пошук книг за текстом
- `booksByAuthor(authorName)` - книги за автором
- `booksByCategory(category)` - книги за категорією
- `categoryStats` - статистика за категоріями
- `authors` - список авторів

### Mutations
- `addBook(input)` - додати книгу
- `updateBook(id, input)` - оновити книгу
- `deleteBook(id)` - видалити книгу
- `addBooks(books)` - масове додавання
- `updateBookStock(id, inStock)` - оновити наявність
- `updateBookRating(id, rating)` - оновити рейтинг

## Приклади запитів

### Query - Отримання книг
```graphql
query GetBooks {
  books(
    filters: { category: FICTION, minPrice: 10 }
    sort: { field: TITLE, order: ASC }
    page: 1
    limit: 5
  ) {
    books {
      id
      title
      author {
        name
        country
      }
      price
      category
      inStock
    }
    totalCount
    hasNextPage
  }
}
```

### Mutation - Додавання книги
```graphql
mutation AddBook {
  addBook(input: {
    title: "The Great Gatsby"
    author: {
      name: "F. Scott Fitzgerald"
      bio: "American novelist"
      country: "USA"
    }
    category: FICTION
    publishedYear: 1925
    price: 15.99
    pages: 180
    inStock: true
  }) {
    id
    title
    author {
      name
    }
    category
  }
}
```

### Query - Пошук книг
```graphql
query SearchBooks {
  searchBooks(query: "javascript programming", limit: 3) {
    title
    author {
      name
    }
    description
    rating
  }
}
```

### Query - Статистика
```graphql
query Stats {
  categoryStats {
    category
    count
    averagePrice
    averageRating
  }
}
```

## Структура проекту
```
lab5/
├── server.js              # Головний сервер
├── schema/                 # GraphQL схеми
│   ├── typeDefs.js        # Type definitions
│   └── resolvers.js       # Resolvers
├── models/                # MongoDB моделі
│   └── Book.js           # Модель книги
├── package.json          # Конфігурація
├── .env                  # Змінні середовища
└── README.md            # Документація
```

## Автор
Балахон