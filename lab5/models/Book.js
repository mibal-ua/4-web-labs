const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  birthDate: {
    type: Date
  },
  country: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: authorSchema,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  publishedYear: {
    type: Number,
    min: 1000,
    max: new Date().getFullYear() + 1
  },
  category: {
    type: String,
    required: true,
    enum: ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography', 'Fantasy', 'Mystery', 'Romance', 'Thriller']
  },
  price: {
    type: Number,
    min: 0
  },
  inStock: {
    type: Boolean,
    default: true
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true
  },
  pages: {
    type: Number,
    min: 1
  },
  language: {
    type: String,
    default: 'English'
  },
  publisher: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5
  }
}, {
  timestamps: true
});

bookSchema.index({ title: 'text', 'author.name': 'text', description: 'text' });
bookSchema.index({ category: 1 });
bookSchema.index({ publishedYear: 1 });
bookSchema.index({ price: 1 });

const Author = mongoose.model('Author', authorSchema);
const Book = mongoose.model('Book', bookSchema);

module.exports = { Book, Author };