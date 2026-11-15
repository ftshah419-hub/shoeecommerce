const notFoundHandler = (req, res, next) => {
  res.status(404);
  if (req.accepts('html')) {
    return res.render('error', {
      title: 'Page Not Found',
      errorCode: 404,
      errorMessage: `The requested path "${req.originalUrl}" was not found on Neleeri Sneakers.`,
    });
  }
  res.json({ success: false, error: 'Resource not found' });
};

const globalErrorHandler = (err, req, res, next) => {
  console.error('Unhandled Application Error:', err.stack || err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode);

  if (req.accepts('html')) {
    return res.render('error', {
      title: 'Error Occurred',
      errorCode: statusCode,
      errorMessage: message,
    });
  }

  res.json({
    success: false,
    statusCode,
    error: message,
  });
};

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};
