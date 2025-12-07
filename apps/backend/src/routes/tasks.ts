import { Router } from 'express';
import { optionalAuthenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const router = Router();

// Validation schemas
const updateTaskSchema = z.object({
  description: z.string().min(1).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  assigneeName: z.string().optional(),
  deadline: z.string().datetime().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  reviewed: z.boolean().optional(),
});

// List tasks with filters
router.get('/', optionalAuthenticate, async (req, res) => {

  try {
    const {
      status,
      assigneeId,
      fromDate,
      toDate,
      meetingId,
      reviewed,
    } = req.query;

    const where: any = {
      userId: req.user?.id || '00000000-0000-0000-0000-000000000000',
    };

    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;
    if (meetingId) where.meetingId = meetingId;
    if (reviewed !== undefined) where.reviewed = reviewed === 'true';

    if (fromDate || toDate) {
      where.deadline = {};
      if (fromDate) where.deadline.gte = new Date(fromDate as string);
      if (toDate) where.deadline.lte = new Date(toDate as string);
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { deadline: 'asc' },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task
router.patch('/:id', optionalAuthenticate, async (req, res) => {

  try {
    const data = updateTaskSchema.parse(req.body);
    const taskId = req.params.id;

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: req.user?.id || '00000000-0000-0000-0000-000000000000',
      },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...data,
        reviewed: data.reviewed !== undefined ? data.reviewed : true,
        reviewedAt: data.reviewed !== undefined ? (data.reviewed ? new Date() : null) : undefined,
      },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({ task: updatedTask });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark task as reviewed
router.put('/:id/review', optionalAuthenticate, async (req, res) => {

  try {
    const taskId = req.params.id;

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: req.user?.id || '00000000-0000-0000-0000-000000000000',
      },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        reviewed: true,
        reviewedAt: new Date(),
      },
    });

    res.json({ task: updatedTask });
  } catch (error) {
    console.error('Error marking task as reviewed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a task
router.delete('/:id', optionalAuthenticate, async (req, res) => {
  try {
    const taskId = req.params.id;

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: req.user?.id || '00000000-0000-0000-0000-000000000000',
      },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;