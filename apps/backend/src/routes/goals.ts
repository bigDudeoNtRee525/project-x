import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createGoalSchema = z.object({
    title: z.string().min(1).max(500),
    type: z.enum(['YEARLY', 'QUARTERLY']),
    parentId: z.string().optional(),
    targetDate: z.string().optional(), // ISO date string
    status: z.enum(['on-track', 'at-risk', 'behind', 'completed']).optional(),
    progress: z.number().min(0).max(100).optional(),
});

const updateGoalSchema = createGoalSchema.partial();

// Create a new goal
router.post('/', authenticate, async (req, res) => {
    try {
        const data = createGoalSchema.parse(req.body);

        const goal = await prisma.goal.create({
            data: {
                userId: req.user!.id,
                title: data.title,
                type: data.type,
                parentId: data.parentId,
            },
        });

        res.status(201).json({ goal });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error creating goal:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// List goals (hierarchical)
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user!.id;

        // Fetch all goals for the user
        const goals = await prisma.goal.findMany({
            where: { userId },
            include: {
                children: {
                    include: {
                        categories: {
                            include: {
                                tasks: true
                            }
                        },
                        tasks: true
                    }
                },
                categories: {
                    include: {
                        tasks: true
                    }
                },
                tasks: true
            },
            orderBy: { createdAt: 'asc' },
        });

        // We want to return a hierarchy. 
        // The schema supports infinite nesting via parentId, but our UI expects Yearly -> Quarterly.
        // Let's filter for top-level goals (no parentId) and include their children.
        // Actually, `include: { children: ... }` above only goes one level deep.
        // If we want full tree, we might need recursive query or just fetch all and build tree in code.
        // Given the UI expectation (Yearly -> Quarterly), fetching top level (Yearly) and including children (Quarterly) should be enough.

        const topLevelGoals = goals.filter(g => !g.parentId);

        // We can just return the top level goals with their children populated by Prisma include.
        // But wait, `children` in the include above will populate the direct children.
        // If Yearly goals are top level, their children are Quarterly goals.
        // So `topLevelGoals` will have `children` array containing Quarterly goals.

        res.json({ goals: topLevelGoals });
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a goal
router.patch('/:id', authenticate, async (req, res) => {
    try {
        const data = updateGoalSchema.parse(req.body);
        const userId = req.user!.id;

        const goal = await prisma.goal.update({
            where: { id: req.params.id, userId }, // Ensure ownership
            data: {
                title: data.title,
                type: data.type,
                parentId: data.parentId,
            },
        });

        res.json({ goal });
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a goal
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const userId = req.user!.id;
        await prisma.goal.delete({
            where: { id: req.params.id, userId },
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
