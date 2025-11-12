import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as planningController from '../controllers/planningController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Degree audit routes
router.get('/degree-audit', planningController.getDegreeAudit);
router.get('/requirements', planningController.getRequirements);
router.get('/progress', planningController.getProgress);

// Advisor routes
router.get('/advisor', planningController.getAdvisor);

// Course planning routes
router.get('/plan', planningController.getCoursePlan);
router.post('/plan', planningController.saveCoursePlan);

export default router;
