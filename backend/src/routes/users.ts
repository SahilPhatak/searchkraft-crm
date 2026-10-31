import { Router } from 'express';
import { authenticate } from '../middleware/auth';
const router = Router();
router.use(authenticate);
// TODO: wire controllers for users
export default router;
