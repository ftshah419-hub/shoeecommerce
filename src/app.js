const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const { checkCurrentUser } = require('./middlewares/authMiddleware');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler');

const app = express();

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

// Mount Main Application Routes
app.use('/', routes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
