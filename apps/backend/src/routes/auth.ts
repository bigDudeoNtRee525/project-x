import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

// Get current user profile with team info
router.get('/me', authenticate, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If user doesn't exist in our database yet, create a profile
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.email.split('@')[0], // Default name
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    // Fetch team membership if exists
    const teamMembership = await prisma.teamMember.findUnique({
      where: { userId: req.user.id },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
              orderBy: { joinedAt: 'asc' },
            },
          },
        },
      },
    });

    const team = teamMembership
      ? {
          id: teamMembership.team.id,
          name: teamMembership.team.name,
          slug: teamMembership.team.slug,
          createdAt: teamMembership.team.createdAt,
          role: teamMembership.role as 'owner' | 'member',
          members: teamMembership.team.members.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            joinedAt: m.joinedAt,
          })),
        }
      : null;

    res.json({ user, team });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;