import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../middleware/auth';
import { isValidEmail, isValidPassword } from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import crypto from 'crypto';

// Register user
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, role = 'USER' } = req.body;

  // Validate input
  if (!name || !email || !password) {
    res.status(400).json({
      success: false,
      message: 'Please provide name, email, and password'
    });
    return;
  }

  // Validate email
  if (!isValidEmail(email)) {
    res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
    return;
  }

  // Validate password
  const passwordValidation = isValidPassword(password);
  if (!passwordValidation.isValid) {
    res.status(400).json({
      success: false,
      message: 'Password validation failed',
      errors: passwordValidation.errors
    });
    return;
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existingUser) {
    res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
    return;
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Generate UUID for user
  const userId = crypto.randomUUID();

  // Create user
  const user = await prisma.user.create({
    data: {
      id: userId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role.toUpperCase()
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  // Generate token
  const token = generateToken(user.id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user
  });
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
    return;
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
    return;
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, user.password);

  if (!isPasswordValid) {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
    return;
  }

  // Generate token
  const token = generateToken(user.id);

  // Remove password from response
  const { password: _, ...userResponse } = user;

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: userResponse
  });
});

// Get current user
export const getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    user
  });
});

// Update user profile
export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { name } = req.body;

  if (!name) {
    res.status(400).json({
      success: false,
      message: 'Please provide a name'
    });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user
  });
});

// Change password
export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({
      success: false,
      message: 'Please provide current and new password'
    });
    return;
  }

  // Validate new password
  const passwordValidation = isValidPassword(newPassword);

  if (!passwordValidation.isValid) {
    res.status(400).json({
      success: false,
      message: 'New password validation failed',
      errors: passwordValidation.errors
    });
    return;
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id }
  });

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
    return;
  }

  // Verify current password
  const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);

  if (!isCurrentPasswordValid) {
    res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
    return;
  }

  // Hash new password
  const hashedNewPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { password: hashedNewPassword }
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

