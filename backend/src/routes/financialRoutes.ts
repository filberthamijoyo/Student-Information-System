import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as financialController from '../controllers/financialController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Account routes
router.get('/account', financialController.getAccount);

// Charges routes
router.get('/charges', financialController.getCharges);
router.get('/charges/unpaid', financialController.getUnpaidCharges);

// Payment routes
router.get('/payments', financialController.getPayments);
router.post('/payments', financialController.makePayment);

// Statement routes
router.get('/statement/:semester/:year', financialController.getStatement);

export default router;
