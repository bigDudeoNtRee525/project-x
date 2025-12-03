import { Router } from 'express';
import authRoutes from './auth';
import meetingRoutes from './meetings';
import taskRoutes from './tasks';
import contactRoutes from './contacts';

const router = Router();

router.use('/auth', authRoutes);
router.use('/meetings', meetingRoutes);
router.use('/tasks', taskRoutes);
router.use('/contacts', contactRoutes);

export default router;