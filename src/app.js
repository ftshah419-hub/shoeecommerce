const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const userRoutes = require('./routes/userRoutes');
const { checkCurrentUser } = require('./middlewares/authMiddleware');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler');
const { seedDatabase } = require('./config/db'); // 👈 Added: Database seeder

const app = express();

// Initialize Database & Mock Data on startup
seedDatabase().catch((err) => console.error('Database seed error:', err)); // 👈 Added: Runs seed for Vercel

// View Engine Setup (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Request Parsers & Cookie Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static Files (CSS, JS, Images, Uploads)
app.use(express.static(path.join(__dirname, 'public')));

// Global Context Middleware (attaches currentUser to req and res.locals for EJS views)
app.use(checkCurrentUser);

// Mount User Routes & Root Application Routes
app.use('/user', userRoutes);
app.use('/', routes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
