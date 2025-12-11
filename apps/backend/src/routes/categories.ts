import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const router = Router();

const createCategorySchema = z.object({
    name: z.string().min(1).max(255),
    goalId: z.string().optional(),
});

const updateCategorySchema = createCategorySchema.partial();

// Create a category
router.post('/', authenticate, async (req, res) => {
    try {
        const data = createCategorySchema.parse(req.body);

        const category = await prisma.category.create({
            data: {
                userId: req.user!.id,
                name: data.name,
                goalId: data.goalId,
            },
        });

        res.status(201).json(category);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// List categories
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user!.id;
        const categories = await prisma.category.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                tasks: true,
            }
        });
        res.json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a category
router.patch('/:id', authenticate, async (req, res) => {
    try {
        const data = updateCategorySchema.parse(req.body);
        const userId = req.user!.id;

        const category = await prisma.category.update({
            where: { id: req.params.id, userId },
            data: {
                name: data.name,
                goalId: data.goalId,
            },
        });

        res.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a category
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const userId = req.user!.id;
        await prisma.category.delete({
            where: { id: req.params.id, userId },
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
