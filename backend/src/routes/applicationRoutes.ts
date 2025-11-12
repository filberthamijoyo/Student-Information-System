import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as applicationController from '../controllers/applicationController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Student routes
router.get('/', applicationController.getMyApplications);
router.post('/', applicationController.submitApplication);
router.get('/:id', applicationController.getApplication);
router.put('/:id/withdraw', applicationController.withdrawApplication);

// Admin routes
router.get('/admin/pending', applicationController.getPendingApplications);
router.put('/admin/:id/review', applicationController.reviewApplication);

export default router;
