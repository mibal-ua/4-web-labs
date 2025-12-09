const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const typeDefs = require('./schema/typeDefs');
const resolvers = require('./schema/resolvers');

async function startServer() {
    const app = express();
    
    // Middleware
    app.use(cors());
    app.use(express.json());
    
    // Підключення до MongoDB
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');
        
        // Створення індексів
        console.log('📚 Creating database indexes...');
        const { Book } = require('./models/Book');
        await Book.collection.createIndex({ 
            title: 'text', 
            'author.name': 'text', 
            description: 'text' 
        });
        console.log('✅ Database indexes created');
        
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
    
    // Створення Apollo Server
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req }) => {
            // Тут можна додати контекст для авторизації
            return {
                user: req.user || null,
                req
            };
        },
        // Включення GraphQL Playground в development режимі
        introspection: process.env.NODE_ENV !== 'production',
        playground: process.env.NODE_ENV !== 'production' ? {
            settings: {
                'request.credentials': 'include',
                'schema.polling.enable': false,
                'tracing.hideTracingResponse': false
            }
        } : false,
        // Форматування помилок
        formatError: (error) => {
            console.error('GraphQL Error:', error);
            return {
                message: error.message,
                code: error.extensions?.code,
                path: error.path
            };
        }
    });
    
    await server.start();
    
    // Застосування GraphQL middleware
    server.applyMiddleware({ app, path: '/graphql' });
    
    // Базовий маршрут
    app.get('/', (req, res) => {
        res.json({
            message: '🚀 GraphQL Lab 5 Server',
            graphqlEndpoint: '/graphql',
            playgroundUrl: process.env.NODE_ENV !== 'production' ? '/graphql' : null,
            status: 'running'
        });
    });
    
    // Health check endpoint
    app.get('/health', async (req, res) => {
        try {
            // Перевірка підключення до бази даних
            await mongoose.connection.db.admin().ping();
            res.status(200).json({
                status: 'healthy',
                mongodb: 'connected',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(503).json({
                status: 'unhealthy',
                mongodb: 'disconnected',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // Обробка помилок
    app.use((error, req, res, next) => {
        console.error('Express Error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    });
    
    const PORT = process.env.PORT || 4000;
    
    app.listen(PORT, () => {
        console.log('🚀 Server ready!');
        console.log(`📡 Server running at: http://localhost:${PORT}`);
        console.log(`🎮 GraphQL Playground: http://localhost:${PORT}${server.graphqlPath}`);
        console.log(`💾 Database: ${process.env.MONGODB_URI}`);
    });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('⏳ Shutting down gracefully...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('⏳ Shutting down gracefully...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
});

// Обробка необроблених помилок
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

startServer().catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});