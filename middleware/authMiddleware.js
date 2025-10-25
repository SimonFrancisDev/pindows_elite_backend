// /middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

/**
 * 🔒 protect middleware
 * Verifies JWT tokens and attaches the authenticated user to req.user
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if the request header contains "Authorization: Bearer <token>"
  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      // Extract token (remove "Bearer ")
      token = req.headers.authorization.split(' ')[1];

      // Verify and decode token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the user (without password) from database
      req.user = await User.findById(decoded.id).select('-password');

      // If no user found, deny access
      if (!req.user) {
        res.status(401);
        throw new Error('User not found, invalid token');
      }

      next(); // Continue to next middleware/controller
    } catch (error) {
      console.error('JWT Verification Failed:', error.message);
      res.status(401);
      throw new Error('Not authorized, token invalid or expired');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }
});

/**
 * 🛡 authorizeRoles middleware
 * Restricts route access to specific user roles
 * Usage: authorizeRoles('admin'), authorizeRoles('admin', 'superadmin')
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, no user context');
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Access denied: ${req.user.role} is not authorized to access this route`
      );
    }

    next();
  };
};


// 🟢 NEW: OPTIONAL PROTECT MIDDLEWARE
// Tries to extract the user from the token but does NOT throw an error if the token is invalid or missing.
// It sets req.user if successful, allowing the controller to check both req.user (logged-in) and req.body (guest).
export const optionalProtect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token and get user id
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch user but exclude password
            req.user = await User.findById(decoded.id).select('-password');

            // If user is found, proceed to next middleware/controller
            next();

        } catch (error) {
            // If token verification fails (e.g., expired or invalid), 
            // OR if no user is found, just log the error and proceed as guest.
            // console.error('Optional Protect Token Error:', error.message); 
            // No need to throw an error or send a 401 response here.
            req.user = null; 
            next();
        }
    } else {
        // No token provided, proceed as guest
        req.user = null;
        next();
    }
});