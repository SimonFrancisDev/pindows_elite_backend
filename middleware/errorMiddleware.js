// /middleware/errorMiddleware.js

/**
 * Middleware: Handle routes that don't exist (404)
 * This runs when no other route matches the request URL.
 */
const notFound = (req, res, next) => {
  const error = new Error(`❌ Route Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Passes the error to the next middleware (errorHandler)
};

/**
 * Middleware: General Error Handler
 * Catches and formats all application errors in one place.
 */
const errorHandler = (err, req, res, next) => {
  // Express sometimes sends 200 even when errors occur — fix that:
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Include stack trace only in development mode for debugging
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    // Optionally log the path that caused the error
    path: req.originalUrl,
  });
};

export { notFound, errorHandler }; // ✅ Modern ES module syntax
