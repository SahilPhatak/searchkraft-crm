import { Router } from 'express';
import { authenticate } from '../middleware/auth';
const router = Router();
router.use(authenticate);
// TODO: wire controllers for accounts
export default router;
