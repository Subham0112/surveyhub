import { Router } from 'express';
import {
  getUserHistory,
  getUserSurvey,
  listUserSurveys,
  submitUserResponse,
} from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { asyncHandler } from '../lib/http';
import { submitResponseSchema } from '../validation/user.schema';

const router = Router();

router.use(requireAuth);

router.get('/surveys', asyncHandler(listUserSurveys));
router.get('/surveys/:id', asyncHandler(getUserSurvey));
router.post(
  '/surveys/:id/responses',
  validateBody(submitResponseSchema),
  asyncHandler(submitUserResponse),
);
router.get('/history', asyncHandler(getUserHistory));

export default router;
