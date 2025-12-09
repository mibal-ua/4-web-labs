const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar Date

  type Author {
    id: ID!
    name: String!
    bio: String
    birthDate: Date
    country: String
    createdAt: Date!
    updatedAt: Date!
  }

  input AuthorInput {
    name: String!
    bio: String
    birthDate: Date
    country: String
  }

  input AuthorUpdateInput {
    name: String
    bio: String
    birthDate: Date
    country: String
  }

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
    createdAt: Date!
    updatedAt: Date!
  }

  input BookInput {
    title: String!
    author: AuthorInput!
    description: String
    publishedYear: Int
    category: Category!
    price: Float
    inStock: Boolean = true
    isbn: String
    pages: Int
    language: String = "English"
    publisher: String
    rating: Float
  }

  input BookUpdateInput {
    title: String
    author: AuthorUpdateInput
    description: String
    publishedYear: Int
    category: Category
    price: Float
    inStock: Boolean
    isbn: String
    pages: Int
    language: String
    publisher: String
    rating: Float
  }

  enum Category {
    FICTION
    NON_FICTION
    SCIENCE
    TECHNOLOGY
    HISTORY
    BIOGRAPHY
    FANTASY
    MYSTERY
    ROMANCE
    THRILLER
  }

  enum SortOrder {
    ASC
    DESC
  }

  enum BookSortField {
    TITLE
    PUBLISHED_YEAR
    PRICE
    RATING
    CREATED_AT
  }

  input BookFilters {
    category: Category
    minPrice: Float
    maxPrice: Float
    minYear: Int
    maxYear: Int
    inStock: Boolean
    search: String
    language: String
  }

  input BookSort {
    field: BookSortField!
    order: SortOrder = ASC
  }

  type BookConnection {
    books: [Book!]!
    totalCount: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type CategoryStats {
    category: Category!
    count: Int!
    averagePrice: Float
    averageRating: Float
  }

  type Query {
    # Отримання всіх книг з фільтрацією та пагінацією
    books(
      filters: BookFilters
      sort: BookSort
      page: Int = 1
      limit: Int = 10
    ): BookConnection!

    # Отримання книги за ID
    book(id: ID!): Book

    # Пошук книг за текстом
    searchBooks(query: String!, limit: Int = 10): [Book!]!

    # Отримання книг за автором
    booksByAuthor(authorName: String!, limit: Int = 10): [Book!]!

    # Отримання книг за категорією
    booksByCategory(category: Category!, limit: Int = 10): [Book!]!

    # Статистика за категоріями
    categoryStats: [CategoryStats!]!

    # Отримання всіх унікальних авторів
    authors(limit: Int = 50): [Author!]!

    # Отримання всіх категорій з кількістю книг
    categories: [CategoryStats!]!
  }

  type Mutation {
    # Створення нової книги
    addBook(input: BookInput!): Book!

    # Оновлення книги
    updateBook(id: ID!, input: BookUpdateInput!): Book

    # Видалення книги
    deleteBook(id: ID!): Boolean!

    # Масове додавання книг
    addBooks(books: [BookInput!]!): [Book!]!

    # Оновлення статусу наявності
    updateBookStock(id: ID!, inStock: Boolean!): Book

    # Оновлення рейтингу книги
    updateBookRating(id: ID!, rating: Float!): Book
  }

  type Subscription {
    # Підписка на нові книги
    bookAdded: Book!

    # Підписка на оновлення книг
    bookUpdated: Book!

    # Підписка на видалення книг
    bookDeleted: ID!
  }
`;

module.exports = typeDefs;