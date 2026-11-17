import { Router } from 'express';
import {
  createSurvey,
  deleteSurvey,
  getSurvey,
  getSurveyAnalytics,
  listSurveys,
  updateSurvey,
  updateSurveyStatus,
} from '../controllers/survey.controller';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { asyncHandler } from '../lib/http';
import { surveyInputSchema, surveyStatusSchema } from '../validation/survey.schema';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get('/', asyncHandler(listSurveys));
router.post('/', validateBody(surveyInputSchema), asyncHandler(createSurvey));
router.get('/:id', asyncHandler(getSurvey));
router.put('/:id', validateBody(surveyInputSchema), asyncHandler(updateSurvey));
router.patch('/:id/status', validateBody(surveyStatusSchema), asyncHandler(updateSurveyStatus));
router.delete('/:id', asyncHandler(deleteSurvey));
router.get('/:id/analytics', asyncHandler(getSurveyAnalytics));

export default router;
