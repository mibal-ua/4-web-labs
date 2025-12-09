const { Book } = require('../models/Book');
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');

// Кастомний скалярний тип для дати
const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    return value instanceof Date ? value.toISOString() : null;
  },
  parseValue(value) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

const resolvers = {
  Date: dateScalar,

  Query: {
    // Отримання всіх книг з фільтрацією та пагінацією
    books: async (parent, { filters = {}, sort, page = 1, limit = 10 }) => {
      try {
        const query = {};
        
        // Застосування фільтрів
        if (filters.category) {
          const categoryMap = {
            'FICTION': 'Fiction',
            'NON_FICTION': 'Non-Fiction',
            'SCIENCE': 'Science',
            'TECHNOLOGY': 'Technology',
            'HISTORY': 'History',
            'BIOGRAPHY': 'Biography',
            'FANTASY': 'Fantasy',
            'MYSTERY': 'Mystery',
            'ROMANCE': 'Romance',
            'THRILLER': 'Thriller'
          };
          query.category = categoryMap[filters.category] || filters.category;
        }
        
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
          query.price = {};
          if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
          if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
        }
        
        if (filters.minYear !== undefined || filters.maxYear !== undefined) {
          query.publishedYear = {};
          if (filters.minYear !== undefined) query.publishedYear.$gte = filters.minYear;
          if (filters.maxYear !== undefined) query.publishedYear.$lte = filters.maxYear;
        }
        
        if (filters.inStock !== undefined) {
          query.inStock = filters.inStock;
        }
        
        if (filters.language) {
          query.language = filters.language;
        }
        
        if (filters.search) {
          query.$text = { $search: filters.search };
        }
        
        // Підрахунок загальної кількості
        const totalCount = await Book.countDocuments(query);
        
        // Сортування
        let sortObj = {};
        if (sort) {
          const sortOrder = sort.order === 'DESC' ? -1 : 1;
          switch (sort.field) {
            case 'TITLE':
              sortObj.title = sortOrder;
              break;
            case 'PUBLISHED_YEAR':
              sortObj.publishedYear = sortOrder;
              break;
            case 'PRICE':
              sortObj.price = sortOrder;
              break;
            case 'RATING':
              sortObj.rating = sortOrder;
              break;
            case 'CREATED_AT':
              sortObj.createdAt = sortOrder;
              break;
            default:
              sortObj.createdAt = -1;
          }
        } else {
          sortObj.createdAt = -1;
        }
        
        // Пагінація
        const skip = (page - 1) * limit;
        const books = await Book.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(limit);
        
        return {
          books,
          totalCount,
          hasNextPage: skip + limit < totalCount,
          hasPreviousPage: page > 1
        };
      } catch (error) {
        throw new Error(`Error fetching books: ${error.message}`);
      }
    },

    // Отримання книги за ID
    book: async (parent, { id }) => {
      try {
        const book = await Book.findById(id);
        if (!book) {
          throw new Error('Book not found');
        }
        return book;
      } catch (error) {
        throw new Error(`Error fetching book: ${error.message}`);
      }
    },

    // Пошук книг за текстом
    searchBooks: async (parent, { query, limit = 10 }) => {
      try {
        const books = await Book.find({
          $text: { $search: query }
        }, {
          score: { $meta: 'textScore' }
        })
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit);
        
        return books;
      } catch (error) {
        throw new Error(`Error searching books: ${error.message}`);
      }
    },

    // Отримання книг за автором
    booksByAuthor: async (parent, { authorName, limit = 10 }) => {
      try {
        const books = await Book.find({
          'author.name': { $regex: authorName, $options: 'i' }
        }).limit(limit);
        return books;
      } catch (error) {
        throw new Error(`Error fetching books by author: ${error.message}`);
      }
    },

    // Отримання книг за категорією
    booksByCategory: async (parent, { category, limit = 10 }) => {
      try {
        const categoryMap = {
          'FICTION': 'Fiction',
          'NON_FICTION': 'Non-Fiction',
          'SCIENCE': 'Science',
          'TECHNOLOGY': 'Technology',
          'HISTORY': 'History',
          'BIOGRAPHY': 'Biography',
          'FANTASY': 'Fantasy',
          'MYSTERY': 'Mystery',
          'ROMANCE': 'Romance',
          'THRILLER': 'Thriller'
        };
        const dbCategory = categoryMap[category] || category;
        const books = await Book.find({ category: dbCategory }).limit(limit);
        return books;
      } catch (error) {
        throw new Error(`Error fetching books by category: ${error.message}`);
      }
    },

    // Статистика за категоріями
    categoryStats: async () => {
      try {
        const stats = await Book.aggregate([
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 },
              averagePrice: { $avg: '$price' },
              averageRating: { $avg: '$rating' }
            }
          },
          {
            $project: {
              category: '$_id',
              count: 1,
              averagePrice: { $round: ['$averagePrice', 2] },
              averageRating: { $round: ['$averageRating', 1] },
              _id: 0
            }
          },
          { $sort: { count: -1 } }
        ]);
        
        // Конвертація категорій у GraphQL формат
        const categoryMap = {
          'Fiction': 'FICTION',
          'Non-Fiction': 'NON_FICTION',
          'Science': 'SCIENCE',
          'Technology': 'TECHNOLOGY',
          'History': 'HISTORY',
          'Biography': 'BIOGRAPHY',
          'Fantasy': 'FANTASY',
          'Mystery': 'MYSTERY',
          'Romance': 'ROMANCE',
          'Thriller': 'THRILLER'
        };
        
        return stats.map(stat => ({
          ...stat,
          category: categoryMap[stat.category] || stat.category
        }));
      } catch (error) {
        throw new Error(`Error fetching category stats: ${error.message}`);
      }
    },

    // Отримання всіх унікальних авторів
    authors: async (parent, { limit = 50 }) => {
      try {
        const authors = await Book.aggregate([
          { $group: { _id: '$author', bookCount: { $sum: 1 } } },
          { $sort: { bookCount: -1 } },
          { $limit: limit },
          {
            $project: {
              id: '$_id._id',
              name: '$_id.name',
              bio: '$_id.bio',
              birthDate: '$_id.birthDate',
              country: '$_id.country',
              createdAt: '$_id.createdAt',
              updatedAt: '$_id.updatedAt'
            }
          }
        ]);
        
        return authors;
      } catch (error) {
        throw new Error(`Error fetching authors: ${error.message}`);
      }
    },

    // Отримання всіх категорій
    categories: async () => {
      try {
        const categories = await Book.aggregate([
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 },
              averagePrice: { $avg: '$price' },
              averageRating: { $avg: '$rating' }
            }
          },
          {
            $project: {
              category: '$_id',
              count: 1,
              averagePrice: { $round: ['$averagePrice', 2] },
              averageRating: { $round: ['$averageRating', 1] },
              _id: 0
            }
          },
          { $sort: { category: 1 } }
        ]);
        
        // Конвертація категорій у GraphQL формат
        const categoryMap = {
          'Fiction': 'FICTION',
          'Non-Fiction': 'NON_FICTION',
          'Science': 'SCIENCE',
          'Technology': 'TECHNOLOGY',
          'History': 'HISTORY',
          'Biography': 'BIOGRAPHY',
          'Fantasy': 'FANTASY',
          'Mystery': 'MYSTERY',
          'Romance': 'ROMANCE',
          'Thriller': 'THRILLER'
        };
        
        return categories.map(category => ({
          ...category,
          category: categoryMap[category.category] || category.category
        }));
      } catch (error) {
        throw new Error(`Error fetching categories: ${error.message}`);
      }
    }
  },

  Mutation: {
    // Створення нової книги
    addBook: async (parent, { input }) => {
      try {
        // Конвертація категорії з GraphQL ENUM у MongoDB формат
        const categoryMap = {
          'FICTION': 'Fiction',
          'NON_FICTION': 'Non-Fiction',
          'SCIENCE': 'Science',
          'TECHNOLOGY': 'Technology',
          'HISTORY': 'History',
          'BIOGRAPHY': 'Biography',
          'FANTASY': 'Fantasy',
          'MYSTERY': 'Mystery',
          'ROMANCE': 'Romance',
          'THRILLER': 'Thriller'
        };
        
        const book = new Book({
          ...input,
          category: categoryMap[input.category] || input.category
        });
        
        const savedBook = await book.save();
        return savedBook;
      } catch (error) {
        if (error.code === 11000) {
          throw new Error('Book with this ISBN already exists');
        }
        throw new Error(`Error creating book: ${error.message}`);
      }
    },

    // Оновлення книги
    updateBook: async (parent, { id, input }) => {
      try {
        const updateData = { ...input };
        
        // Конвертація категорії
        if (updateData.category) {
          const categoryMap = {
            'FICTION': 'Fiction',
            'NON_FICTION': 'Non-Fiction',
            'SCIENCE': 'Science',
            'TECHNOLOGY': 'Technology',
            'HISTORY': 'History',
            'BIOGRAPHY': 'Biography',
            'FANTASY': 'Fantasy',
            'MYSTERY': 'Mystery',
            'ROMANCE': 'Romance',
            'THRILLER': 'Thriller'
          };
          updateData.category = categoryMap[updateData.category] || updateData.category;
        }
        
        const book = await Book.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        );
        
        if (!book) {
          throw new Error('Book not found');
        }
        
        return book;
      } catch (error) {
        throw new Error(`Error updating book: ${error.message}`);
      }
    },

    // Видалення книги
    deleteBook: async (parent, { id }) => {
      try {
        const book = await Book.findByIdAndDelete(id);
        return !!book;
      } catch (error) {
        throw new Error(`Error deleting book: ${error.message}`);
      }
    },

    // Масове додавання книг
    addBooks: async (parent, { books }) => {
      try {
        const categoryMap = {
          'FICTION': 'Fiction',
          'NON_FICTION': 'Non-Fiction',
          'SCIENCE': 'Science',
          'TECHNOLOGY': 'Technology',
          'HISTORY': 'History',
          'BIOGRAPHY': 'Biography',
          'FANTASY': 'Fantasy',
          'MYSTERY': 'Mystery',
          'ROMANCE': 'Romance',
          'THRILLER': 'Thriller'
        };
        
        const booksToCreate = books.map(book => ({
          ...book,
          category: categoryMap[book.category] || book.category
        }));
        
        const savedBooks = await Book.insertMany(booksToCreate, { ordered: false });
        return savedBooks;
      } catch (error) {
        throw new Error(`Error creating books: ${error.message}`);
      }
    },

    // Оновлення статусу наявності
    updateBookStock: async (parent, { id, inStock }) => {
      try {
        const book = await Book.findByIdAndUpdate(
          id,
          { inStock },
          { new: true }
        );
        
        if (!book) {
          throw new Error('Book not found');
        }
        
        return book;
      } catch (error) {
        throw new Error(`Error updating book stock: ${error.message}`);
      }
    },

    // Оновлення рейтингу книги
    updateBookRating: async (parent, { id, rating }) => {
      try {
        if (rating < 0 || rating > 5) {
          throw new Error('Rating must be between 0 and 5');
        }
        
        const book = await Book.findByIdAndUpdate(
          id,
          { rating },
          { new: true }
        );
        
        if (!book) {
          throw new Error('Book not found');
        }
        
        return book;
      } catch (error) {
        throw new Error(`Error updating book rating: ${error.message}`);
      }
    }
  },

  // Резолвери для типу Author (вкладені запити)
  Author: {
    id: (author) => author._id || author.id
  },

  // Резолвери для типу Book (вкладені запити)
  Book: {
    id: (book) => book._id,
    author: (book) => book.author,
    category: (book) => {
      // Конвертація категорії з MongoDB формату у GraphQL ENUM
      const categoryMap = {
        'Fiction': 'FICTION',
        'Non-Fiction': 'NON_FICTION',
        'Science': 'SCIENCE',
        'Technology': 'TECHNOLOGY',
        'History': 'HISTORY',
        'Biography': 'BIOGRAPHY',
        'Fantasy': 'FANTASY',
        'Mystery': 'MYSTERY',
        'Romance': 'ROMANCE',
        'Thriller': 'THRILLER'
      };
      return categoryMap[book.category] || book.category;
    }
  }
};

module.exports = resolvers;