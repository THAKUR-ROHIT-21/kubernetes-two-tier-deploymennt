import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email, and password');
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({ name, email, password });

  req.session.userId = user.id;

  res.status(201).json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// @desc    Log in an existing user
// @route   POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.scope('withPassword').findOne({ where: { email } });

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been disabled');
  }

  req.session.userId = user.id;

  res.status(200).json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// @desc    Log out the current user
// @route   POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500);
      throw new Error('Could not log out, please try again');
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  });
});

// @desc    Get the currently logged-in user's info
// @route   GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role },
  });
});