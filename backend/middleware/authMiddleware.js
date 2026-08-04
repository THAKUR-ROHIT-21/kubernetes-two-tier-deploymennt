import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

// Verifies the request has a valid, active session and attaches the user document to req.user.
// Any route using this middleware requires the user to be logged in.
export const isLoggedIn = asyncHandler(async (req, res, next) => {
  if (!req.session.userId) {
    res.status(401);
    throw new Error('You must be logged in to access this resource');
  }

  const user = await User.findByPk(req.session.userId);

  if (!user || !user.isActive) {
    req.session.destroy(() => {});
    res.status(401);
    throw new Error('Session is no longer valid, please log in again');
  }

  req.user = user;
  next();
});

// Must run AFTER isLoggedIn — checks that req.user has the 'admin' role.
// This is what gives admins "full access" to admin-only routes like product creation.
export const isAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required for this action');
  }
  next();
});