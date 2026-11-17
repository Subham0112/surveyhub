import { Router } from 'express';
import { login, logout, me, register } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { asyncHandler } from '../lib/http';
import { loginSchema, registerSchema } from '../validation/auth.schema';

const router = Router();

router.post('/login', validateBody(loginSchema), asyncHandler(login));
router.post('/register', validateBody(registerSchema), asyncHandler(register));
router.post('/logout', logout);
router.get('/me', requireAuth, asyncHandler(me));

export default router;
