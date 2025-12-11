import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { loadTeamContext, buildPersonalAndTeamWhere } from '../middleware/team';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createContactSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional().or(z.literal('')),
  role: z.string().max(100).optional(),
  scope: z.enum(['personal', 'team']).optional().default('personal'),
});

// List user's contacts (personal + team)
router.get('/', authenticate, loadTeamContext, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { scope } = req.query;
    const userId = req.user.id;
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

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json({ contacts });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get contacts with task statistics (personal + team)
router.get('/stats', authenticate, loadTeamContext, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date();
    const { scope } = req.query;
    const userId = req.user.id;
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

    const contactsWithTasks = await prisma.contact.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        taskAssignments: {
          include: {
            task: {
              select: {
                id: true,
                status: true,
                deadline: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    const contactsWithStats = contactsWithTasks.map((contact) => {
      const tasks = contact.taskAssignments.map((ta) => ta.task);

      // Calculate basic counts
      const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
      const completedCount = tasks.filter((t) => t.status === 'completed').length;

      // Backlog: tasks past deadline that aren't completed or cancelled
      const backlogTasks = tasks.filter((t) => {
        if (!t.deadline || t.status === 'completed' || t.status === 'cancelled') return false;
        return new Date(t.deadline) < now;
      });
      const backlogCount = backlogTasks.length;

      const totalTasks = tasks.length;

      // Delivery rate: % of tasks completed
      const deliveryRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

      // Average backlog days: how many days past deadline for backlogged items
      const avgBacklogDays = backlogTasks.length > 0
        ? Math.round(backlogTasks.reduce((sum, t) => {
            const daysPastDeadline = Math.floor((now.getTime() - new Date(t.deadline!).getTime()) / (1000 * 60 * 60 * 24));
            return sum + daysPastDeadline;
          }, 0) / backlogTasks.length)
        : 0;

      // Productivity score: completed vs (total + backlog penalty)
      const productivityScore = totalTasks > 0
        ? Math.round((completedCount / (totalTasks + backlogCount)) * 100)
        : 100;

      // Remove taskAssignments from response, return stats instead
      const { taskAssignments, ...contactData } = contact;

      return {
        ...contactData,
        stats: {
          inProgressCount,
          backlogCount,
          completedCount,
          totalTasks,
          deliveryRate,
          avgBacklogDays,
          productivityScore,
        },
      };
    });

    res.json({ contacts: contactsWithStats });
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new contact
router.post('/', authenticate, loadTeamContext, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const data = createContactSchema.parse(req.body);

    // Determine teamId based on scope
    const teamId = data.scope === 'team' && req.team?.teamId ? req.team.teamId : null;

    const contact = await prisma.contact.create({
      data: {
        userId: req.user.id,
        teamId,
        name: data.name,
        email: data.email || null,
        role: data.role || null,
      },
    });

    res.status(201).json({ contact });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;