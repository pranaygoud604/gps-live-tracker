import { Router } from 'express';
import { login, logout, me } from '../controllers/authController';
import { loginRateLimiter } from '../middleware/rateLimiter';
import { validate, loginSchema } from '../middleware/validator';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', loginRateLimiter, validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;
