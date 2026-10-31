import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getDashboardKPIs } from '../controllers/reports';
const router = Router();
router.use(authenticate);
router.get('/dashboard', getDashboardKPIs);
export default router;
