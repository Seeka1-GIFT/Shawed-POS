import express from 'express';
import { register, login, getMe, updateProfile, changePassword } from '../controllers/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

export default router;




