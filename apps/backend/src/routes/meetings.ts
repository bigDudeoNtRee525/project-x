import { Router } from 'express';
import { optionalAuthenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

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

    const meeting = await prisma.meeting.create({
      data: {
        userId: req.user?.id || '00000000-0000-0000-0000-000000000000', // Mock user ID for demo
        title: data.title,
        transcript: data.transcript,
        metadata: data.metadata || {},
      },
    });

    // TODO: Trigger AI processing via n8n webhook
    // This will be implemented in Phase 3

    res.status(201).json({
      id: meeting.id,
      title: meeting.title,
      processed: meeting.processed,
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
            assignee: {
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

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json({ meeting });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;