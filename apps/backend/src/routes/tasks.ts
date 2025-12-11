import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { loadTeamContext, buildPersonalAndTeamWhere } from '../middleware/team';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const router = Router();

// Validation schemas
const updateTaskSchema = z.object({
  description: z.string().min(1).optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
  deadline: z.string().datetime().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  reviewed: z.boolean().optional(),
});

// Validation schema for creating a task
const createTaskSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  assigneeIds: z.array(z.string().uuid()).optional().default([]),
  deadline: z.string().datetime().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  goalId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  meetingId: z.string().uuid().optional().nullable(),
  scope: z.enum(['personal', 'team']).optional().default('personal'),
});

// Helper to format assignees from join table
const formatTaskWithAssignees = (task: any) => {
  const { assignees, ...rest } = task;
  return {
    ...rest,
    assignees: assignees?.map((a: any) => ({
      id: a.contact.id,
      name: a.contact.name,
      email: a.contact.email,
    })) || [],
  };
};

// Create a new task
router.post('/', authenticate, loadTeamContext, async (req, res) => {
  try {
    const data = createTaskSchema.parse(req.body);
    const userId = req.user!.id;

    // Determine teamId based on scope
    const teamId = data.scope === 'team' && req.team?.teamId ? req.team.teamId : null;

    const newTask = await prisma.task.create({
      data: {
        description: data.description,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        status: data.status,
        priority: data.priority,
        goalId: data.goalId ?? undefined,
        categoryId: data.categoryId ?? undefined,
        meetingId: data.meetingId ?? undefined,
        userId,
        teamId,
        reviewed: true, // Manually created tasks are considered reviewed
        aiExtracted: false, // Not AI-extracted
        assignees: {
          create: data.assigneeIds.map((contactId) => ({
            contactId,
          })),
        },
      },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
          },
        },
        assignees: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({ task: formatTaskWithAssignees(newTask) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating task:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// List tasks with filters (personal + team data)
router.get('/', authenticate, loadTeamContext, async (req, res) => {
  try {
    const {
      status,
      assigneeId,
      fromDate,
      toDate,
      meetingId,
      reviewed,
      scope, // 'personal', 'team', or 'all' (default)
    } = req.query;

    const userId = req.user!.id;
    const teamId = req.team?.teamId;

    // Build where clause based on scope
    let where: any;
    if (scope === 'personal') {
      where = { userId, teamId: null };
    } else if (scope === 'team' && teamId) {
      where = { teamId };
    } else {
      // Default: all (personal + team)
      where = buildPersonalAndTeamWhere(userId, teamId);
    }

    if (status) where.status = status;
    // Filter tasks that have a specific assignee (among their assignees)
    if (assigneeId) {
      if (assigneeId === 'unassigned') {
        where.assignees = { none: {} };
      } else {
        where.assignees = { some: { contactId: assigneeId } };
      }
    }
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
        assignees: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.json({ tasks: tasks.map(formatTaskWithAssignees) });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task
router.patch('/:id', authenticate, loadTeamContext, async (req, res) => {
  try {
    const data = updateTaskSchema.parse(req.body);
    const taskId = req.params.id;
    const userId = req.user!.id;
    const teamId = req.team?.teamId;

    // Verify task belongs to user (personal) or their team
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        ...buildPersonalAndTeamWhere(userId, teamId),
      },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Separate assigneeIds from other data
    const { assigneeIds, ...otherData } = data;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...otherData,
        reviewed: data.reviewed !== undefined ? data.reviewed : true,
        reviewedAt: data.reviewed !== undefined ? (data.reviewed ? new Date() : null) : undefined,
        // Update assignees if provided
        ...(assigneeIds !== undefined && {
          assignees: {
            deleteMany: {},
            create: assigneeIds.map((contactId) => ({
              contactId,
            })),
          },
        }),
      },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
          },
        },
        assignees: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.json({ task: formatTaskWithAssignees(updatedTask) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark task as reviewed
router.put('/:id/review', authenticate, loadTeamContext, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user!.id;
    const teamId = req.team?.teamId;

    // Verify task belongs to user (personal) or their team
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        ...buildPersonalAndTeamWhere(userId, teamId),
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
router.delete('/:id', authenticate, loadTeamContext, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user!.id;
    const teamId = req.team?.teamId;

    // Verify task belongs to user (personal) or their team
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        ...buildPersonalAndTeamWhere(userId, teamId),
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