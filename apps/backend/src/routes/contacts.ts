import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createContactSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional().or(z.literal('')),
  role: z.string().max(100).optional(),
});

// List user's contacts
router.get('/', authenticate, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const contacts = await prisma.contact.findMany({
      where: { userId: req.user.id },
      orderBy: { name: 'asc' },
    });

    res.json({ contacts });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new contact
router.post('/', authenticate, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const data = createContactSchema.parse(req.body);

    const contact = await prisma.contact.create({
      data: {
        userId: req.user.id,
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