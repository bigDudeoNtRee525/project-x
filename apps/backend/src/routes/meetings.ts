import { Router } from 'express';
import { optionalAuthenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { deepSeekService, type ExtractedTask } from '../services/ai.service';

const router = Router();

// Validation schemas
const createMeetingSchema = z.object({
  title: z.string().min(1).max(500),
  transcript: z.string().min(1),
  metadata: z.object({}).passthrough().optional(),
});

// Create a new meeting
router.post('/', optionalAuthenticate, async (req, res) => {

  try {
    const data = createMeetingSchema.parse(req.body);
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    const meeting = await prisma.meeting.create({
      data: {
        userId,
        title: data.title,
        transcript: data.transcript,
        metadata: data.metadata || {},
      },
    });

    // Start AI Processing in the background (Fire-and-forget to avoid timeout)
    // In a production app, use a proper queue (BullMQ, etc.)
    (async () => {
      try {
        console.log(`Starting AI processing for meeting ${meeting.id}...`);

        // 1. Fetch Context (Goals & Contacts)
        const [goals, contacts] = await Promise.all([
          prisma.goal.findMany({
            where: { userId },
            include: { categories: true },
          }),
          prisma.contact.findMany({
            where: { userId },
          }),
        ]);

        // 2. Identify Goal/Category
        console.log('Identifying goal...');
        const contextResult = await deepSeekService.identifyGoal(data.transcript, goals);

        let contextName = 'General';
        if (contextResult?.goalId) {
          const g = goals.find(g => g.id === contextResult.goalId);
          if (g) contextName = g.title;
        } else if (contextResult?.categoryId) {
          // Find category name
          for (const g of goals) {
            const c = g.categories.find(cat => cat.id === contextResult.categoryId);
            if (c) {
              contextName = c.name;
              break;
            }
          }
        }

        // 3. Extract Tasks
        console.log(`Extracting tasks with context: ${contextName}...`);
        const extractedTasks = await deepSeekService.extractTasks(data.transcript, contextName, contacts);

        // 4. Save Tasks & Update Meeting
        console.log(`Saving ${extractedTasks.length} tasks...`);
        await prisma.$transaction(async (tx) => {
          // Create tasks with assignees (can't use createMany with nested relations)
          for (const t of extractedTasks) {
            await tx.task.create({
              data: {
                meetingId: meeting.id,
                userId,
                title: t.title,
                description: t.description || '',
                priority: t.priority,
                deadline: t.deadline ? new Date(t.deadline) : null,
                goalId: contextResult?.goalId,
                categoryId: contextResult?.categoryId,
                aiExtracted: true,
                status: 'pending',
                // Create assignee relationship if AI extracted an assignee
                ...(t.assigneeId && {
                  assignees: {
                    create: { contactId: t.assigneeId },
                  },
                }),
              },
            });
          }

          // Update meeting status
          await tx.meeting.update({
            where: { id: meeting.id },
            data: {
              processed: true,
              processedAt: new Date(),
            },
          });
        });

        console.log(`Meeting ${meeting.id} processed successfully.`);
      } catch (err) {
        console.error(`Error processing meeting ${meeting.id}:`, err);
      }
    })();

    res.status(201).json({
      id: meeting.id,
      title: meeting.title,
      processed: false, // Initially false, updated in background
      createdAt: meeting.createdAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List user's meetings
router.get('/', optionalAuthenticate, async (req, res) => {

  try {
    const meetings = await prisma.meeting.findMany({
      where: { userId: req.user?.id || '00000000-0000-0000-0000-000000000000' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        processed: true,
        processedAt: true,
        createdAt: true,
        _count: {
          select: { tasks: true },
        },
      },
    });

    res.json({ meetings });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get meeting details with tasks
router.get('/:id', optionalAuthenticate, async (req, res) => {

  try {
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: req.params.id,
        userId: req.user?.id || '00000000-0000-0000-0000-000000000000', // Ensure user owns this meeting
      },
      include: {
        tasks: {
          orderBy: { createdAt: 'asc' },
          include: {
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
        },
      },
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Format tasks with assignees array
    const formattedMeeting = {
      ...meeting,
      tasks: meeting.tasks.map((task) => {
        const { assignees, ...rest } = task;
        return {
          ...rest,
          assignees: assignees.map((a) => ({
            id: a.contact.id,
            name: a.contact.name,
            email: a.contact.email,
          })),
        };
      }),
    };

    res.json({ meeting: formattedMeeting });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reprocess a meeting (re-run AI extraction)
router.post('/:id/reprocess', optionalAuthenticate, async (req, res) => {
  try {
    const meetingId = req.params.id as string;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    // Verify meeting exists and belongs to user
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        userId,
      },
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Delete existing AI-extracted tasks for this meeting
    await prisma.task.deleteMany({
      where: {
        meetingId,
        aiExtracted: true,
      },
    });

    // Reset meeting processing status
    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        processed: false,
        processedAt: null,
      },
    });

    // Start AI Processing in the background
    (async () => {
      try {
        console.log(`Starting AI reprocessing for meeting ${meetingId}...`);

        // 1. Fetch Context (Goals & Contacts)
        const [goals, contacts] = await Promise.all([
          prisma.goal.findMany({
            where: { userId },
            include: { categories: true },
          }),
          prisma.contact.findMany({
            where: { userId },
          }),
        ]);

        // 2. Identify Goal/Category
        console.log('Identifying goal...');
        const contextResult = await deepSeekService.identifyGoal(meeting.transcript, goals);

        let contextName = 'General';
        if (contextResult?.goalId) {
          const g = goals.find(g => g.id === contextResult.goalId);
          if (g) contextName = g.title;
        } else if (contextResult?.categoryId) {
          for (const g of goals) {
            const c = g.categories.find(cat => cat.id === contextResult.categoryId);
            if (c) {
              contextName = c.name;
              break;
            }
          }
        }

        // 3. Extract Tasks
        console.log(`Extracting tasks with context: ${contextName}...`);
        const extractedTasks = await deepSeekService.extractTasks(meeting.transcript, contextName, contacts);

        // 4. Save Tasks & Update Meeting
        console.log(`Saving ${extractedTasks.length} tasks...`);
        await prisma.$transaction(async (tx) => {
          // Create tasks with assignees (can't use createMany with nested relations)
          for (const t of extractedTasks) {
            await tx.task.create({
              data: {
                meetingId,
                userId,
                title: t.title,
                description: t.description || '',
                priority: t.priority,
                deadline: t.deadline ? new Date(t.deadline) : null,
                goalId: contextResult?.goalId,
                categoryId: contextResult?.categoryId,
                aiExtracted: true,
                status: 'pending',
                // Create assignee relationship if AI extracted an assignee
                ...(t.assigneeId && {
                  assignees: {
                    create: { contactId: t.assigneeId },
                  },
                }),
              },
            });
          }

          await tx.meeting.update({
            where: { id: meetingId },
            data: {
              processed: true,
              processedAt: new Date(),
            },
          });
        });

        console.log(`Meeting ${meetingId} reprocessed successfully.`);
      } catch (err) {
        console.error(`Error reprocessing meeting ${meetingId}:`, err);
      }
    })();

    res.json({ success: true, message: 'Reprocessing started' });
  } catch (error) {
    console.error('Error reprocessing meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a meeting
router.delete('/:id', optionalAuthenticate, async (req, res) => {
  try {
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: req.params.id,
        userId: req.user?.id || '00000000-0000-0000-0000-000000000000',
      },
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    await prisma.meeting.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Confirm all tasks for a meeting
router.post('/:id/confirm-tasks', optionalAuthenticate, async (req, res) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    // Verify meeting exists and belongs to user
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        userId,
      },
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Update all tasks for this meeting to be reviewed
    const result = await prisma.task.updateMany({
      where: {
        meetingId,
        userId,
        reviewed: false,
      },
      data: {
        reviewed: true,
        reviewedAt: new Date(),
      },
    });

    res.json({
      success: true,
      count: result.count,
      message: `Confirmed ${result.count} tasks`,
    });
  } catch (error) {
    console.error('Error confirming tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;