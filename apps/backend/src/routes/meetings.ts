import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { loadTeamContext, buildPersonalAndTeamWhere } from '../middleware/team';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { deepSeekService } from '../services/ai.service';

const router = Router();

// Validation schemas
const createMeetingSchema = z.object({
  title: z.string().min(1).max(500),
  transcript: z.string().min(1),
  metadata: z.object({}).passthrough().optional(),
  scope: z.enum(['personal', 'team']).optional().default('personal'),
});

// Create a new meeting
router.post('/', authenticate, loadTeamContext, async (req, res) => {
  try {
    const data = createMeetingSchema.parse(req.body);
    const userId = req.user!.id;

    // Determine teamId based on scope
    const teamId = data.scope === 'team' && req.team?.teamId ? req.team.teamId : null;

    const meeting = await prisma.meeting.create({
      data: {
        userId,
        teamId,
        title: data.title,
        transcript: data.transcript,
        metadata: data.metadata || {},
      },
    });

    // Start AI Processing in the background (Fire-and-forget to avoid timeout)
    // In a production app, use a proper queue (BullMQ, etc.)
    (async () => {
      // Check if AI is configured
      if (!deepSeekService.isConfigured()) {
        console.warn(`AI not configured (DEEPSEEKAUTH not set). Skipping processing for meeting ${meeting.id}`);
        await prisma.meeting.update({
          where: { id: meeting.id },
          data: {
            processed: true,
            processedAt: new Date(),
            metadata: {
              ...(meeting.metadata as object || {}),
              processingStatus: 'skipped',
              processingError: 'AI service not configured (DEEPSEEKAUTH not set)',
            },
          },
        });
        return;
      }

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
          for (const t of extractedTasks) {
            await tx.task.create({
              data: {
                meetingId: meeting.id,
                userId,
                teamId,
                title: t.title,
                description: t.description || '',
                priority: t.priority,
                deadline: t.deadline ? new Date(t.deadline) : null,
                goalId: contextResult?.goalId,
                categoryId: contextResult?.categoryId,
                aiExtracted: true,
                status: 'pending',
                ...(t.assigneeId && {
                  assignees: {
                    create: { contactId: t.assigneeId },
                  },
                }),
              },
            });
          }

          await tx.meeting.update({
            where: { id: meeting.id },
            data: {
              processed: true,
              processedAt: new Date(),
              metadata: {
                ...(meeting.metadata as object || {}),
                processingStatus: 'success',
                taskCount: extractedTasks.length,
              },
            },
          });
        });

        console.log(`Meeting ${meeting.id} processed successfully.`);
      } catch (err: any) {
        console.error(`Error processing meeting ${meeting.id}:`, err);
        // Update meeting to indicate processing failed
        try {
          await prisma.meeting.update({
            where: { id: meeting.id },
            data: {
              processed: true,
              processedAt: new Date(),
              metadata: {
                ...(meeting.metadata as object || {}),
                processingStatus: 'failed',
                processingError: err?.message || 'Unknown error during AI processing',
              },
            },
          });
        } catch (updateErr) {
          console.error(`Failed to update meeting ${meeting.id} with error status:`, updateErr);
        }
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

// List user's meetings (personal + team)
router.get('/', authenticate, loadTeamContext, async (req, res) => {
  try {
    const { scope } = req.query;
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

    const meetings = await prisma.meeting.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        processed: true,
        processedAt: true,
        createdAt: true,
        teamId: true,
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
router.get('/:id', authenticate, loadTeamContext, async (req, res) => {
  try {
    const userId = req.user!.id;
    const teamId = req.team?.teamId;

    const meeting = await prisma.meeting.findFirst({
      where: {
        id: req.params.id,
        ...buildPersonalAndTeamWhere(userId, teamId),
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
router.post('/:id/reprocess', authenticate, loadTeamContext, async (req, res) => {
  try {
    const meetingId = req.params.id as string;
    const userId = req.user!.id;
    const teamId = req.team?.teamId;

    // Verify meeting exists and belongs to user or their team
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        ...buildPersonalAndTeamWhere(userId, teamId),
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
      // Check if AI is configured
      if (!deepSeekService.isConfigured()) {
        console.warn(`AI not configured (DEEPSEEKAUTH not set). Cannot reprocess meeting ${meetingId}`);
        await prisma.meeting.update({
          where: { id: meetingId },
          data: {
            processed: true,
            processedAt: new Date(),
            metadata: {
              ...(meeting.metadata as object || {}),
              processingStatus: 'skipped',
              processingError: 'AI service not configured (DEEPSEEKAUTH not set)',
            },
          },
        });
        return;
      }

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
          for (const t of extractedTasks) {
            await tx.task.create({
              data: {
                meetingId,
                userId,
                teamId: meeting.teamId,
                title: t.title,
                description: t.description || '',
                priority: t.priority,
                deadline: t.deadline ? new Date(t.deadline) : null,
                goalId: contextResult?.goalId,
                categoryId: contextResult?.categoryId,
                aiExtracted: true,
                status: 'pending',
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
              metadata: {
                ...(meeting.metadata as object || {}),
                processingStatus: 'success',
                taskCount: extractedTasks.length,
              },
            },
          });
        });

        console.log(`Meeting ${meetingId} reprocessed successfully.`);
      } catch (err: any) {
        console.error(`Error reprocessing meeting ${meetingId}:`, err);
        // Update meeting to indicate processing failed
        try {
          await prisma.meeting.update({
            where: { id: meetingId },
            data: {
              processed: true,
              processedAt: new Date(),
              metadata: {
                ...(meeting.metadata as object || {}),
                processingStatus: 'failed',
                processingError: err?.message || 'Unknown error during AI processing',
              },
            },
          });
        } catch (updateErr) {
          console.error(`Failed to update meeting ${meetingId} with error status:`, updateErr);
        }
      }
    })();

    res.json({ success: true, message: 'Reprocessing started' });
  } catch (error) {
    console.error('Error reprocessing meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a meeting
router.delete('/:id', authenticate, loadTeamContext, async (req, res) => {
  try {
    const userId = req.user!.id;
    const teamId = req.team?.teamId;

    const meeting = await prisma.meeting.findFirst({
      where: {
        id: req.params.id,
        ...buildPersonalAndTeamWhere(userId, teamId),
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
router.post('/:id/confirm-tasks', authenticate, loadTeamContext, async (req, res) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user!.id;
    const teamId = req.team?.teamId;

    // Verify meeting exists and belongs to user or their team
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        ...buildPersonalAndTeamWhere(userId, teamId),
      },
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Update all tasks for this meeting to be reviewed
    const result = await prisma.task.updateMany({
      where: {
        meetingId,
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