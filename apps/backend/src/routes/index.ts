import { Router } from 'express';
import authRoutes from './auth';
import meetingRoutes from './meetings';
import taskRoutes from './tasks';
import contactRoutes from './contacts';
import goalRoutes from './goals';
import categoryRoutes from './categories';

const router = Router();

router.use('/auth', authRoutes);
router.use('/meetings', meetingRoutes);
router.use('/tasks', taskRoutes);
router.use('/contacts', contactRoutes);
router.use('/goals', goalRoutes);
router.use('/categories', categoryRoutes);

export default router;